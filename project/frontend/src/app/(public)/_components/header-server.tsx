"use server";
import { getUserFromToken } from "@/lib/middleware/auth.lib";
import { cookies, headers } from "next/headers";
import HeaderClient from "./header-client";
import { IUserSession } from "@/types/auth.types";
import { ApiResponse } from "@/types/api.types";

export async function HeaderServer() {
  const cookieStore = await cookies();
  const headersStore = await headers();

  // this token value will contain access or refresh token
  // first, we will use the access token to get user data, if it fails, we will use refresh token to get new access token and then get user data
  let token =
    headersStore.get("x-access-token") ||
    cookieStore.get("access_token")?.value;
  let user: IUserSession | ApiResponse<IUserSession, unknown> | null = null;

  if (token) {
    user = await getUserFromToken(token);
    //console.log("user at cookie:", user);
  } else {
    token =
      headersStore.get("x-refresh-token") ||
      cookieStore.get("refresh_token")?.value;
    if (token) {
      user = await getUserFromToken(token);
      //console.log("user at cookie:", user);
    }
  }

  //console.log("user at header server:", user);

  return <HeaderClient user={user} />;
}
