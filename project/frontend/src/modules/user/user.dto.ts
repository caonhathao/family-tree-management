import { AUTH_TYPE, GENDERS, PROVIDERS } from "@/types/enums";

export interface IUserInfoDto {
  fullName?: string;
  dateOfBirth?: string;
  biography?: string;
  memorableName?: string;
  address?: string;
}

export interface IUserSecuityDto {
  email?: string;
  password?: string;
}

export interface IResponseUserDto {
  id: string;
  email: string;
  userProfile: {
    fullName: string;
    memorableName?: string;
    avatar: string;
    address?: string;
    dateOfBirth: string;
    biography: string;
    gender: GENDERS;
  };
  groups: number;
  invites: number;
}

export interface IResponseLinkProvidersDto {
  id: string;
  provider: string;
}

export interface IResponseAuthLog {
  id: string;
  accountId: string;
  ipAddress: string | null;
  userAgent: string | null;
  type: AUTH_TYPE;
  authBy: PROVIDERS;
  createdAt: Date;
}

export interface IUserList {
  id: string;
  email: string;
  userProfile?: {
    fullName: string;
    avatar: string;
  };
  createdAt: Date;
}
