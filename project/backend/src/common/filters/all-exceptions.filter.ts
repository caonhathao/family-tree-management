// src/common/filters/all-exceptions.filter.ts
import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';
import { Response } from 'express'; // Dùng Response từ express
import { ResponseFactory } from '../factories/response.factory';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const apiResponse = ResponseFactory.handleError(exception);

    response.status(apiResponse.code).json(apiResponse);
  }
}
