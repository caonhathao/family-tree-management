"use server";
import {
  CreateGroupFamilyDto,
  ResponseGroupFamiliesDto,
  ResponseGroupFamilyDetailDto,
  IResponseJoinGroupDto,
  IUpdateGroupFamilyDto,
} from "./group-family.dto";
import { GroupFamilyService } from "./group-family.service";
import { handleError } from "@/lib/utils.lib";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

export async function createGroupFamilyAction(data: CreateGroupFamilyDto) {
  let isSuccess = false;

  try {
    const headerList = await headers();
    const userId = headerList.get("X-User-Id");
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const res = await GroupFamilyService.createGroup(userId, data as any);
    if (res) {
      isSuccess = true;
    } else {
      return { error: "Failed to create group" };
    }
  } catch (err: unknown) {
    return handleError(err);
  }
  if (isSuccess) {
    revalidatePath(`/group`);
  }
}

export async function updateGroupFamilyAction(
  groupId: string,
  data: IUpdateGroupFamilyDto,
) {
  let isSuccess = false;
  try {
    const headerList = await headers();
    const userId = headerList.get("X-User-Id");
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const res = await GroupFamilyService.updateGroup(userId, groupId, data);
    if (res) {
      isSuccess = true;
    } else {
      return { error: "Failed to update group" };
    }
  } catch (err) {
    return handleError(err);
  }

  if (isSuccess) {
    revalidatePath(`/groups`);
  }
}

export async function joinGroupAcion(tokenCode: string) {
  try {
    const headerList = await headers();
    const userId = headerList.get("X-User-Id");
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const res = await GroupFamilyService.joinGroup(tokenCode, userId);
    if (res) {
      revalidatePath("/groups");
    }
    return res;
  } catch (err) {
    return handleError(err);
  }
}

export async function getAllGroupAction() {
  try {
    const headerList = await headers();
    const userId = headerList.get("X-User-Id");
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const res = await GroupFamilyService.getAll(userId);
    return res;
  } catch (err) {
    return handleError(err);
  }
}

export async function getDetailGroupAction(groupId: string) {
  try {
    const headerList = await headers();
    const userId = headerList.get("X-User-Id");
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const res = await GroupFamilyService.getDetail(userId, groupId);
    return res;
  } catch (err) {
    return handleError(err);
  }
}
