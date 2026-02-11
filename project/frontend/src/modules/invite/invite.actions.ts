"use server";
import { ResponseDataBase } from "@/types/base.types";
import { ICreateInviteDto, IResponseCreateInviteDto } from "./invite.dto";
import { InviteService } from "./invite.service";
import { handleError } from "@/lib/utils.lib";
import { cookies } from "next/headers";

export async function CreateInviteLinkAction(data: ICreateInviteDto) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;
    const res: ResponseDataBase<IResponseCreateInviteDto> =
      await InviteService.createInviteLink(data, token);
    if (res.success) {
      return res.data;
    } else return { err: res.message || "error" };
  } catch (err) {
    return handleError(err);
  }
}
