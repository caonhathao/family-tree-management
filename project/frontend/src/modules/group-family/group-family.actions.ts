"use server";
import { ResponseDataBase } from "@/types/base.types";
import {
  CreateGroupFamilyDto,
  ResponseGroupFamiliesDto,
  ResponseGroupFamilyDetailDto,
  ResponseJoinGroupDto,
  UpdateGroupFamilyDto,
} from "./group-family.dto";
import { GroupFamilyService } from "./group-family.service";
import { handleError } from "@/lib/utils.lib";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

export async function createGroupFamilyAction(data: CreateGroupFamilyDto) {
  let isSuccess = false;

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;
    const res: ResponseDataBase<ResponseGroupFamilyDetailDto> =
      await GroupFamilyService.createGroup(data, token);
    if (res.success) {
      isSuccess = true;
    } else
      return {
        error: res.message || "error",
      };
  } catch (err: unknown) {
    return handleError(err);
  }
  if (isSuccess) {
    revalidatePath(`/group`);
  }
}

export async function updateGroupFamilyAction(
  groupId: string,
  data: UpdateGroupFamilyDto,
) {
  let isSuccess = false;
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;
    const res: ResponseDataBase<ResponseGroupFamilyDetailDto> =
      await GroupFamilyService.updateGroup(groupId, data, token);
    if (res.success) {
      isSuccess = true;
    } else return { error: res.message || "error" };
  } catch (err) {
    return handleError(err);
  }

  if (isSuccess) {
    revalidatePath(`/groups`);
  }
}

export async function joinGroupAcion(tokenCode: string) {
  let groupId: string;
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;
    const res: ResponseDataBase<ResponseJoinGroupDto> =
      await GroupFamilyService.joinGroup(tokenCode, token);
    if (res.success) {
      groupId = res.data.groupId;
      revalidatePath(`/groups/${groupId}`);
    } else return { error: res.message || "error" };
  } catch (err) {
    return handleError(err);
  }
}

export async function getAllGroupAction() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;
    const res: ResponseDataBase<ResponseGroupFamiliesDto[]> =
      await GroupFamilyService.getAll(token);
    // console.log(res);
    if (res.success) {
      return res.data;
    } else return { error: res.message || "error" };
  } catch (err) {
    return handleError(err);
  }
}

export async function getDetailGroupAction(groupId: string) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;
    const res: ResponseDataBase<ResponseGroupFamilyDetailDto> =
      await GroupFamilyService.getDetail(groupId, token);
    if (res.success) {
      return res.data;
    } else return { error: res.message || "error" };
  } catch (err) {
    return handleError(err);
  }
}
