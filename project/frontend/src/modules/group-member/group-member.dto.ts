export interface UpdateGroupMemberDto {
  id: string;
  role?: string | undefined;
}

export interface ResponseUpdateGroupMemberDto {
  id: string;
  memberId: string;
  groupId: string;
  role: string;
}
