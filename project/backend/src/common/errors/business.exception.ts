import { HttpException } from '@nestjs/common';
import { StatusCode } from '../constants/api';
import { ErrorCode } from './error-codes.enum';
import { ErrorMessagesMap } from './error-messages.map';

export interface BusinessExceptionOptions {
  /** Overrides the default response message (translation key). */
  message?: string;
  /** Overrides the default HTTP status resolved from ErrorMessagesMap. */
  httpStatus?: StatusCode;
  /** Field-level validation errors forwarded into the response. */
  errors?: Record<string, string[] | undefined> | null | object;
}

export class BusinessException extends HttpException {
  public readonly errorCode: ErrorCode;
  public readonly errors?: Record<string, string[] | undefined> | null | object;

  constructor(errorCode: ErrorCode, options: BusinessExceptionOptions = {}) {
    const config = ErrorMessagesMap[errorCode];
    const status = options.httpStatus ?? config.httpStatus;

    super(
      {
        message: options.message ?? config.message,
        errors: options.errors,
      },
      status,
    );

    this.errorCode = errorCode;
    this.errors = options.errors;
    this.name = 'BusinessException';
  }
}
