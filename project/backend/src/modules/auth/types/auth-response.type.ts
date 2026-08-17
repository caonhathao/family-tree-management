import { PROVIDERS, USER_ROLE } from '@prisma/client';
import { ApiDataResponse } from 'src/common/constants/api';

export interface AuthUserProfile {
  fullName: string;
  avatar?: string | null;
}

export interface AuthUser {
  id: string;
  role: USER_ROLE;
  userProfile: AuthUserProfile;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: number;
  refreshTokenExpiresIn: number;
}

export interface AuthResult {
  user: AuthUser;
  tokens: AuthTokens;
}

export type AuthResponse = ApiDataResponse<AuthResult>;

export interface AuthActionData {
  success: boolean;
  message: string;
  alreadyLinked?: boolean;
}

export type AuthActionResponse = ApiDataResponse<AuthActionData>;

export interface AuthStatusData {
  success: boolean;
}

export type AuthStatusResponse = ApiDataResponse<AuthStatusData>;

export interface AuthLoginInfoAccount {
  id: string;
  email: string | null;
  provider?: PROVIDERS;
  createdAt: Date;
}

export interface AuthLoginInfoData {
  accounts: AuthLoginInfoAccount[];
}

export type AuthLoginInfoResponse = ApiDataResponse<AuthLoginInfoData>;
