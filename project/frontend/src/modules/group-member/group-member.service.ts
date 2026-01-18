import { apiClient } from "@/lib/api/api-path.lib";
import { fetchWithAuth } from "@/lib/api/fetch-with-auth";
import { cookies } from "next/headers";
import { UpdateGroupMemberDto } from "./group-member.dto";

export const GroupMemberService = {
  updateRole: async (groupId: string, data: UpdateGroupMemberDto) => {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;
    const res = await fetchWithAuth(apiClient.groupMember.updateRole(groupId), {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  changeLeader: async (groupId: string, data: UpdateGroupMemberDto) => {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;
    const res = await fetchWithAuth(
      apiClient.groupMember.changeLeader(groupId),
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      },
    );
    return res.json();
  },
  deleteGroupMember: async (groupId: string, memberId: string) => {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;
    const res = await fetchWithAuth(
      apiClient.groupMember.deleteGroupMember(groupId, memberId),
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return res.json();
  },
};
