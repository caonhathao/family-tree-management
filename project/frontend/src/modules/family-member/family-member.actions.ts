import { handleError } from "@/lib/utils.lib";
import {
  CreateFamilyMemberDto,
  ResponseCreateFamilyMemberDto,
  updateFamilyMemberDto,
} from "./family-member.dto";
import { FamilyMemberService } from "./family-member.service";
import { ResponseDataBase } from "@/types/base.types";
import { revalidatePath } from "next/cache";

export async function CreateFamilyMemberAction(
  groupId: string,
  data: CreateFamilyMemberDto,
) {
  let isSuccess = false;

  try {
    const res: ResponseDataBase<ResponseCreateFamilyMemberDto> =
      await FamilyMemberService.createMember(groupId, data);
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

export async function updateFamilyMemberAction(
  groupId: string,
  data: updateFamilyMemberDto,
) {
  let isSuccess = false;

  try {
    const res: ResponseDataBase<ResponseCreateFamilyMemberDto> =
      await FamilyMemberService.updateMember(groupId, data);
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

export async function deleteFamilyMemberAction(
  memberId: string,
  familyId: string,
) {
  let isSuccess = false;

  try {
    const res: ResponseDataBase<ResponseCreateFamilyMemberDto> =
      await FamilyMemberService.delete(memberId, familyId);
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
