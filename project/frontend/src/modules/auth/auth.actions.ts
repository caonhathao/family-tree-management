"use server";

import { AuthService } from "@/modules/auth/auth.service";
import { redirect } from "next/navigation";
import { RegisterDto, LoginBaseDto } from "./auth.dto";
import { cookies } from "next/headers";
import { EnvConfig } from "@/lib/env/env-config.lib";
import { handleError } from "@/lib/utils.lib";

export async function registerAction(data: RegisterDto) {
  let isSuccess = false;

  try {
    const res = await AuthService.register(data);
    // console.log(res)
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
    const res = await AuthService.loginBase(data);
    //console.log("action:", res);
    if (res.success) {
      isSuccess = true;
      const cookieStore = await cookies();
      //storing tokens authentication
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
