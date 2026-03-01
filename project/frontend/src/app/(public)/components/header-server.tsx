"use server";
import { getUserFromToken, getUserFromUserId } from "@/lib/middleware/auth.lib";
import { cookies, headers } from "next/headers";
import { IErrorResponse } from "@/types/base.types";
import HeaderClient from "./header-client";
import { IUserSession } from "@/types/auth.types";
import { getUserSessionAction } from "@/modules/auth/auth.actions";

export async function HeaderServer() {
  const cookieStore = await cookies();
  const headersStore = await headers();

  const userIdFromHeader = headersStore.get("x-user-id");
  const token =
    headersStore.get("x-access-token") ||
    cookieStore.get("access_token")?.value;
  let user: IUserSession | IErrorResponse | null = null;

  if (userIdFromHeader) {
    user = await getUserFromUserId(userIdFromHeader);
    //console.log("user at server:", user);
  } else if (token) {
    user = await getUserFromToken(token);
    //console.log("user at cookie:", user);
  } else user = await getUserSessionAction();

  //console.log("user at header server:", user);

  return <HeaderClient user={user} />;
}
