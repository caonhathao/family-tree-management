import { apiClient } from "@/lib/api/api-path.lib";
import { fetchWithAuth } from "@/lib/api/fetch-with-auth";
import { cookies } from "next/headers";
import { UpdateFamilyDto } from "./family.dto";

export const FamilyService = {
  updateFamily: async (groupId: string, data: UpdateFamilyDto) => {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    const result = await fetchWithAuth(apiClient.family.syncFamily(groupId), {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    return result.json();
  },
  getFamily: async (familyId: string) => {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    const result = await fetchWithAuth(apiClient.family.getFamily(familyId), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    return result.json();
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
