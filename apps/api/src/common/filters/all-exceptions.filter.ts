import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : (exception as any)?.message ?? 'Internal server error';

    if (status >= 500) {
      this.logger.error(
        `[${req.method}] ${req.url} → ${status}`,
        (exception as any)?.stack,
      );
    } else {
      this.logger.warn(`[${req.method}] ${req.url} → ${status}: ${JSON.stringify(message)}`);
    }

    res.status(status).json({
      statusCode: status,
      path: req.url,
      message,
    });
  }
}
