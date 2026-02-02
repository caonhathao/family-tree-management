export interface AuthResponseDto {
  user: {
    id: string;
    email: string;
    userProfile: {
      fullName: string;
      avatar: string | undefined;
    };
    tokens: {
      accessToken: string;
      refreshToken: string;
    };
  };
}

export interface RegisterDto {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
}

export interface LoginBaseDto {
  email: string;
  password: string;
}
