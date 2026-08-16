import { AUTH_TYPE, GENDERS, PROVIDERS } from '@prisma/client';
import { ApiDataResponse } from 'src/common/constants/api';

export interface UserProfileResponse {
  fullName: string;
  avatar?: string | null;
  dateOfBirth?: string | null;
  biography?: unknown;
  memorableName?: string | null;
  address?: string | null;
  gender?: GENDERS;
}

export interface UserResponseData {
  id: string;
  email?: string;
  userProfile: UserProfileResponse;
  groups?: number;
  invites?: number;
}

export type UserResponse = ApiDataResponse<UserResponseData>;

export interface UserListEntry {
  id: string;
  email: string;
  userProfile: {
    fullName: string;
    avatar?: string | null;
  } | null;
  createdAt: Date;
}

export interface UserPagination {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  totalPages: number;
}

export interface UserListData {
  data: UserListEntry[];
  pagination: UserPagination;
}

export type UserListResponse = ApiDataResponse<UserListData>;

export interface AuthProviderData {
  id?: string;
  provider?: PROVIDERS;
}

export type UserProvidersResponse = ApiDataResponse<AuthProviderData[]>;

export interface AuthLogData {
  id: string;
  accountId: string;
  authBy: PROVIDERS;
  type: AUTH_TYPE;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
}

export interface AuthLogListData {
  data: AuthLogData[];
  pagination: UserPagination;
}

export type AuthLogListResponse = ApiDataResponse<AuthLogListData>;
