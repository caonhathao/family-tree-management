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

export interface dataProps {
  title: string;
  content: {
    icon: IconType;
    title: string;
    url: string;
  }[];
}
