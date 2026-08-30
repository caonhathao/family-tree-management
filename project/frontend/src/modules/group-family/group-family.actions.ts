"use server";
import {
  ICreateGroupFamilyDto,
  IResponseGroupFamiliesDto,
  IResponseGroupFamilyDetailDto,
  IResponseInviteGroupInfoDto,
  IResponseJoinGroupDto,
  IUpdateGroupFamilyDto,
} from "./group-family.dto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ISuccessResponse } from "@/types/base.types";
import { ResponseFactory } from "@/lib/res/response.factory";
import { ApiResponse } from "@/types/api.types";
import { apiRequest } from "@/lib/api/http.client";
import { apiClient } from "@/lib/api/api-client.lib";

export async function createGroupFamilyAction(data: ICreateGroupFamilyDto) {
  try {
    const res = await apiRequest(apiClient.groupFamily.createGroup.url, {
      method: apiClient.groupFamily.createGroup.method,
      body: data,
    });

    if (res && "data" in res && res.data != undefined) {
      revalidatePath(`/group`);
      return { success: true, message: res.message } as ISuccessResponse;
    }
  } catch (err: unknown) {
    return ResponseFactory.handleError(err);
  }
}

export async function updateGroupFamilyAction(
  groupId: string,
  data: IUpdateGroupFamilyDto,
) {
  try {
    const res = await apiRequest(
      apiClient.groupFamily.updateGroup.url(groupId),
      {
        method: apiClient.groupFamily.updateGroup.method,
        body: data,
      },
    );

    if (res && "data" in res && res.data != undefined) {
      revalidatePath(`/group`);
      return { success: true, message: res.message } as ISuccessResponse;
    }
  } catch (err: unknown) {
    return ResponseFactory.handleError(err);
  }
}

export async function joinGroupAction(
  tokenCode: string,
): Promise<
  IResponseJoinGroupDto | ApiResponse<IResponseJoinGroupDto, unknown> | null
> {
  try {
    const res = await apiRequest<IResponseJoinGroupDto>(
      apiClient.groupFamily.joinGroup.url(tokenCode),
      {
        method: apiClient.groupFamily.joinGroup.method,
      },
    );

    if (res && "data" in res && res.data != undefined) {
      return res.data;
    }
    return null;
  } catch (err: unknown) {
    return ResponseFactory.handleError(err);
  }
}

export async function getInviteGroupInfoAction(
  tokenCode: string,
): Promise<
  | IResponseInviteGroupInfoDto
  | ApiResponse<IResponseInviteGroupInfoDto, unknown>
  | null
> {
  try {
    const res = await apiRequest<IResponseInviteGroupInfoDto>(
      apiClient.invite.getInviteInfo.url(tokenCode),
      {
        method: apiClient.invite.getInviteInfo.method,
        auth: false,
      },
    );

    if (res && "data" in res && res.data != undefined) {
      return res.data;
    }
    return null;
  } catch (err: unknown) {
    return ResponseFactory.handleError(err);
  }
}

export async function getAllGroupAction() {
  try {
    const res = await apiRequest<IResponseGroupFamiliesDto[]>(
      apiClient.groupFamily.getAll.url,
      {
        method: apiClient.groupFamily.getAll.method,
      },
    );

    if (res && "data" in res && res.data != undefined) {
      return res.data;
    }
    return [] as IResponseGroupFamiliesDto[];
  } catch (err: unknown) {
    return ResponseFactory.handleError(err);
  }
}

export async function getDetailGroupAction(
  groupId: string,
): Promise<
  | IResponseGroupFamilyDetailDto
  | ApiResponse<IResponseGroupFamilyDetailDto, unknown>
> {
  try {
    const res = await apiRequest<IResponseGroupFamilyDetailDto>(
      apiClient.groupFamily.getDetail.url(groupId),
      {
        method: apiClient.groupFamily.getDetail.method,
      },
    );

    if (res && "data" in res && res.data != undefined) {
      return res.data;
    }
    return ResponseFactory.error({
      message: "Group not found",
      code: 404,
    });
  } catch (err: unknown) {
    return ResponseFactory.handleError(err);
  }
}

export async function quitGroupAction(groupId: string) {
  let isSuccess = false;

  try {
    const res = await apiRequest(apiClient.groupFamily.quitGroup.url(groupId), {
      method: apiClient.groupFamily.quitGroup.method,
    });

    if (res && "data" in res && res.data != undefined) {
      isSuccess = true;
    }
  } catch (err: unknown) {
    return ResponseFactory.handleError(err);
  }

  if (isSuccess) {
    revalidatePath("/group");
    redirect("/group");
  }
}

export async function quitGroupFromListAction(groupId: string) {
  try {
    const res = await apiRequest(apiClient.groupFamily.quitGroup.url(groupId), {
      method: apiClient.groupFamily.quitGroup.method,
    });

    if (res && "data" in res && res.data != undefined) {
      revalidatePath("/user/groups");
      return { success: true, message: res.message } as ISuccessResponse;
    }
  } catch (err: unknown) {
    return ResponseFactory.handleError(err);
  }
}

export async function destroyGroupAction(groupId: string) {
  let isSuccess = false;

  try {
    const res = await apiRequest(
      apiClient.groupFamily.deleteGroup.url(groupId),
      {
        method: apiClient.groupFamily.deleteGroup.method,
      },
    );

    if (res && "data" in res && res.data != undefined) {
      isSuccess = true;
    }
  } catch (err: unknown) {
    return ResponseFactory.handleError(err);
  }

  if (isSuccess) {
    revalidatePath("/group");
    redirect("/group");
  }
}

export async function pinMemberAction(
  groupId: string,
  familyMemberId: string | null,
) {
  try {
    const res = await apiRequest<{ pinnedMemberId: string | null }>(
      apiClient.groupFamily.pinMember.url(groupId),
      {
        method: apiClient.groupFamily.pinMember.method,
        body: { familyMemberId },
      },
    );

    if (res && "data" in res && res.data != undefined) {
      return res.data;
    }
    return null;
  } catch (err: unknown) {
    return ResponseFactory.handleError(err);
  }
}
