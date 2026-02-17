import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { AuthService } from "./modules/auth/auth.service";
import { JwtPayload } from "./types/base.types";

const publicRoutes = [
  "/",
  "/auth",
  "/api/auth/login-base",
  "/api/auth/register",
  "/api/auth/refresh",
  "/api/auth/login-google",
];

const JWT_ACCESS_KEY = process.env.JWT_ACCESS_SECRET_KEY || "";
const JWT_REFRESH_KEY = process.env.JWT_REFRESH_SECRET_KEY || "";

function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some((route) => pathname.startsWith(route));
}

async function verifyAndGetPayload(token: string, secret: string) {
  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(secret),
    );
    return payload as unknown as JwtPayload; // Trả về payload (chứa sub, email...)
  } catch {
    return null;
  }
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const accessToken = req.cookies.get("access_token")?.value;
  const refreshToken = req.cookies.get("refresh_token")?.value;

  let userId: string | null = null;
  let finalResponse: NextResponse | null = null; // Biến lưu trữ response có cookie

  // BƯỚC 1: Kiểm tra Access Token
  if (accessToken) {
    const payload = await verifyAndGetPayload(accessToken, JWT_ACCESS_KEY);
    userId = payload?.payload.sub || null;
  }

  // BƯỚC 2: Silent Refresh
  if (!userId && refreshToken) {
    const refreshPayload = await verifyAndGetPayload(
      refreshToken,
      JWT_REFRESH_KEY,
    );
    const rUserId = refreshPayload?.payload.sub as string;

    if (rUserId) {
      try {
        const result = await AuthService.refresh(rUserId, refreshToken);
        if (result && result.tokens) {
          userId = result.user.id;

          // Tạo response và SET COOKIE
          finalResponse = pathname.startsWith("/auth")
            ? NextResponse.redirect(new URL("/", req.url))
            : NextResponse.next();

          const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax" as const,
            path: "/",
          };

          finalResponse.cookies.set("access_token", result.tokens.accessToken, {
            ...cookieOptions,
            maxAge: 15 * 60,
          });
          finalResponse.cookies.set(
            "refresh_token",
            result.tokens.refreshToken,
            {
              ...cookieOptions,
              maxAge: 7 * 24 * 60 * 60,
            },
          );
        }
      } catch (error) {
        console.error("Refresh failed:", error);
      }
    }
  }

  // BƯỚC 3: Xử lý dựa trên userId
  if (userId) {
    if (pathname.startsWith("/auth")) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    // Nếu đã có finalResponse (vừa refresh xong), dùng nó. Nếu chưa, tạo mới.
    const response = finalResponse || NextResponse.next();
    response.headers.set("X-User-Id", userId);
    return response;
  }

  // BƯỚC 4: Chưa Login
  if (isPublicRoute(pathname)) return NextResponse.next();
  if (pathname.startsWith("/api"))
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  return NextResponse.redirect(new URL("/auth?mode=login", req.url));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*$).*)"],
};
