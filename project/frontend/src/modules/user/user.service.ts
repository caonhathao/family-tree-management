import { fetchWithAuth } from "@/lib/api/fetch-with-auth";
import { apiClient } from "@/lib/api/api-path.lib";
import { cookies } from "next/headers";
import { EnvConfig } from "@/lib/env/env-config.lib";

export const UserServices = {
  updateUser: async (userId: string, formData: FormData) => {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    const res = await fetchWithAuth(
      EnvConfig.serverDomain + apiClient.user.updateUser(userId),
      {
        method: "PATCH",
        headers: {
          Authrization: `Bearer ${token}`,
        },
        body: formData,
      },
    );
    return res.json();
  },
  getUserDetail: async (userId: string) => {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    const res = await fetchWithAuth(
      EnvConfig.serverDomain + apiClient.user.getDetail(userId),
      {
        method: "GET",
        headers: {
          Authrization: `Bearer ${token}`,
        },
      },
    );
    return res;
  },
};
