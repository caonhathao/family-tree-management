"use server";
import { getUserFromToken, getUserFromUserId } from "@/lib/auth.lib";
import { IResponseGetUserDto } from "@/modules/user/user.dto";
import { cookies, headers } from "next/headers";
import { IErrorResponse } from "@/types/base.types";
import HeaderClient from "./header-client";

export async function HeaderServer() {
  const cookieStore = await cookies();
  const headersStore = await headers();

  const userIdFromHeader = headersStore.get("x-user-id");
  const token: string | undefined = cookieStore.get("access_token")?.value;

  let user: IResponseGetUserDto | IErrorResponse | null = null;

  if (userIdFromHeader) {
    user = await getUserFromUserId(userIdFromHeader);
  } else if (token) {
    user = await getUserFromToken(token);
  }

  console.log("user at header server:", user);

  return <HeaderClient user={user} />;
}
