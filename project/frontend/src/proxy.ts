import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { AuthService } from "./modules/auth/auth.service";
import { JwtPayload } from "./types/base.types";
import { IAuthResponseDto } from "./modules/auth/auth.dto";

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
    userId = payload?.payload.id || null;
  }

  // BƯỚC 2: Silent Refresh
  let result: IAuthResponseDto | null = null;
  if (!userId && refreshToken) {
    const refreshPayload = await verifyAndGetPayload(
      refreshToken,
      JWT_REFRESH_KEY,
    );
    const rUserId = refreshPayload?.payload.id as string;

    if (rUserId) {
      try {
        result = await AuthService.refresh(rUserId, refreshToken);
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

    // 1. Tạo bản sao của request headers hiện tại
    const requestHeaders = new Headers(req.headers);

    // 2. Nhét dữ liệu mới vào Request Headers (Dành cho Server Component đọc)
    requestHeaders.set("x-user-id", userId);
    if (finalResponse && result) {
      // Nếu vừa refresh, lấy token từ result của BƯỚC 2
      requestHeaders.set("x-access-token", result.tokens.accessToken);
    }

    // 3. Khởi tạo response từ NextResponse.next kèm theo request headers mới
    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

    // 4. QUAN TRỌNG: Nếu có finalResponse (có set-cookie), phải copy cookie sang response mới
    if (finalResponse) {
      finalResponse.cookies.getAll().forEach((cookie) => {
        response.cookies.set(cookie.name, cookie.value, {
          path: "/",
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: cookie.name === "access_token" ? 15 * 60 : 7 * 24 * 60 * 60,
        });
      });
    }

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
