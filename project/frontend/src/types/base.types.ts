import { USER_ROLE } from "@prisma/client";

export interface ResponseDataBase<T> {
  data: T;
  message: string;
  success: boolean;
}

export interface IErrorResponse {
  success: boolean;
  error: string;
}

export interface ISuccessResponse {
  success: boolean;
  message: string;
}

export interface JwtPayload {
  id: string;
  role: USER_ROLE;
  exp: number;
  iat: number;
}
