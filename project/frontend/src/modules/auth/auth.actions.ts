"use server";

import { redirect } from "next/navigation";
import {
  IRegisterDto,
  ILoginBaseDto,
  IAuthResponseDto,
  IGoogleLoginDto,
  INewBaseAuth,
  IChangePasswordDto,
  IChangeEmailDto,
  IUnlinkProviderDto,
  IVerifyPasswordDto,
  IVerifyGoogleDto,
  IResponseLoginInfoDto,
  IDeleteAccountDto,
  IDeleteAccountResponseDto,
} from "./auth.dto";
import { cookies, headers } from "next/headers";
import { EnvConfig } from "@/lib/env/env-config.lib";

import { ISuccessResponse } from "@/types/base.types";
import { ResponseFactory } from "@/lib/res/response.factory";
import { ApiResponse } from "@/types/api.types";
import { apiRequest } from "@/lib/api/http.client";
import { apiClient } from "@/lib/api/api-client.lib";

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
    let tokens: { accessToken: string; refreshToken: string } | undefined;

    const res = await apiRequest<IAuthResponseDto>(
      apiClient.auth.register.url,
      {
        method: apiClient.auth.register.method,
        body: data,
      },
    );

    if (res && "data" in res && res.data != undefined) {
      tokens = res.data.tokens;

      if (tokens) {
        await setAuthCookies(tokens);
        return {
          success: true,
          message: "Register successfully",
        } as ISuccessResponse;
      }
    }
  } catch (err: unknown) {
    return ResponseFactory.handleError(err);
  }
}

