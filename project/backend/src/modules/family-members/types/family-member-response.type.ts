import { GENDER } from '@prisma/client';
import { ApiDataResponse } from 'src/common/constants/api';

export interface FamilyMemberData {
  id: string;
  familyId: string;
  fullName: string;
  gender: GENDER;
  dateOfBirth: string;
  generation: number;
  isAlive: boolean;
  avatarUrl: string | null;
}

export type FamilyMemberResponse = ApiDataResponse<FamilyMemberData>;

export type FamilyMembersResponse = ApiDataResponse<FamilyMemberData[]>;
