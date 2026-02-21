"use server";
import {
  CreateGroupFamilyDto,
  IUpdateGroupFamilyDto,
} from "./group-family.dto";
import { handleError } from "@/lib/util/utils.lib";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { GroupFamilyService } from "./group-family.service";
import { redirect } from "next/navigation";

export async function createGroupFamilyAction(data: CreateGroupFamilyDto) {
  let isSuccess = false;

  try {
    const headerList = await headers();
    const userId = headerList.get("X-User-Id");
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const res = await GroupFamilyService.createGroup(userId, data);
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

export async function quitGroupAction(groupId: string) {
  let isSuccess = false;
  try {
    const headerList = await headers();
    const userId = headerList.get("X-User-Id");
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const res = await GroupFamilyService.quitGroup(userId, groupId);
    if (res) {
      isSuccess = true;
    }
  } catch (err) {
    return handleError(err);
  }
  if (isSuccess) {
    revalidatePath("/group");
    redirect("/group");
  }
}
