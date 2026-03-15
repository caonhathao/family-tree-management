import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { AuthService } from "./modules/auth/auth.service";
import { JwtPayload } from "./types/base.types";
import { IAuthResponseDto } from "./modules/auth/auth.dto";

const publicRoutes = [
  "/",
  "/features",
  "/tutorials",
  "/auth",
  "/faq",
  "/api/auth/login-base",
  "/api/auth/register",
  "/api/auth/refresh",
  "/api/auth/login-google",
];
const roleRights = {
  ADMIN: [
    "/admin",
    "/admin/dashboard",
    "/admin/users",
    "/admin/user_feedbacks",
    "/admin/blogs",
    "/admin/blog_editor",
    "/admin/supports",
  ],
  USER: ["/profile"],
};
const JWT_ACCESS_KEY = process.env.JWT_ACCESS_SECRET_KEY || "";
const JWT_REFRESH_KEY = process.env.JWT_REFRESH_SECRET_KEY || "";

function isPublicRoute(pathname: string): boolean {
  if (publicRoutes.includes(pathname)) return true;
  return false;
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

  const userAgent = req.headers.get("user-agent") || "unknown";
  const userIp = req.headers.get("x-forwarded-for") || "unknown";

  let userId: string | null = null;
  let userRole: string | null = null;
  let finalResponse: NextResponse | null = null;

  // BƯỚC 1: Kiểm tra Access Token
  if (accessToken) {
    const payload = await verifyAndGetPayload(accessToken, JWT_ACCESS_KEY);
    userId = payload?.id || null;
    userRole = payload?.role || null;
  }

  // BƯỚC 2: Silent Refresh
  let result: IAuthResponseDto | null = null;
  if (!userId && refreshToken) {
    const refreshPayload = await verifyAndGetPayload(
      refreshToken,
      JWT_REFRESH_KEY,
    );
    const rUserId = refreshPayload?.id as string;

    if (rUserId) {
      try {
        result = await AuthService.refresh(rUserId, refreshToken, {
          userAgent,
          ipAddress: userIp,
        });

        if (result && result.tokens) {
          userId = result.user.id;
          userRole = result.user.role; // QUAN TRỌNG: Cập nhật role mới vào đây [cite: 17, 49]

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

  // BƯỚC 3: Kiểm tra quyền truy cập (RBAC)
  if (userId) {
    // Kiểm tra các route Admin [cite: 4, 25, 26]
    const isAdminRoute =
      pathname.startsWith("/admin") ||
      roleRights.ADMIN.some((route) => pathname.startsWith(route));

    if (isAdminRoute && userRole !== "ADMIN") {
      return NextResponse.redirect(new URL("/403", req.url));
    }

    if (pathname.startsWith("/auth")) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-user-id", userId);
    requestHeaders.set("x-user-role", userRole || "");

    if (result) {
      requestHeaders.set("x-access-token", result.tokens.accessToken);
    }

    const response = NextResponse.next({
      request: { headers: requestHeaders },
    });

    // Cập nhật Cookie mới cho trình duyệt (Nếu có refresh thành công)
    if (finalResponse) {
      const setCookie = finalResponse.headers.get("set-cookie");
      if (setCookie) {
        response.headers.set("set-cookie", setCookie);
      }
    }

    return response;
  }

  // BƯỚC 4: Xử lý Public Routes / Chưa Login
  if (isPublicRoute(pathname)) return NextResponse.next();
  if (pathname.startsWith("/api")) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const callbackUrl = encodeURIComponent(
    req.nextUrl.pathname + req.nextUrl.search,
  );
  return NextResponse.redirect(
    new URL(`/auth?mode=login&callbackUrl=${callbackUrl}`, req.url),
  );
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*$).*)"],
};
