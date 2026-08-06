"use server";

import { redirect } from "next/navigation";
import {
  IRegisterDto,
  ILoginBaseDto,
  IAuthResponseDto,
  IGoogleLoginDto,
  INewBaseAuth,
} from "./auth.dto";
import { cookies, headers } from "next/headers";
import { EnvConfig } from "@/lib/env/env-config.lib";
import { AuthService } from "./auth.service";

import { IJwtVerifyResult, ISuccessResponse } from "@/types/base.types";
import { jwtVerify } from "jose";
import { ResponseFactory } from "@/lib/res/response.factory";
import { ApiResponse } from "@/types/api.types";
import { apiRequest } from "@/lib/api/http.client";
import { apiClient } from "@/lib/api/api-path.lib";

const setAuthCookies = async (tokens: {
  accessToken: string;
  refreshToken: string;
}) => {
  const cookieStore = await cookies();
  cookieStore.set("access_token", tokens.accessToken, {
    httpOnly: true,
    secure: EnvConfig.nodeValue === "production",
    sameSite: "lax",
    path: "/",
    maxAge: EnvConfig.accessTokenExpireIn,
  });
  cookieStore.set("refresh_token", tokens.refreshToken, {
    httpOnly: true,
    secure: EnvConfig.nodeValue === "production",
    sameSite: "lax",
    path: "/",
    maxAge: EnvConfig.refreshTokenExpireIn,
  });
};

export async function registerAction(data: IRegisterDto) {
  try {
    const headerList = await headers();
    const ipAddress = headerList.get("x-forwarded-for") || "unknown";
    const userAgent = headerList.get("user-agent") || "unknown";

    let tokens: { accessToken: string; refreshToken: string } | undefined;

    try {
      const res = await apiRequest<IAuthResponseDto>(apiClient.auth.register, {
        method: "POST",
        body: data,
      });
      tokens = res.data?.tokens;
    } catch {
      const res:
        | IAuthResponseDto
        | null
        | ApiResponse<IAuthResponseDto, unknown> = await AuthService.register(
        data,
        {
          ipAddress,
          userAgent,
        },
      );
      if (res && "tokens" in res) {
        tokens = res.tokens;
      }
    }

    if (tokens) {
      await setAuthCookies(tokens);
      return {
        success: true,
        message: "Register successfully",
      } as ISuccessResponse;
    }
  } catch (err: unknown) {
    return ResponseFactory.handleError(err);
  }
}

export async function loginBaseAction(data: ILoginBaseDto) {
  try {
    const headerList = await headers();
    const ipAddress = headerList.get("x-forwarded-for") || "unknown";
    const userAgent = headerList.get("user-agent") || "unknown";

    let tokens: { accessToken: string; refreshToken: string } | undefined;

    const res = await apiRequest<IAuthResponseDto>(apiClient.auth.loginBase, {
      method: "POST",
      body: data,
    });

    if (res && "data" in res) {
      tokens = res.data?.tokens;

      if (tokens) {
        await setAuthCookies(tokens);
        return {
          success: true,
          message: "Login successfully",
        } as ISuccessResponse;
      }
    }
  } catch (err: unknown) {
    return ResponseFactory.handleError(err);
  }
}

export async function loginGoogleAction(token: IGoogleLoginDto) {
  let isSuccess = false;

  try {
    const headerList = await headers();
    const ipAddress = headerList.get("x-forwarded-for") || "unknown";
    const userAgent = headerList.get("user-agent") || "unknown";
    // const res: IAuthResponseDto | null | undefined =
    //   await AuthService.loginGoogle(token, {
    //     ipAddress,
    //     userAgent,
    //   });

    const res: ApiResponse<IAuthResponseDto, unknown> =
      await apiRequest<IAuthResponseDto>(apiClient.auth.loginGoogle, {
        method: "POST",
        body: token,
      });
    if (res && "errors" in res) {
      throw new Error(res.message || "Login failed");
    } else if (res && "data" in res && res.data != undefined) {
      isSuccess = true;
      const cookieStore = await cookies();

      cookieStore.set("access_token", res.data.tokens.accessToken, {
        httpOnly: true,
        secure: EnvConfig.nodeValue === "production",
        sameSite: "lax",
        path: "/",
        maxAge: EnvConfig.accessTokenExpireIn,
      });
      cookieStore.set("refresh_token", res.data.tokens.refreshToken, {
        httpOnly: true,
        secure: EnvConfig.nodeValue === "production",
        sameSite: "lax",
        path: "/",
        maxAge: EnvConfig.refreshTokenExpireIn,
      });
    }
  } catch (err) {
    return ResponseFactory.handleError(err);
  }
  if (isSuccess) {
    redirect("/");
  }
}

export async function logoutAction() {
  const cookieStore = await cookies();
  const headerList = await headers();

  // 1. Lấy userId từ Header (đã được Proxy/Middleware giải mã hoặc refresh hộ)
  const userId = headerList.get("X-User-Id");

  // 2. Lấy refreshToken để xóa chính xác session đó trong DB
  const refreshToken = cookieStore.get("refresh_token")?.value;

  try {
    if (userId && refreshToken) {
      // Gọi service để xóa session trong Database
      await AuthService.logout(userId, refreshToken);
    }
  } catch (err: unknown) {
    console.error("error at logout action", err);
    return ResponseFactory.handleError(err);
  }

  // 3. Xóa sạch dấu vết ở trình duyệt cho dù DB có lỗi hay không
  cookieStore.delete("access_token");
  cookieStore.delete("refresh_token");
}

export async function refreshAction() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("refresh_token")?.value;

    if (!token) throw new Error("No refresh token found");

    let tokens: { accessToken: string; refreshToken: string } | undefined;

    try {
      const res = await apiRequest<IAuthResponseDto>(apiClient.auth.refresh, {
        method: "POST",
        token,
      });
      tokens = res.data?.tokens;
    } catch {
      const payload: IJwtVerifyResult = await jwtVerify(
        token,
        new TextEncoder().encode(EnvConfig.jwtRefreshSecret),
      );
      const userId = payload?.payload.id;

      if (!userId) throw new Error("Invalid token payload");
      const headerList = await headers();

      const ipAddress = headerList.get("x-forwarded-for") || "unknown";
      const userAgent = headerList.get("user-agent") || "unknown";
      const res = await AuthService.refresh(userId, token, {
        ipAddress,
        userAgent,
      });

      if (res.tokens) {
        tokens = res.tokens;
      }
    }

    if (tokens) {
      const cookieOptions = {
        httpOnly: true,
        secure: EnvConfig.nodeValue === "production",
        sameSite: "lax" as const,
        path: "/",
      };

      cookieStore.set("access_token", tokens.accessToken, {
        ...cookieOptions,
        maxAge: EnvConfig.accessTokenExpireIn,
      });

      cookieStore.set("refresh_token", tokens.refreshToken, {
        ...cookieOptions,
        maxAge: EnvConfig.refreshTokenExpireIn,
      });

      return { success: true };
    }
  } catch (err: unknown) {
    return ResponseFactory.handleError(err);
  }
}

export async function createNewBaseAuth(data: INewBaseAuth) {
  try {
    const headerList = await headers();
    const currentUserId = headerList.get("X-User-Id");
    if (!currentUserId) {
      throw new Error("Unauthorized");
    }
    const res = await AuthService.createBaseAuth(data, currentUserId);
    //console.log(res);
    return res;
  } catch (err) {
    return ResponseFactory.handleError(err);
  }
}
