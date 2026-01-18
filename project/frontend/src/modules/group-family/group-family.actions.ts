import { ResponseDataBase } from "@/types/base.types";
import {
  CreateGroupFamilyDto,
  ResponseGroupFamilyDetailDto,
  ResponseJoinGroupDto,
  UpdateGroupFamilyDto,
} from "./group-family.dto";
import { GroupFamilyService } from "./group-family.service";
import { redirect } from "next/navigation";
import { handleError } from "@/lib/utils.lib";
import { revalidatePath } from "next/cache";

export async function createGroupFamilyAction(data: CreateGroupFamilyDto) {
  let isSuccess = false;
  let id = "";

  try {
    const res: ResponseDataBase<ResponseGroupFamilyDetailDto> =
      await GroupFamilyService.createGroup(data);
    if (res.success) {
      isSuccess = true;
      id = res.data.id;
    } else
      return {
        error: res.message || "error",
      };
  } catch (err: unknown) {
    return handleError(err);
  }
  if (isSuccess) {
    redirect(`/group-family/${id}`);
  }
}

export async function updateGroupFamilyAction(
  groupId: string,
  data: UpdateGroupFamilyDto,
) {
  let isSuccess = false;
  try {
    const res: ResponseDataBase<ResponseGroupFamilyDetailDto> =
      await GroupFamilyService.updateGroup(groupId, data);
    if (res.success) {
      isSuccess = true;
    } else return { error: res.message || "error" };
  } catch (err) {
    return handleError(err);
  }

  if (isSuccess) {
    revalidatePath(`/groups/${groupId}`);
  }
}

export async function joinGroupAcion(token: string) {
  let groupId: string;
  try {
    const res: ResponseDataBase<ResponseJoinGroupDto> =
      await GroupFamilyService.joinGroup(token);
    if (res.success) {
      groupId = res.data.groupId;
      revalidatePath(`/groups/${groupId}`);
    } else return { error: res.message || "error" };
  } catch (err) {
    return handleError(err);
  }
}
