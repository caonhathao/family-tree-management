import { NextRequest, NextResponse } from "next/server";
import { IAuthResponseDto } from "./modules/auth/auth.dto";
import { apiClient } from "./lib/api/api-client.lib";
import { apiRequest } from "./lib/api/http.client";

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

function isPublicRoute(pathname: string): boolean {
  if (publicRoutes.includes(pathname)) return true;
  return false;
}

async function verifyViaBackend(
  token: string,
): Promise<{ id: string; role: string } | null> {
  try {
    const res = await apiRequest<{ id: string; role: string }>(
      apiClient.auth.me.url,
      { method: "GET", token },
    );
    if (res && "data" in res && res.data) {
      return res.data;
    }
    return null;
  } catch {
    return null;
  }
}

async function refreshViaBackend(
  refreshToken: string,
): Promise<IAuthResponseDto | null> {
  const baseUrl = process.env.BACKEND_API_URL || "";
  if (!baseUrl) return null;
  try {
    const res = await apiRequest<IAuthResponseDto>(apiClient.auth.refresh.url, {
      method: apiClient.auth.refresh.method,
      token: refreshToken,
      headers: {
        Authorization: `Bearer ${refreshToken}`,
      },
    });
    if (res && "errors" in res) return null;
    else if (res && "data" in res && res.data != undefined) {
      return res.data as IAuthResponseDto;
    } else return null;
  } catch {
    return null;
  }
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const accessToken = req.cookies.get("access_token")?.value;
  const refreshToken = req.cookies.get("refresh_token")?.value;

  let userId: string | null = null;
  let userRole: string | null = null;
  let finalResponse: NextResponse | null = null;

  // BƯỚC 1: Xác thực Access Token qua Backend
  if (accessToken) {
    const me = await verifyViaBackend(accessToken);
    userId = me?.id || null;
    userRole = me?.role || null;
  }

  // BƯỚC 2: Silent Refresh (nếu access token hết hạn)
  let result: IAuthResponseDto | null = null;
  if (!userId && refreshToken) {
    try {
      result = await refreshViaBackend(refreshToken);

      if (result && result.tokens) {
        userId = result.user.id;
        userRole = result.user.role;

        finalResponse = pathname.startsWith("/auth")
          ? NextResponse.redirect(new URL("/", req.url))
          : NextResponse.next();

        if (finalResponse.status >= 300 && finalResponse.status < 400) {
          finalResponse.headers.set("x-middleware-cache", "no-cache");
        }

        const cookieOptions = {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax" as const,
          path: "/",
        };

        finalResponse.cookies.set("access_token", result.tokens.accessToken, {
          ...cookieOptions,
          maxAge: result.tokens.accessTokenExpiresIn,
        });
        finalResponse.cookies.set("refresh_token", result.tokens.refreshToken, {
          ...cookieOptions,
          maxAge: result.tokens.refreshTokenExpiresIn,
        });
      }
    } catch (error) {
      console.error("Refresh failed:", error);
    }
  }

  // BƯỚC 3: Kiểm tra quyền truy cập (RBAC)
  if (userId) {
    const isAdminRoute =
      pathname.startsWith("/admin") ||
      roleRights.ADMIN.some((route) => pathname.startsWith(route));

    if (isAdminRoute && userRole !== "ADMIN") {
      const res = NextResponse.redirect(new URL("/403", req.url));
      res.headers.set("x-middleware-cache", "no-cache");
      return res;
    }

    if (pathname.startsWith("/auth")) {
      const res = NextResponse.redirect(new URL("/", req.url));
      res.headers.set("x-middleware-cache", "no-cache");
      return res;
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
  const loginRedirect = NextResponse.redirect(
    new URL(`/auth?mode=login&callbackUrl=${callbackUrl}`, req.url),
  );
  loginRedirect.headers.set("x-middleware-cache", "no-cache");
  return loginRedirect;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*$).*)"],
};
