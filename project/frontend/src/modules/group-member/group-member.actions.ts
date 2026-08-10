"use server";
import { UpdateGroupMemberDto } from "./group-member.dto";
import { revalidatePath } from "next/cache";
import { ResponseFactory } from "@/lib/res/response.factory";
import { apiRequest } from "@/lib/api/http.client";
import { apiClient } from "@/lib/api/api-client.lib";

export async function UpdateGroupMemberRoleAction(
  groupId: string,
  data: UpdateGroupMemberDto,
) {
  let isSuccess = false;
  try {
    const res = await apiRequest(
      apiClient.groupMember.updateRole.url(groupId),
      {
        method: apiClient.groupMember.updateRole.method,
        body: data,
      },
    );
    if (res && "data" in res && res.data != undefined) {
      isSuccess = true;
    } else {
      return { err: "Failed to update role" };
    }
  } catch (err) {
    return ResponseFactory.handleError(err);
  }
  if (isSuccess) {
    revalidatePath(`/group/${groupId}`);
  }
}

export async function UpdateGroupMemberLeaderAction(
  groupId: string,
  data: UpdateGroupMemberDto,
) {
  let isSuccess = false;
  try {
    const res = await apiRequest(
      apiClient.groupMember.changeLeader.url(groupId),
      {
        method: apiClient.groupMember.changeLeader.method,
        body: data,
      },
    );
    if (res && "data" in res && res.data != undefined) {
      isSuccess = true;
    } else {
      return { err: "Failed to change leader" };
    }
  } catch (err) {
    return ResponseFactory.handleError(err);
  }
  if (isSuccess) {
    revalidatePath(`/group/${groupId}`);
  }
}

export async function RemoveFromGroupAction(groupId: string, memberId: string) {
  let isSuccess = false;
  try {
    const res = await apiRequest<{ count: number }>(
      apiClient.groupMember.deleteGroupMember.url(groupId, memberId),
      {
        method: apiClient.groupMember.deleteGroupMember.method,
      },
    );
    if (res && "data" in res && res.data != undefined && res.data.count > 0) {
      isSuccess = true;
    }
  } catch (err) {
    return ResponseFactory.handleError(err);
  }
  if (isSuccess) {
    revalidatePath(`/group/${groupId}`);
  }
}
