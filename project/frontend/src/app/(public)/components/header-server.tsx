"use server";
import { getUserFromToken } from "@/lib/auth.lib";
import { ResponseGetUserDto } from "@/modules/user/user.dto";
import { cookies } from "next/headers";
import { IErrorResponse } from "@/types/base.types";
import HeaderClient from "./header-client";

export async function HeaderServer() {
  const cookieStore = await cookies();
  let token: string | undefined;
  if (cookieStore.get("access_token")?.value !== undefined) {
    token = cookieStore.get("access_token")?.value;
  } else token = cookieStore.get("refresh_token")?.value;

  let user: ResponseGetUserDto | IErrorResponse | null = null;
  user = await getUserFromToken(token);
  console.log("user at header server:", user);

  return <HeaderClient user={user} />;
}
