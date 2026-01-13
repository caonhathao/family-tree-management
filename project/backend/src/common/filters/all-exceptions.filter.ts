// src/common/filters/all-exceptions.filter.ts
import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';
import { Response } from 'express';
import { ResponseFactory } from '../factories/response.factory';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    console.log('Filter đã bắt được lỗi:', exception);
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const apiResponse = ResponseFactory.handleError(exception);

    response.status(apiResponse.code).json(apiResponse);
  }
}
