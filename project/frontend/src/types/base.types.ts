import { USER_ROLE } from "@prisma/client";
import { IconType } from "react-icons";

export interface ResponseDataBase<T> {
  data: T;
  message: string;
  success: boolean;
}

export interface IPaginationBase<T> {
  data: T;
  pagination: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
  };
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

export interface dataProps {
  title: string;
  content: {
    icon: IconType;
    title: string;
    url: string;
  }[];
}
