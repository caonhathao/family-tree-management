import { fetchWithAuth } from "@/lib/api/fetch-with-auth";
import { ICreateInviteDto } from "./invite.dto";
import { apiClient } from "@/lib/api/api-path.lib";
import { EnvConfig } from "@/lib/env/env-config.lib";

export const InviteService = {
  createInviteLink: async (data: ICreateInviteDto) => {
    const res = await fetchWithAuth(
      EnvConfig.serverDomain + apiClient.invite.createInvite,
      {
        method: "POST",
        body: JSON.stringify(data),
      },
    );
    return res;
  },
};
