import { ResponseDataBase } from "@/types/base.types";
import {
  CreateFamilyDto,
  ResponseCreateFamilyDto,
  UpdateFamilyDto,
} from "./family.dto";
import { FamilyService } from "./family.service";
import { handleError } from "@/lib/utils.lib";
import { revalidatePath } from "next/cache";

export async function CreateFamilyAction(
  groupId: string,
  data: CreateFamilyDto,
) {
  let isSuccess = false;

  try {
    const res: ResponseDataBase<ResponseCreateFamilyDto> =
      await FamilyService.createFamily(groupId, data);
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

export async function UpdateFamilyAction(
  groupId: string,
  data: UpdateFamilyDto,
) {
  let isSuccess = false;

  try {
    const res: ResponseDataBase<ResponseCreateFamilyDto> =
      await FamilyService.updateFamily(groupId, data);
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
