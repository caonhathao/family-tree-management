import { ZodError } from 'zod';
import { ApiResponse, HttpStatus, StatusCode } from '../constants/api';
import { ServiceError } from '../errors/service-error';
import { BusinessException } from '../errors/business.exception';
import {
  toTypedPrismaError,
  PrismaUniqueConstraintError,
  PrismaOperationFailedError,
  PrismaRecordDoesNotExistError,
  PrismaForeignKeyConstraintError,
} from '../errors/prisma-errors';
import {
  SuccessOptions,
  PaginatedOptions,
  ErrorOptions,
} from 'src/common/interfaces/response.interface';
import { HttpException } from '@nestjs/common';

export class ResponseFactory {
  static success<T = null>({
    data,
    message = 'success',
    code = HttpStatus.OK,
    meta,
  }: SuccessOptions<T>): ApiResponse<T> {
    return {
      success: true,
      message,
      code,
      data,
      meta,
    };
  }

  static paginated<T = null>({
    data,
    page,
    limit,
    total,
    message = 'success',
    code = HttpStatus.OK,
  }: PaginatedOptions<T>): ApiResponse<T> {
    const totalPages = Math.ceil(total / (limit || 1));

    return ResponseFactory.success({
      data,
      message,
      code,
      meta: {
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
    });
  }

  static error({
    message = 'error',
    code = HttpStatus.BAD_REQUEST,
    errors = null,
  }: ErrorOptions = {}): ApiResponse<never> {
    return {
      success: false,
      message,
      code,
      errors,
    };
  }

  static handleError(error: unknown): ApiResponse<never> {
    console.error('Operation failed:', error);

    if (error instanceof ServiceError) {
      return ResponseFactory.error({
        message: error.message,
        code: error.statusCode,
        errors: error.errors,
      });
    }

    if (error instanceof BusinessException) {
      return ResponseFactory.error({
        message: error.message,
        code: error.getStatus() as StatusCode,
        errors: error.errors,
      });
    }

    if (error instanceof HttpException) {
      const status = error.getStatus();

      const isKnownStatus = Object.values(HttpStatus).includes(
        status as StatusCode,
      );
      const finalStatus: StatusCode = isKnownStatus
        ? (status as StatusCode)
        : HttpStatus.INTERNAL_SERVER_ERROR;

      const response = error.getResponse();
      const responseBody =
        typeof response === 'object' && response !== null
          ? (response as Record<string, unknown>)
          : null;

      // `message` from the payload wins (validation arrays, error keys, ...)
      const rawMessage = responseBody?.message ?? error.message;
      const message = Array.isArray(rawMessage)
        ? rawMessage.join(', ')
        : typeof rawMessage === 'string'
          ? rawMessage
          : error.message;

      const errors = responseBody?.message
        ? Array.isArray(responseBody.message)
          ? { _errors: responseBody.message as string[] }
          : responseBody
        : null;

      return ResponseFactory.error({
        message,
        code: finalStatus,
        errors,
      });
    }

    if (error instanceof ZodError) {
      return ResponseFactory.error({
        message: 'Validation Error',
        code: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: error.flatten().fieldErrors,
      });
    }

    const prismaError = toTypedPrismaError(error);

    if (prismaError) {
      if (prismaError instanceof PrismaUniqueConstraintError) {
        const target =
          (prismaError.meta as { target?: string[] })?.target?.join(', ') ||
          'field';
        return ResponseFactory.error({
          message: `Value for ${target} already exists.`,
          code: HttpStatus.CONFLICT,
        });
      }

      if (
        prismaError instanceof PrismaOperationFailedError ||
        prismaError instanceof PrismaRecordDoesNotExistError
      ) {
        return ResponseFactory.error({
          message: 'Requested record not found.',
          code: HttpStatus.NOT_FOUND,
        });
      }

      if (prismaError instanceof PrismaForeignKeyConstraintError) {
        const field =
          (prismaError.meta as { field_name?: string })?.field_name ||
          'reference';
        return ResponseFactory.error({
          message: `Invalid reference: ${field} does not exist.`,
          code: HttpStatus.BAD_REQUEST,
        });
      }

      if (prismaError.code === 'P2000') {
        return ResponseFactory.error({
          message: 'Input value is too long.',
          code: HttpStatus.BAD_REQUEST,
        });
      }

      if (prismaError.code === 'P1008') {
        return ResponseFactory.error({
          message: 'Database operation timed out.',
          code: HttpStatus.GATEWAY_TIMEOUT,
        });
      }
    }

    // Default to 500
    return ResponseFactory.error({
      message: 'Internal Server Error',
      code: HttpStatus.INTERNAL_SERVER_ERROR,
    });
  }
}
