import { MEMBER_ROLE } from '@prisma/client';
import { ApiDataResponse } from 'src/common/constants/api';

export interface GroupData {
  id: string;
  name: string;
  description: string | null;
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
    userProfile: GroupMemberUserProfile | null;
  };
  role: MEMBER_ROLE;
  isLeader: boolean;
  pinnedMemberId: string | null;
}

export interface GroupDetail extends GroupData {
  family: {
    id: string;
    name: string;
    description: string;
  } | null;
  groupMembers: GroupMemberResponse[];
  createdAt: Date;
  updatedAt: Date;
}

export type GroupDetailResponse = ApiDataResponse<GroupDetail>;

export interface GroupListEntry extends GroupData {
  createdAt: Date;
  updatedAt: Date;
  in_event: boolean;
  hasEventToday: boolean;
}

export type GroupListResponse = ApiDataResponse<GroupListEntry[]>;

export interface JoinGroupData {
  id: string;
  groupId: string;
  memberId: string;
  role: MEMBER_ROLE;
  isLeader: boolean;
}

export type JoinGroupResponse = ApiDataResponse<JoinGroupData>;

export interface QuitGroupData {
  id: string;
  memberId: string;
}

export type QuitGroupResponse = ApiDataResponse<QuitGroupData>;

export interface DeletedGroupData extends GroupData {
  createdAt: Date;
  updatedAt: Date;
}

export type DeletedGroupResponse = ApiDataResponse<DeletedGroupData>;