export async function loginBaseAction(data: ILoginBaseDto) {
  try {
    let tokens: { accessToken: string; refreshToken: string } | undefined;

    const res = await apiRequest<IAuthResponseDto>(
      apiClient.auth.loginBase.url,
      {
        method: apiClient.auth.loginBase.method,
        body: data,
      },
    );

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

export async function loginGoogleAction(
  token: IGoogleLoginDto,
  callback?: string,
) {
  let isSuccess = false;

  try {
    // const res: IAuthResponseDto | null | undefined =
    //   await AuthService.loginGoogle(token, {
    //     ipAddress,
    //     userAgent,
    //   });

    const res: ApiResponse<IAuthResponseDto, unknown> =
      await apiRequest<IAuthResponseDto>(apiClient.auth.loginGoogle.url, {
        method: apiClient.auth.loginGoogle.method,
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
    redirect(callback || "/");
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
      await apiRequest(apiClient.auth.logOut.url, {
        method: apiClient.auth.logOut.method,
        token: refreshToken,
      });
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
    const refreshToken = cookieStore.get("refresh_token")?.value;

    if (!refreshToken) throw new Error("No refresh token found");

    const res = await apiRequest<IAuthResponseDto>(apiClient.auth.refresh.url, {
      method: apiClient.auth.refresh.method,
      token: refreshToken,
    });
    if (res && "data" in res && res.data != undefined) {
      if (res.data.tokens) {
        const cookieOptions = {
          httpOnly: true,
          secure: EnvConfig.nodeValue === "production",
          sameSite: "lax" as const,
          path: "/",
        };

        cookieStore.set("access_token", res.data.tokens.accessToken, {
          ...cookieOptions,
          maxAge: EnvConfig.accessTokenExpireIn,
        });

        cookieStore.set("refresh_token", res.data.tokens.refreshToken, {
          ...cookieOptions,
          maxAge: EnvConfig.refreshTokenExpireIn,
        });

        return { success: true };
      }
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
    const res = await apiRequest(apiClient.auth.createBaseAuth.url, {
      method: apiClient.auth.createBaseAuth.method,
      body: data,
    });
    //console.log(res);
    return res;
  } catch (err) {
    return ResponseFactory.handleError(err);
  }
}

export async function changePasswordAction(data: IChangePasswordDto) {
  try {
    const headerList = await headers();
    const currentUserId = headerList.get("X-User-Id");
    if (!currentUserId) {
      throw new Error("Unauthorized");
    }
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("refresh_token")?.value;
    const res = await apiRequest(apiClient.auth.changePassword.url, {
      method: apiClient.auth.changePassword.method,
      body: data,
      headers: refreshToken ? { "x-session-token": refreshToken } : {},
    });
    return res;
  } catch (err) {
    return ResponseFactory.handleError(err);
  }
}

export async function changeEmailAction(data: IChangeEmailDto) {
  try {
    const headerList = await headers();
    const currentUserId = headerList.get("X-User-Id");
    if (!currentUserId) {
      throw new Error("Unauthorized");
    }
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("refresh_token")?.value;
    const res = await apiRequest(apiClient.auth.changeEmail.url, {
      method: apiClient.auth.changeEmail.method,
      body: data,
      headers: refreshToken ? { "x-session-token": refreshToken } : {},
    });
    return res;
  } catch (err) {
    return ResponseFactory.handleError(err);
  }
}

export async function unlinkProviderAction(data: IUnlinkProviderDto) {
  try {
    const headerList = await headers();
    const currentUserId = headerList.get("X-User-Id");
    if (!currentUserId) {
      throw new Error("Unauthorized");
    }
    const res = await apiRequest(apiClient.auth.unlinkProvider.url, {
      method: apiClient.auth.unlinkProvider.method,
      body: data,
    });
    return res;
  } catch (err) {
    return ResponseFactory.handleError(err);
  }
}

export async function linkGoogleAction(token: IGoogleLoginDto) {
  try {
    const headerList = await headers();
    const currentUserId = headerList.get("X-User-Id");
    if (!currentUserId) {
      throw new Error("Unauthorized");
    }
    const res = await apiRequest(apiClient.auth.linkGoogle.url, {
      method: apiClient.auth.linkGoogle.method,
      body: token,
    });
    return res;
  } catch (err) {
    return ResponseFactory.handleError(err);
  }
}

export async function verifyPasswordAction(data: IVerifyPasswordDto) {
  try {
    const headerList = await headers();
    const currentUserId = headerList.get("X-User-Id");
    if (!currentUserId) {
      throw new Error("Unauthorized");
    }
    const res = await apiRequest<IResponseLoginInfoDto>(
      apiClient.auth.verifyPassword.url,
      {
        method: apiClient.auth.verifyPassword.method,
        body: data,
      },
    );

    if (res && "data" in res && res.data != undefined) {
      return res.data;
    }
    return ResponseFactory.error({
      message: "Xác thực thất bại",
      code: 401,
    });
  } catch (err) {
    return ResponseFactory.handleError(err);
  }
}

export async function verifyGoogleAction(data: IVerifyGoogleDto) {
  try {
    const headerList = await headers();
    const currentUserId = headerList.get("X-User-Id");
    if (!currentUserId) {
      throw new Error("Unauthorized");
    }
    const res = await apiRequest<IResponseLoginInfoDto>(
      apiClient.auth.verifyGoogle.url,
      {
        method: apiClient.auth.verifyGoogle.method,
        body: data,
      },
    );

    if (res && "data" in res && res.data != undefined) {
      return res.data;
    }
    return ResponseFactory.error({
      message: "Xác thực thất bại",
      code: 401,
    });
  } catch (err) {
    return ResponseFactory.handleError(err);
  }
}

export async function deleteAccountAction(data: IDeleteAccountDto) {
  try {
    const headerList = await headers();
    const currentUserId = headerList.get("X-User-Id");
    if (!currentUserId) {
      throw new Error("Unauthorized");
    }
    const res = await apiRequest<IDeleteAccountResponseDto>(
      apiClient.auth.deleteAccount.url,
      {
        method: apiClient.auth.deleteAccount.method,
        body: data,
      },
    );

    if (res && "data" in res && res.data != undefined) {
      const cookieStore = await cookies();
      cookieStore.delete("access_token");
      cookieStore.delete("refresh_token");
      return res.data;
    }
    return ResponseFactory.error({
      message: "Xóa tài khoản thất bại",
      code: 400,
    });
  } catch (err) {
    return ResponseFactory.handleError(err);
  }
}
