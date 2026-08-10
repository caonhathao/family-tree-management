"use server";
import { IFamilyDto } from "./family.dto";
import { revalidatePath } from "next/cache";
import { IDraftFamilyData } from "@/types/draft.types";
import { SyncFamilyDtoSchema } from "./family.service-validator";
import { ResponseFactory } from "@/lib/res/response.factory";
import { ApiResponse } from "@/types/api.types";
import { apiRequest } from "@/lib/api/http.client";
import { apiClient } from "@/lib/api/api-client.lib";

export async function SyncFamilyAction(
  groupId: string,
  data: IDraftFamilyData,
) {
  try {
    const validated = SyncFamilyDtoSchema.parse(data);
    const res = await apiRequest<IDraftFamilyData>(
      apiClient.family.syncFamily.url(groupId),
      {
        method: apiClient.family.syncFamily.method,
        body: validated,
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

export async function GetFamilyData(
  groupId: string,
): Promise<IDraftFamilyData | ApiResponse<IDraftFamilyData, unknown>> {
  try {
    const res = await apiRequest<IDraftFamilyData>(
      apiClient.family.getFamily.url(groupId),
      {
        method: apiClient.family.getFamily.method,
      },
    );

    if (res && "data" in res && res.data != undefined) {
      return res.data;
    }
    return ResponseFactory.error({
      message: "Family not found",
      code: 404,
    });
  } catch (err: unknown) {
    return ResponseFactory.handleError(err);
  }
}

export async function UpdatefamilyInfo(groupId: string, data: IFamilyDto) {
  try {
    const res = await apiRequest(apiClient.family.updateFamily.url(groupId), {
      method: apiClient.family.updateFamily.method,
      body: data,
    });
    if (res && "data" in res && res.data != undefined) {
      revalidatePath(`/group/${groupId}`);
      return res.data;
    }
    return res;
  } catch (err) {
    return ResponseFactory.handleError(err);
  }
}

export async function DeleteFamilyAction(familyId: string, groupId: string) {
  try {
    const res = await apiRequest<{ id: string }>(
      apiClient.family.deleteFamily.url(familyId, groupId),
      {
        method: apiClient.family.deleteFamily.method,
      },
    );
    if (res && "data" in res && res.data != undefined) {
      revalidatePath(`/group/${groupId}`);
      return res.data;
    }
    return res;
  } catch (err: unknown) {
    return ResponseFactory.handleError(err);
  }
}
