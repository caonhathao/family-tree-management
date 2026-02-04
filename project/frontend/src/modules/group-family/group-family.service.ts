import { apiClient } from "@/lib/api/api-path.lib";
import { CreateGroupFamilyDto, UpdateGroupFamilyDto } from "./group-family.dto";
import { cookies } from "next/headers";
import { fetchWithAuth } from "@/lib/api/fetch-with-auth";
import { EnvConfig } from "@/lib/env/env-config.lib";

export const GroupFamilyService = {
  createGroup: async (data: CreateGroupFamilyDto) => {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;
    const result = await fetchWithAuth(apiClient.groupFamily.createGroup, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    return result.json();
  },
  getAll: async () => {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;
    const result = await fetchWithAuth(
      EnvConfig.serverDomain + apiClient.groupFamily.getAll,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return result;
  },
  updateGroup: async (groupId: string, data: UpdateGroupFamilyDto) => {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;
    const result = await fetchWithAuth(
      apiClient.groupFamily.updateGroup(groupId),
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      },
    );
    return result.json();
  },
  getDetail: async (groupId: string) => {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;
    const result = await fetchWithAuth(
      apiClient.groupFamily.getDetail(groupId),
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return result.json();
  },
  joinGroup: async (tokenCode: string) => {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;
    const result = await fetchWithAuth(
      apiClient.groupFamily.updateGroup(tokenCode),
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return result.json();
  },
};
