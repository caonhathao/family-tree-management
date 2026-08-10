"use server";
import { ResponseFactory } from "@/lib/res/response.factory";
import { ICreateInviteDto, IResponseCreateInviteDto } from "./invite.dto";
import { apiRequest } from "@/lib/api/http.client";
import { apiClient } from "@/lib/api/api-client.lib";
import { ApiResponse } from "@/types/api.types";

export async function CreateInviteLinkAction(
  data: ICreateInviteDto,
): Promise<
  IResponseCreateInviteDto | ApiResponse<IResponseCreateInviteDto, unknown>
> {
  try {
    const res = await apiRequest<IResponseCreateInviteDto>(
      apiClient.invite.createInvite.url,
      {
        method: apiClient.invite.createInvite.method,
        body: { groupId: data.groupId },
      },
    );

    if (res && "data" in res && res.data != undefined) {
      const raw = res.data.inviteLink;
      const inviteLink = /^https?:\/\//.test(raw)
        ? raw.replace(/^https?:\/\/[^/]+/, "")
        : raw;
      return { inviteLink: inviteLink };
    }
    return res as ApiResponse<IResponseCreateInviteDto, unknown>;
  } catch (err) {
    return ResponseFactory.handleError(err);
  }
}
