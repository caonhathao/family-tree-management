export interface ResponseDataBase<T> {
  data: T;
  message: string;
  success: boolean;
}

export interface IErrorResponse {
  success: boolean;
  error: string;
}
