"use server";
import { UpdateGroupMemberDto } from "./group-member.dto";
import { GroupMemberService } from "./group-member.service";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { IErrorResponse } from "@/types/base.types";
import { ResponseFactory } from "@/lib/res/response.factory";
import { ApiResponse } from "@/types/api.types";

export async function UpdateGroupMemberRoleAction(
  groupId: string,
  data: UpdateGroupMemberDto,
) {
  let isSuccess = false;
  try {
    const headerList = await headers();
    const userId = headerList.get("X-User-Id");
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const res = await GroupMemberService.updateRole(userId, groupId, data);
    if (res) {
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
    const headerList = await headers();
    const userId = headerList.get("X-User-Id");
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const res = await GroupMemberService.changeLeader(userId, groupId, data);
    if (res) {
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
    const headerList = await headers();
    const userId = headerList.get("X-User-Id");
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const res: ApiResponse<number, unknown> | number =
      await GroupMemberService.removeMember(userId, groupId, memberId);
    if (typeof res === "number") {
      isSuccess = true;
    }
  } catch (err) {
    return ResponseFactory.handleError(err);
  }
  if (isSuccess) {
    revalidatePath(`/group/${groupId}`);
  }
}
