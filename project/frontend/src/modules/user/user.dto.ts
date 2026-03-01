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
    avatar: string;
    dateOfBirth: Date | undefined | null;
    biography: string;
    gender: GENDERS;
  };
}
