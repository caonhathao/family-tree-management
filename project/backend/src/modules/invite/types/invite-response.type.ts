import { ApiDataResponse } from 'src/common/constants/api';

export interface InviteData {
  inviteLink: string;
}

export type InviteResponse = ApiDataResponse<InviteData>;

export interface InviteSenderProfile {
  fullName: string;
  avatar?: string | null;
}

export interface InviteInfoData {
  id: string;
  name: string;
  description: string | null;
  _count: {
    groupMembers: number;
  };
  memberCount: number;
  sender: InviteSenderProfile | null;
}

export type InviteInfoResponse = ApiDataResponse<InviteInfoData>;
