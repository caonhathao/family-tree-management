import { fetchWithAuth } from "@/lib/api/fetch-with-auth";
import { CreateInviteDto } from "./invite.dto";
import { apiClient } from "@/lib/api/api-path.lib";
import { cookies } from "next/headers";

export const InviteService = {
  createInviteLink: async (data: CreateInviteDto) => {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;
    const res = await fetchWithAuth(apiClient.invite.createInvite, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    return res.json();
  },
};
