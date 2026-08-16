import { ApiDataResponse } from 'src/common/constants/api';

export interface FamilyData {
  id: string;
  name: string;
  description: string;
}

export interface FamilyOwner {
  id: string;
  name: string;
  avatar: string;
}

export interface NewFamilyData {
  family: FamilyData;
  owner: FamilyOwner;
}

export type NewFamilyResponse = ApiDataResponse<NewFamilyData>;

export interface FamilyCounts {
  familyMembers: number;
  albums: number;
  events: number;
  activityLogs: number;
}

export interface FamilyDetailOwner {
  id: string;
  userProfile: {
    fullName: string;
    avatar: string;
  };
}

export interface FamilyDetailData {
  id: string;
  name: string;
  description: string;
  owner: FamilyDetailOwner;
  _count: FamilyCounts;
}

export type FamilyDetailResponse = ApiDataResponse<FamilyDetailData>;

export interface UpdateFamilyData {
  id: string;
  name: string;
  description: string;
}

export type UpdateFamilyResponse = ApiDataResponse<UpdateFamilyData>;

export type DeleteFamilyResponse = ApiDataResponse<{ id: string }>;
