import { MEMBER_ROLE } from '@prisma/client';
import { ApiDataResponse } from 'src/common/constants/api';

export interface GroupData {
  id: string;
  name: string;
  description: string;
}

export type GroupResponse = ApiDataResponse<GroupData>;

export interface GroupMemberUserProfile {
  id: string;
  userId: string;
  fullName: string;
  avatar?: string | null;
}

export interface GroupMemberResponse {
  member: {
    userProfile: GroupMemberUserProfile;
  };
  role: MEMBER_ROLE;
  isLeader: boolean;
}

export interface GroupDetail extends GroupData {
  family: {
    id: string;
    name: string;
    description: string;
  };
  groupMembers: GroupMemberResponse[];
  createdAt: Date;
  updatedAt: Date;
}

export interface GroupListEntry extends GroupData {
  createdAt: Date;
  updatedAt: Date;
  in_event: boolean;
  hasEventToday: boolean;
}

export interface JoinGroupData {
  id: string;
  groupId: string;
  memberId: string;
  role: MEMBER_ROLE;
  isLeader: boolean;
}

export type JoinGroupResponse = ApiDataResponse<JoinGroupData>;
