import { MEMBER_ROLE } from "@prisma/client";

export interface UpdateGroupMemberDto {
  id: string;
  role?: MEMBER_ROLE | undefined;
}

export interface ResponseUpdateGroupMemberDto {
  id: string;
  memberId: string;
  groupId: string;
  role: string;
}
