"use server";
import { IFamilyDto } from "./family.dto";
import { revalidatePath } from "next/cache";
import { IDraftFamilyData } from "@/types/draft.types";
import { headers } from "next/headers";
import { FamilyService } from "./family.service";
import { FamilyDto } from "./family.service-validator";
import { ResponseFactory } from "@/lib/res/response.factory";
import { ApiResponse } from "@/types/api.types";

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
    const res = await FamilyService.syncFamily(
      userId,
      groupId,
      data as FamilyDto,
    );
    return res;
  } catch (err: unknown) {
    return ResponseFactory.handleError(err);
  }
}

export async function GetFamilyData(
  groupId: string,
): Promise<IDraftFamilyData | ApiResponse<IDraftFamilyData, unknown>> {
  try {
    const res = await FamilyService.getFamily(groupId);
    return res;
  } catch (err: unknown) {
    return ResponseFactory.handleError(err);
  }
}

export async function UpdatefamilyInfo(groupId: string, data: IFamilyDto) {
  try {
    const res = await FamilyService.updateFamily(groupId, data);
    if (res) {
      revalidatePath(`/group/${groupId}`);
    }
    return res;
  } catch (err) {
    return ResponseFactory.handleError(err);
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
    return ResponseFactory.handleError(err);
  }
}
