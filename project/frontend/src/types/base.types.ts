export interface ResponseDataBase<T> {
  data: T;
  message: string;
  success: boolean;
}

export interface IErrorResponse {
  success: boolean;
  error: string;
}

export interface JwtPayload {
  payload: {
    sub: string;
    email: string;
  };
  exp: number;
  iat: number;
}
