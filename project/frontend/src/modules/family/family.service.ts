import { apiClient } from "@/lib/api/api-path.lib";
import { fetchWithAuth } from "@/lib/api/fetch-with-auth";
import { cookies } from "next/headers";
import { IDraftFamilyData } from "@/types/draft.types";
import { EnvConfig } from "@/lib/env/env-config.lib";

export const FamilyService = {
  syncFamily: async (
    groupId: string,
    data: IDraftFamilyData,
    token: string | undefined,
  ) => {
    const result = await fetchWithAuth(
      EnvConfig.serverDomain + apiClient.family.syncFamily(groupId),
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

  getFamily: async (groupId: string) => {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    const result = await fetchWithAuth(
      EnvConfig.serverDomain + apiClient.family.getFamily(groupId),
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

  deleteFamily: async (familyId: string, groupId: string) => {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    const result = await fetchWithAuth(
      apiClient.family.deleteFamily(familyId, groupId),
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return result.json();
  },
};
