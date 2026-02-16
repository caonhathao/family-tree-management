import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { AuthService } from "./modules/auth/auth.service";
import { JwtPayload } from "./types/base.types";

const publicRoutes = [
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

  // BƯỚC 1: Kiểm tra Access Token hiện có
  if (accessToken) {
    const payload = await verifyAndGetPayload(accessToken, JWT_ACCESS_KEY);
    userId = payload?.payload.sub || null;
  }

  // BƯỚC 2: Silent Refresh - Nếu Access Token hỏng nhưng còn Refresh Token
  if (!userId && refreshToken) {
    const refreshPayload = await verifyAndGetPayload(
      refreshToken,
      JWT_REFRESH_KEY,
    );
    const rUserId = refreshPayload?.payload.sub as string;

    if (rUserId) {
      try {
        // GỌI TRỰC TIẾP SERVICE (Logic Prisma/JWT bạn đã viết)
        const result = await AuthService.refresh(rUserId, refreshToken);

        if (result && result.tokens) {
          userId = result.user.id;

          // Tạo Header mới để tiêm userId vào request hiện tại
          const requestHeaders = new Headers(req.headers);
          requestHeaders.set("X-User-Id", userId);

          // Tạo Response
          let response = NextResponse.next({
            request: { headers: requestHeaders },
          });

          // Nếu đang ở trang auth mà refresh thành công -> Redirect về Home
          if (pathname.startsWith("/auth")) {
            response = NextResponse.redirect(new URL("/", req.url));
          }

          // SET COOKIE MỚI (Để trình duyệt lưu cho lần sau)
          const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax" as const,
            path: "/",
          };

          response.cookies.set("access_token", result.tokens.accessToken, {
            ...cookieOptions,
            maxAge: 15 * 60,
          });
          response.cookies.set("refresh_token", result.tokens.refreshToken, {
            ...cookieOptions,
            maxAge: 7 * 24 * 60 * 60,
          });

          console.log(`>>> [Middleware] Silent Refresh success: ${userId}`);
          return response;
        }
      } catch (error) {
        console.error(">>> [Middleware] Refresh failed:", error);
        // Refresh thất bại (token lậu/hết hạn DB) -> sẽ trôi xuống phần Redirect Login
      }
    }
  }

  // BƯỚC 3: Xử lý Redirect dựa trên trạng thái Login (userId)

  // 3.1. Nếu đã Login
  if (userId) {
    // Không cho vào trang /auth nữa
    if (pathname.startsWith("/auth")) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    // Tiêm userId vào Header cho các request hợp lệ
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("X-User-Id", userId);
    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  // 3.2. Nếu chưa Login (userId === null)
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // Nếu là API mà không có quyền -> 401
  if (pathname.startsWith("/api")) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  // Nếu là trang UI -> Redirect về login
  return NextResponse.redirect(new URL("/auth?mode=login", req.url));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*$).*)"],
};
