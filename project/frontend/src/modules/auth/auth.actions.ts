"use server";

import { AuthService } from "@/modules/auth/auth.service";
import { redirect } from "next/navigation";
import { RegisterDto, LoginBaseDto, IAuthResponseDto } from "./auth.dto";
import { cookies } from "next/headers";
import { EnvConfig } from "@/lib/env/env-config.lib";
import { handleError } from "@/lib/utils.lib";
import { IErrorResponse, ResponseDataBase } from "@/types/base.types";
import { revalidatePath } from "next/cache";

export async function registerAction(data: RegisterDto) {
  let isSuccess = false;

  try {
    const res = await AuthService.register(data);
    console.log("register:,", res.data);
    if (res.success) {
      isSuccess = true;
      const cookieStore = await cookies();
      //storing tokens authentication
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
    } else
      return {
        error: res.message || "error",
      };
  } catch (err: unknown) {
    return handleError(err);
  }
  if (isSuccess) {
    redirect("/");
  }
}

export async function loginBaseAction(data: LoginBaseDto) {
  let isSuccess = false;

  try {
    const res: ResponseDataBase<IAuthResponseDto> =
      await AuthService.loginBase(data);
    //console.log("action:", res);
    if (res.success) {
      isSuccess = true;
      const cookieStore = await cookies();
      //storing tokens authentication
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
    } else
      return {
        error: res.message || "error",
      };
  } catch (err: unknown) {
    return handleError(err);
  }
  if (isSuccess) {
    redirect("/");
  }
}

export async function loginGoogleAction(token: string) {
  let isSuccess = false;

  try {
    const res = await AuthService.loginGoogle(token);
    if (res.success) {
      isSuccess = true;
      const cookieStore = await cookies();

      cookieStore.set("access_token", res.data.user.tokens.accessToken, {
        httpOnly: true,
        secure: EnvConfig.nodeValue === "production",
        sameSite: "lax",
        path: "/",
        maxAge: EnvConfig.accessTokenExpireIn,
      });
      cookieStore.set("refresh_token", res.data.user.tokens.refreshToken, {
        httpOnly: true,
        secure: EnvConfig.nodeValue === "production",
        sameSite: "lax",
        path: "/",
        maxAge: EnvConfig.refreshTokenExpireIn,
      });
    } else
      return {
        error: res.message || "error",
      };
  } catch (err) {
    return handleError(err);
  }
  if (isSuccess) {
    redirect("/");
  }
}

export async function logoutAction() {
  try {
    await AuthService.logout();
  } catch (err: unknown) {
    console.log("error at logout action", err);
    return handleError(err);
  } finally {
    const cookieStore = await cookies();
    cookieStore.delete("access_token");
    cookieStore.delete("refresh_token");
    revalidatePath("/");
  }
}

export async function refreshAction() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("refresh_token")?.value;
    const res: ResponseDataBase<IAuthResponseDto> =
      await AuthService.refresh(token);
    if (res.success) {
      cookieStore.set("access_token", res.data.tokens.accessToken, {
        path: "/",
      });
      cookieStore.set("refresh_token", res.data.tokens.refreshToken, {
        path: "/",
      });
      return undefined;
    } else
      return {
        success: false,
        error: res.message || "error",
      } as IErrorResponse;
  } catch (err) {
    return handleError(err);
  }
}
