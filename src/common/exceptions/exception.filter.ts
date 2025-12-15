import { Logger } from '@/shared/logger';
import type { ArgumentsHost, ExceptionFilter as ExceptionFilterBase } from '@nestjs/common';
import { Catch, HttpException, HttpStatus } from '@nestjs/common';
import { SentryExceptionCaptured } from '@sentry/nestjs';

function processMessage(exception: any): string {
  let message: any = exception instanceof HttpException ? exception.getResponse() : 'Internal server error';
  if (typeof message === 'object') {
    message = message.message ? message.message : message.error || message;
  }
  return message;
}

@Catch()
export class ExceptionFilter<T> implements ExceptionFilterBase {
  logger = new Logger(ExceptionFilter.name);

  @SentryExceptionCaptured()
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest();
    const response = ctx.getResponse();

    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const message = processMessage(exception);
    const endpoint = `❌ Endpoint: ${request.method} ${request.url} 💔 ${status}`;

    this.logger.error(message);
    this.logger.error(endpoint);
    this.logger.error(JSON.stringify(exception, null, 2));

    return response.status(status).json({
      meta: {
        code: status,
        message,
      },
      data: null,
    });
  }
}
