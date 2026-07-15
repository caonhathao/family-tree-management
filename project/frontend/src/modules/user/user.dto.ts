import { GENDERS } from "@prisma/client";

export interface IUserInfoDto {
  fullName?: string;
  dateOfBirth?: string;
  biography?: string;
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

export interface IUserList {
  id: string;
  email: string;
  userProfile?: {
    fullName: string;
    avatar: string;
  };
  createdAt: Date;
}
