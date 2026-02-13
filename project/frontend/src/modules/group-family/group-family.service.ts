import { apiClient } from "@/lib/api/api-path.lib";
import {
  CreateGroupFamilyDto,
  IUpdateGroupFamilyDto,
} from "./group-family.dto";
import { fetchWithAuth } from "@/lib/api/fetch-with-auth";
import { EnvConfig } from "@/lib/env/env-config.lib";

export const GroupFamilyService = {
  createGroup: async (data: CreateGroupFamilyDto) => {
    const result = await fetchWithAuth(
      EnvConfig.serverDomain + apiClient.groupFamily.createGroup,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      },
    );
    return result;
  },
  getAll: async () => {
    const result = await fetchWithAuth(
      EnvConfig.serverDomain + apiClient.groupFamily.getAll,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
    return result;
  },
  updateGroup: async (groupId: string, data: IUpdateGroupFamilyDto) => {
    const result = await fetchWithAuth(
      EnvConfig.serverDomain + apiClient.groupFamily.updateGroup(groupId),
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      },
    );
    return result;
  },
  getDetail: async (groupId: string) => {
    const result = await fetchWithAuth(
      EnvConfig.serverDomain + apiClient.groupFamily.getDetail(groupId),
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
    return result;
  },
  joinGroup: async (tokenCode: string) => {
    const result = await fetchWithAuth(
      EnvConfig.serverDomain + apiClient.groupFamily.joinGroup(tokenCode),
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
    return result;
  },
};
