import { handleError } from "@/lib/utils.lib";
import {
  ResponseCreateFamilyMemberDto,
  IUpdateFamilyMemberDto,
} from "./family-member.dto";
import { FamilyMemberService } from "./family-member.service";
import { ResponseDataBase } from "@/types/base.types";
import { revalidatePath } from "next/cache";


export async function updateFamilyMemberAction(
  groupId: string,
  data: IUpdateFamilyMemberDto,
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
