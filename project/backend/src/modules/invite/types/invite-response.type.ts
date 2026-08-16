import { ApiDataResponse } from 'src/common/constants/api';

export interface InviteData {
  inviteLink: string;
}

export type InviteResponse = ApiDataResponse<InviteData>;
