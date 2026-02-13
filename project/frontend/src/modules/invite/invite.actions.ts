"use server";
import { ResponseDataBase } from "@/types/base.types";
import { ICreateInviteDto, IResponseCreateInviteDto } from "./invite.dto";
import { InviteService } from "./invite.service";
import { handleError } from "@/lib/utils.lib";

export async function CreateInviteLinkAction(data: ICreateInviteDto) {
  try {
    const res: ResponseDataBase<IResponseCreateInviteDto> =
      await InviteService.createInviteLink(data);
    if (res.success) {
      return res.data;
    } else return { err: res.message || "error" };
  } catch (err) {
    return handleError(err);
  }
}
