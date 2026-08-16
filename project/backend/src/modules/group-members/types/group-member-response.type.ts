import { MEMBER_ROLE } from '@prisma/client';
import { StatusCode } from 'src/common/constants/api';

export interface GroupMemberData {
  id: string;
  groupId: string;
  memberId: string;
  role: MEMBER_ROLE;
  isLeader: boolean;
}

export interface GroupMemberResponse {
  success: boolean;
  message: string;
  data: GroupMemberData;
  code: StatusCode;
}

export interface RemoveMemberData {
  count: number;
}

export interface RemoveMemberResponse {
  success: boolean;
  message: string;
  data: RemoveMemberData;
  code: StatusCode;
}
