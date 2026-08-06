"use server";
import { getUserFromToken } from "@/lib/middleware/auth.lib";
import { cookies, headers } from "next/headers";
import HeaderClient from "./header-client";
import { IUserSession } from "@/types/auth.types";
import { ApiResponse } from "@/types/api.types";

export async function HeaderServer() {
  const cookieStore = await cookies();
  const headersStore = await headers();

  const token =
    headersStore.get("x-access-token") ||
    cookieStore.get("access_token")?.value;
  let user: IUserSession | ApiResponse<IUserSession, unknown> | null = null;

  if (token) {
    user = await getUserFromToken(token);
    //console.log("user at cookie:", user);
  }

  //console.log("user at header server:", user);

  return <HeaderClient user={user} />;
}
