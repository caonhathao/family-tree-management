// src/common/interceptors/transform.interceptor.ts
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  StreamableFile,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { HTTP_CODE_METADATA } from '@nestjs/common/constants';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse, HttpStatus, StatusCode } from 'src/common/constants/api';
import { BYPASS_TRANSFORM_KEY } from 'src/common/decorators/bypass-transform.decorator';

/**
 * Global response transformer.
 *
 * Guarantees every successful response matches the standard envelope:
 *   { success: true, code: <status>, message: string, data: <payload> }
 *
 * The interceptor is idempotent:
 *  - responses already shaped as ApiResponse (returned via ResponseFactory)
 *    are passed through untouched;
 *  - raw values (strings, booleans, DTOs, ...) are wrapped once.
 *
 * Bypass with `@BypassTransform()` for streams / file downloads.
 */
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<T> | T
> {
  constructor(private readonly reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiResponse<T> | T> {
    const shouldBypass =
      this.reflector.getAllAndOverride<boolean>(BYPASS_TRANSFORM_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? false;

    return next.handle().pipe(
      map((data) => {
        if (shouldBypass || this.isStream(data) || this.isApiResponse(data)) {
          return data;
        }

        return {
          success: true,
          code: this.resolveStatusCode(context),
          message: 'success',
          data,
        } satisfies ApiResponse<T>;
      }),
    );
  }

  private resolveStatusCode(context: ExecutionContext): StatusCode {
    const declared = this.reflector.getAllAndOverride<number | undefined>(
      HTTP_CODE_METADATA,
      [context.getHandler(), context.getClass()],
    );

    return (declared as StatusCode) ?? HttpStatus.OK;
  }

  private isApiResponse(value: unknown): value is ApiResponse {
    if (!value || typeof value !== 'object') return false;

    const record = value as Record<string, unknown>;
    return (
      typeof record.success === 'boolean' &&
      typeof record.code === 'number' &&
      typeof record.message === 'string'
    );
  }

  private isStream(value: unknown): boolean {
    if (value instanceof StreamableFile) return true;

    return (
      value !== null &&
      typeof value === 'object' &&
      typeof (value as { pipe?: unknown }).pipe === 'function'
    );
  }
}
