import { apiClient } from "@/lib/api/api-path.lib";
import {
  CreateGroupFamilyDto,
  IUpdateGroupFamilyDto,
} from "./group-family.dto";
import { fetchWithAuth } from "@/lib/api/fetch-with-auth";
import { EnvConfig } from "@/lib/env/env-config.lib";

export const GroupFamilyService = {
  createGroup: async (
    data: CreateGroupFamilyDto,
    token: string | undefined,
  ) => {
    const result = await fetchWithAuth(
      EnvConfig.serverDomain + apiClient.groupFamily.createGroup,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      },
    );
    return result;
  },
  getAll: async (token: string | undefined) => {
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
  updateGroup: async (
    groupId: string,
    data: IUpdateGroupFamilyDto,
    token: string | undefined,
  ) => {
    const result = await fetchWithAuth(
      EnvConfig.serverDomain + apiClient.groupFamily.updateGroup(groupId),
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      },
    );
    return result;
  },
  getDetail: async (groupId: string, token: string | undefined) => {
    const result = await fetchWithAuth(
      EnvConfig.serverDomain + apiClient.groupFamily.getDetail(groupId),
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
  joinGroup: async (tokenCode: string, token: string | undefined) => {
    const result = await fetchWithAuth(
      EnvConfig.serverDomain + apiClient.groupFamily.joinGroup(tokenCode),
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return result;
  },
};
