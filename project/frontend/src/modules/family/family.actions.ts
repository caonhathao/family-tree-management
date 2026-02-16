"use server";
import { IFamilyDto } from "./family.dto";
import { FamilyService } from "./family.service";
import { handleError } from "@/lib/utils.lib";
import { revalidatePath } from "next/cache";
import { IDraftFamilyData } from "@/types/draft.types";
import { headers } from "next/headers";

export async function SyncFamilyAction(
  groupId: string,
  data: IDraftFamilyData,
) {
  try {
    const headerList = await headers();
    const userId = headerList.get("X-User-Id");
    if (!userId) {
      throw new Error("Unauthorized");
    }
    const res = await FamilyService.syncFamily(userId, groupId, data as any);
    return res;
  } catch (err: unknown) {
    return handleError(err);
  }
}

export async function GetFamilyData(groupId: string) {
  try {
    const res = await FamilyService.getFamily(groupId);
    return res;
  } catch (err: unknown) {
    return handleError(err);
  }
}

export async function UpdatefamilyInfo(groupId: string, data: IFamilyDto) {
  try {
    const res = await FamilyService.updateFamily(groupId, data as any);
    if (res) {
      revalidatePath(`/group/${groupId}`);
    }
    return res;
  } catch (err) {
    return handleError(err);
  }
}

export async function DeleteFamilyAction(familyId: string, groupId: string) {
  try {
    const res = await FamilyService.deleteFamily(groupId, familyId);
    if (res) {
      revalidatePath(`/group/${groupId}`);
    }
    return res;
  } catch (err: unknown) {
    return handleError(err);
  }
}
