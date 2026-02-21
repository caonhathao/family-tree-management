import { USER_ROLE } from "@prisma/client";

export interface IUserType {
  id: string;
  role: USER_ROLE;
  userProfile: {
    fullName: string;
    avatar: string | undefined;
  };
}

export interface IAuthResponseDto {
  user: IUserType;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

export interface IRegisterDto {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
}

export interface ILoginBaseDto {
  email: string;
  password: string;
}

export interface IGoogleLoginDto {
  token: string;
}
