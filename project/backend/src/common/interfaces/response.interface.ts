import { StatusCode, ApiResponse } from 'src/common/constants/api';

export interface SuccessOptions<T> {
  data?: T;
  message?: string;
  code?: StatusCode;
  meta?: ApiResponse<T>['meta'];
}

export interface PaginatedOptions<T> {
  data?: T;
  page: number;
  limit: number;
  total: number;
  message?: string;
  code?: StatusCode;
}

export interface ErrorOptions {
  message?: string;
  code?: StatusCode;
  errors?: Record<string, string[] | undefined> | null | object;
}
