import { GENDER } from '@prisma/client';
import { TestApi } from '../api.client';
import { NewFamilyResponse } from 'src/modules/family/types/family-response.type';
import {
  FamilyMemberData,
  FamilyMemberResponse,
} from 'src/modules/family-members/types/family-member-response.type';

export interface FamilyCreatePayload {
  name: string;
  description?: string;
}

export interface CreateFamilyMemberPayload {
  familyId: string;
  fullName: string;
  gender: GENDER;
  dateOfBirth?: string | Date;
  dateOfDeath?: string | null;
  isAlive?: boolean;
  biography?: string;
  generation?: number;
}

export const createFamily = (
  api: TestApi,
  token: string,
  groupId: string,
  data: FamilyCreatePayload,
  expectStatus?: number,
): Promise<NewFamilyResponse> =>
  api.post<NewFamilyResponse>(`/family/${groupId}`, data, {
    token,
    ...(expectStatus !== undefined ? { expect: expectStatus } : {}),
  });

export const createMember = async (
  api: TestApi,
  token: string,
  groupId: string,
  data: CreateFamilyMemberPayload,
  expectStatus?: number,
): Promise<FamilyMemberData> => {
  const body = await api.post<FamilyMemberResponse>(
    `/family-member/${groupId}`,
    data,
    {
      token,
      ...(expectStatus !== undefined ? { expect: expectStatus } : {}),
    },
  );
  return body.data;
};
