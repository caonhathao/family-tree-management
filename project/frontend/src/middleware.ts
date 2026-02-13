import { apiClient } from "@/lib/api/api-path.lib";
import { EnvConfig } from "@/lib/env/env-config.lib";
import { NextRequest, NextResponse } from "next/server";

const isTokenExpired = (token: string) => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
};

export async function middleware(request: NextRequest) {
  let accessToken = request.cookies.get("access_token")?.value;
  const refreshToken = request.cookies.get("refresh_token")?.value;
  let newTokens = null;

  // 1. Kiểm tra nếu không có Access Token nhưng vẫn còn Refresh Token
  if ((!accessToken || isTokenExpired(accessToken)) && refreshToken) {
    try {
      // 2. Gọi trực tiếp Backend NestJS
      const responseBackend = await fetch(
        EnvConfig.serverDomain + apiClient.auth.refresh,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${refreshToken}`,
          },
        },
      );

      const result = await responseBackend.json();
      console.log("result at middleware:", result);

      if (!responseBackend.ok || !result.success) {
        throw new Error("Refresh failed");
      }

      newTokens = result.data.tokens;
      accessToken = newTokens.accessToken; // Cập nhật token để set header bên dưới
    } catch (error) {
      console.error("Middleware Refresh Error:", error);
      // Nếu refresh lỗi, xóa sạch cookie và đá về login
      const response = NextResponse.redirect(new URL("/", request.url));
      response.cookies.delete("access_token");
      response.cookies.delete("refresh_token");
      return response;
    }
  }

  // 2. Thiết lập header Authorization cho request (cho cả trường hợp token cũ còn hạn hoặc vừa refresh)
  const requestHeaders = new Headers(request.headers);
  if (accessToken) {
    requestHeaders.set("Authorization", `Bearer ${accessToken}`);
  }

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // 3. Nếu vừa refresh thành công, set lại cookie vào response
  if (newTokens) {
    response.cookies.set("access_token", newTokens.accessToken, {
      httpOnly: true,
      path: "/",
      secure: EnvConfig.nodeValue === "production",
      sameSite: "lax",
      maxAge: EnvConfig.accessTokenExpireIn,
    });
    response.cookies.set("refresh_token", newTokens.refreshToken, {
      httpOnly: true,
      path: "/",
      secure: EnvConfig.nodeValue === "production",
      sameSite: "lax",
      maxAge: EnvConfig.refreshTokenExpireIn,
    });
  }

  return response;
}

// Chỉ chạy middleware trên các đường dẫn API hoặc Page cần bảo vệ
export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
