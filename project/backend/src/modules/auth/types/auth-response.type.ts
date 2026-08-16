import { ApiDataResponse } from 'src/common/constants/api';

export interface AuthUserProfile {
  fullName: string;
  avatar?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  userProfile: AuthUserProfile;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResult {
  user: AuthUser;
  tokens: AuthTokens;
}

export type AuthResponse = ApiDataResponse<AuthResult>;
