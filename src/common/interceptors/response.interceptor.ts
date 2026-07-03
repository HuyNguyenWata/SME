import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { Reflector } from '@nestjs/core';
import { Response } from 'express';
import { RESPONSE_MESSAGE } from '../decorators/response-message.decorator';

export interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<T>
> {
  constructor(private reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data) => {
        const response = context.switchToHttp().getResponse<Response>();
        const statusCode = response.statusCode;
        const message =
          this.reflector.get<string>(RESPONSE_MESSAGE, context.getHandler()) ||
          'Success';

        return {
          statusCode,
          message,
          data,
        };
      }),
    );
  }
}
