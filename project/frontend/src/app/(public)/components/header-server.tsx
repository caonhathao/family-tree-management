"use server";
import { getUserFromToken } from "@/lib/auth.lib";
import { IResponseGetUserDto } from "@/modules/user/user.dto";
import { cookies } from "next/headers";
import { IErrorResponse } from "@/types/base.types";
import HeaderClient from "./header-client";

export async function HeaderServer() {
  const cookieStore = await cookies();
  const token: string | undefined = cookieStore.get("access_token")?.value;

  let user: IResponseGetUserDto | IErrorResponse | null = null;
  user = await getUserFromToken(token);
  //console.log("user at header server:", user);

  return <HeaderClient user={user} />;
}
