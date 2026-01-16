"use server";

import { AuthService } from "@/modules/auth/auth.service";
import { redirect } from "next/navigation";
import {
  CreateRegisterDto,
  LoginBaseDto,
  ResponseDataBase,
  ResponseLoginDataDto,
} from "./auth.dto";
import { error } from "console";
import { cookies } from "next/headers";
import { EnvConfig } from "@/lib/env/env-config.lib";

export async function registerAction(data: CreateRegisterDto) {
  let isSuccess = false;
  let response: ResponseDataBase<ResponseLoginDataDto>;

  try {
    const result = await AuthService.register(data);
    if (result.success) {
      isSuccess = true;
      response = result;
    } else
      return {
        error: result.message || "error",
      };
  } catch (err) {
    return { err };
  }
  if (isSuccess) {
    const cookieStore = await cookies();
    //storing tokens authentication
    cookieStore.set("access_token", response.data.user.tokens.accessToken, {
      httpOnly: true,
      secure: EnvConfig.nodeValue === "production",
      sameSite: "lax",
      path: "/",
      maxAge: EnvConfig.accessTokenExpireIn,
    });
    cookieStore.set("refresh_token", response.data.user.tokens.refreshToken, {
      httpOnly: true,
      secure: EnvConfig.nodeValue === "production",
      sameSite: "lax",
      path: "/",
      maxAge: EnvConfig.refreshToeknExpireIn,
    });
    redirect("/");
  }
}

export async function loginBaseAction(data: LoginBaseDto) {
  let isSuccess = false;
  let response: ResponseDataBase<ResponseLoginDataDto>;
  try {
    const result = await AuthService.loginBase(data);
    if (result.success) {
      isSuccess = true;
      response = result;
    } else
      return {
        error: result.message || "error",
      };
  } catch (err) {
    return { err };
  }
  if (isSuccess) {
    const cookieStore = await cookies();
    //storing tokens authentication
    cookieStore.set("access_token", response.data.user.tokens.accessToken, {
      httpOnly: true,
      secure: EnvConfig.nodeValue === "production",
      sameSite: "lax",
      path: "/",
      maxAge: EnvConfig.accessTokenExpireIn,
    });
    cookieStore.set("refresh_token", response.data.user.tokens.refreshToken, {
      httpOnly: true,
      secure: EnvConfig.nodeValue === "production",
      sameSite: "lax",
      path: "/",
      maxAge: EnvConfig.refreshToeknExpireIn,
    });
    redirect("/");
  }
}
