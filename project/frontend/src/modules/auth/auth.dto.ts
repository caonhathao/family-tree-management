import { PROVIDERS, USER_ROLE } from "@prisma/client";

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
    accessTokenExpiresIn: number;
    refreshTokenExpiresIn: number;
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

export interface INewBaseAuth {
  password: string;
  confirmPassword: string;
}

export interface IChangePasswordDto {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface IChangeEmailDto {
  newEmail: string;
  password: string;
}

export interface IUnlinkProviderDto {
  accountId: string;
}

export interface IGoogleLoginDto {
  token: string;
}

export interface IVerifyPasswordDto {
  password: string;
}

export interface IVerifyGoogleDto {
  token: string;
}

export interface IDeleteAccountDto {
  password?: string;
}

export interface IDeleteAccountResponseDto {
  success: boolean;
}

export interface ILoginInfoAccountDto {
  id: string;
  email: string | null;
  provider: PROVIDERS | null;
  createdAt: string;
}

export interface IResponseLoginInfoDto {
  accounts: ILoginInfoAccountDto[];
}
