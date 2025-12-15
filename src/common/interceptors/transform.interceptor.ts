import type { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import type { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { IResponse } from '../interfaces/response';
import { Logger } from '@/shared/logger';

function processResponseData(data: any, statusCode?: number): any {
  return {
    meta: {
      code: data?.statusCode || statusCode,
      message: data?.message || 'Successful',
      ...(data?.meta || {}),
    },
    data: data?.items || data,
  };
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, IResponse<T>> {
  logger = new Logger(TransformInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<IResponse<T>> {
    const { statusCode, req } = context.switchToHttp().getResponse();
    const startTime = Date.now();

    return next.handle().pipe(
      map((data) => {
        const responseTime = Date.now() - startTime;
        this.logger.success(
          `💚 Endpoint: ${req.method} ${req.url} 🔥 Response Status Code: ${statusCode} ⏱️  ${responseTime}ms`
        );
        return processResponseData(data, statusCode);
      })
    );
  }
}
