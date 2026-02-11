"use server";
import { ResponseDataBase } from "@/types/base.types";
import { ResponseCreateFamilyDto } from "./family.dto";
import { FamilyService } from "./family.service";
import { handleError } from "@/lib/utils.lib";
import { revalidatePath } from "next/cache";
import { IDraftFamilyData } from "@/types/draft.types";
import { cookies } from "next/headers";

export async function SyncFamilyAction(
  groupId: string,
  data: IDraftFamilyData,
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;
    const res: ResponseDataBase<ResponseCreateFamilyDto> =
      await FamilyService.syncFamily(groupId, data, token);
      console.log(res)
    if (res.success) {
      return res.data;
    } else
      return {
        error: res.message || "error",
      };
  } catch (err: unknown) {
    return handleError(err);
  }
}

export async function GetFamilyData(groupId: string) {
  try {
    const res: ResponseDataBase<IDraftFamilyData> =
      await FamilyService.getFamily(groupId);
    
    if (res.success) return res.data;
    else
      return {
        error: res.message || "error",
      };
  } catch (err: unknown) {
    return handleError(err);
  }
}

export async function DeleteFamilyAction(familyId: string, groupId: string) {
  let isSuccess = false;

  try {
    const res: ResponseDataBase<ResponseCreateFamilyDto> =
      await FamilyService.deleteFamily(familyId, groupId);
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
    revalidatePath(`/family`);
  }
}
