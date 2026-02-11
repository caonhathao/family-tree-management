"use server";
import { handleError } from "@/lib/utils.lib";
import {
  ResponseUpdateGroupMemberDto,
  UpdateGroupMemberDto,
} from "./group-member.dto";
import { GroupMemberService } from "./group-member.service";
import { ResponseDataBase } from "@/types/base.types";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

export async function UpdateGroupMemberRoleAction(
  groupId: string,
  data: UpdateGroupMemberDto,
) {
  let isSuccess = false;
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;
    const res: ResponseDataBase<ResponseUpdateGroupMemberDto> =
      await GroupMemberService.updateRole(groupId, data, token);
    if (res.success) {
      isSuccess = true;
    } else return { err: res.message || "error" };
  } catch (err) {
    return handleError(err);
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
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;
    const res: ResponseDataBase<ResponseUpdateGroupMemberDto> =
      await GroupMemberService.changeLeader(groupId, data, token);
    if (res.success) {
      isSuccess = true;
    } else return { err: res.message || "error" };
  } catch (err) {
    return handleError(err);
  }
  if (isSuccess) {
    revalidatePath(`/group/${groupId}`);
  }
}

export async function DeleteGroupMemberAction(
  groupId: string,
  memberId: string,
) {
  let isSuccess = false;
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;
    const res: ResponseDataBase<ResponseUpdateGroupMemberDto> =
      await GroupMemberService.deleteGroupMember(groupId, memberId, token);
    if (res.success) {
      isSuccess = true;
    } else return { err: res.message || "error" };
  } catch (err) {
    return handleError(err);
  }
  if (isSuccess) {
    revalidatePath(`/group/${groupId}`);
  }
}

export async function RemoveFromGroupAction(groupId: string, memberId: string) {
  let isSuccess = false;
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;
    const res = await GroupMemberService.removeFromGroup(
      groupId,
      memberId,
      token,
    );
    if (res.success) {
      isSuccess = true;
    } else return { err: res.message || "error" };
  } catch (err) {
    return handleError(err);
  }
  if (isSuccess) {
    revalidatePath(`/group/${groupId}`);
  }
}
