import { GENDER, LINEAGE_TYPE, TYPE_RELATIONSHIP } from '@prisma/client';
import { ApiDataResponse } from 'src/common/constants/api';

export interface FamilyInfo {
  id: string;
  name: string;
  description: string;
  lineageType: LINEAGE_TYPE;
}

export interface FamilyMemberData {
  id: string;
  familyId: string;
  fullName: string;
  gender: GENDER;
  dateOfBirth?: Date | null;
  dateOfDeath?: Date | null;
  isAlive: boolean;
  biography?: unknown;
  generation: number;
  positionX?: number | null;
  positionY?: number | null;
  localId: string;
}

export interface FamilyRelationData {
  id?: string;
  localId: string;
  fromMemberId: string;
  toMemberId: string;
  type: TYPE_RELATIONSHIP;
}

export interface FamilySyncData {
  family: FamilyInfo;
  members: FamilyMemberData[];
  relationships: FamilyRelationData[];
}

export type NewFamilyResponse = ApiDataResponse<FamilySyncData>;

export interface FamilyMapInfo {
  id?: string;
  localId: string;
  name: string;
  description: string;
  lineageType: LINEAGE_TYPE;
}

export interface FamilyDetailData {
  family: FamilyMapInfo;
  members: FamilyMemberData[];
  relationships: FamilyRelationData[];
}

export type FamilyDetailResponse = ApiDataResponse<FamilyDetailData>;

export type UpdateFamilyData = FamilyInfo;

export type UpdateFamilyResponse = ApiDataResponse<UpdateFamilyData>;

export type DeleteFamilyResponse = ApiDataResponse<{ id: string }>;
