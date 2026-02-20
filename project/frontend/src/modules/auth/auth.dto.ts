export interface IUserType {
  id: string;
  email: string;
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
