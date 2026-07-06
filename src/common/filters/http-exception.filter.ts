import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<{ url?: string }>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const body =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    const message =
      typeof body === 'string'
        ? body
        : ((body as { message?: unknown }).message ?? 'Request failed');

    response.status(status).json({
      statusCode: status,
      message: message,
      data: null,
      error:
        typeof body === 'object'
          ? (body as { error?: string }).error
          : undefined,
      meta: {
        path: request.url,
        timestamp: new Date().toISOString(),
      },
    });
  }
}
