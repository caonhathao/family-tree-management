"use server";
import { ResponseFactory } from "@/lib/res/response.factory";
import { ICreateInviteDto } from "./invite.dto";
import { InviteService } from "./invite.service";
import { headers } from "next/headers";

export async function CreateInviteLinkAction(data: ICreateInviteDto) {
  try {
    const headerList = await headers();
    const userId = headerList.get("X-User-Id");
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const res = await InviteService.createInviteLink(userId, data);
    return res;
  } catch (err) {
    return ResponseFactory.handleError(err);
  }
}
