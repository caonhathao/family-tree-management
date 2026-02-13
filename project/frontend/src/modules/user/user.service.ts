import { fetchWithAuth } from "@/lib/api/fetch-with-auth";
import { apiClient } from "@/lib/api/api-path.lib";
import { EnvConfig } from "@/lib/env/env-config.lib";

export const UserServices = {
  updateUser: async (userId: string, formData: FormData) => {
    const res = await fetchWithAuth(
      EnvConfig.serverDomain + apiClient.user.updateUser(userId),
      {
        method: "PATCH",
        body: formData,
      },
    );
    return res;
  },
  getUserDetail: async (userId: string) => {
    const res = await fetchWithAuth(
      EnvConfig.serverDomain + apiClient.user.getDetail(userId),
      {
        method: "GET",
      },
    );
    console.log("res at getUserDetail:", res);
    return res;
  },
};
