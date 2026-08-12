"use server";
import { getUserFromToken } from "@/lib/middleware/auth.lib";
import { IUserSession } from "@/types/auth.types";
import { cookies, headers } from "next/headers";
import { AdminSidebarClient } from "./admin-sidebar-client";
import { ApiResponse } from "@/types/api.types";

export async function AdminSidebarServer() {
  const cookieStore = await cookies();
  const headersStore = await headers();

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
  return <AdminSidebarClient session={user} />;
}
