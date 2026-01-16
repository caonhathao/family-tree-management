export interface ResponseDataBase<T> {
  data: T;
  message: string;
}

export interface ResponseLoginDataDto {
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

export interface CreateRegisterDto {
  email: string;
  password: string;
  fillName: string;
}

export interface LoginBaseDto {
  emai: string;
  password: string;
}
