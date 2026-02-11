import { apiClient } from "@/lib/api/api-path.lib";
import { fetchWithAuth } from "@/lib/api/fetch-with-auth";
import {
  ResponseUpdateGroupMemberDto,
  UpdateGroupMemberDto,
} from "./group-member.dto";
import { ResponseDataBase } from "@/types/base.types";
import { EnvConfig } from "@/lib/env/env-config.lib";

export const GroupMemberService = {
  updateRole: async (
    groupId: string,
    data: UpdateGroupMemberDto,
    token: string | undefined,
  ) => {
    const res: ResponseDataBase<ResponseUpdateGroupMemberDto> =
      await fetchWithAuth(apiClient.groupMember.updateRole(groupId), {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
    return res;
  },
  changeLeader: async (
    groupId: string,
    data: UpdateGroupMemberDto,
    token: string | undefined,
  ) => {
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
    return res;
  },
  deleteGroupMember: async (
    groupId: string,
    memberId: string,
    token: string | undefined,
  ) => {
    const res = await fetchWithAuth(
      apiClient.groupMember.deleteGroupMember(groupId, memberId),
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return res;
  },
  removeFromGroup: async (
    groupId: string,
    memberId: string,
    token: string | undefined,
  ) => {
    const res = await fetchWithAuth(
      EnvConfig.serverDomain +
        apiClient.groupMember.removeFromGroup(groupId, memberId),
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return res;
  },
};
