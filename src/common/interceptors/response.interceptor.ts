import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';

interface ApiEnvelope<T> {
  data: T;
  meta: {
    path?: string;
    timestamp: string;
  };
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<
  T,
  ApiEnvelope<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiEnvelope<T>> {
    const request = context.switchToHttp().getRequest<{ url?: string }>();
    return next.handle().pipe(
      map((data) => ({
        data,
        meta: {
          path: request.url,
          timestamp: new Date().toISOString(),
        },
      })),
    );
  }
}
