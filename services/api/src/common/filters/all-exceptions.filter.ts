import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

interface ErrorResponseBody {
  statusCode: number;
  message: string;
  error: string;
  timestamp: string;
  path: string;
}

// Catches everything Nest's default handler would otherwise turn into an
// unstructured response — HttpExceptions (thrown deliberately, e.g.
// BadRequestException) keep their status/message; anything else (raw
// Supabase/Postgrest errors bubbling up from repositories, unexpected bugs)
// becomes a generic 500 to the client, with the real error only ever logged
// server-side — never leak DB error details (column names, constraints) to
// callers.
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionsFilter');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isHttpException = exception instanceof HttpException;
    const status = isHttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const body: ErrorResponseBody = {
      statusCode: status,
      message: isHttpException ? extractMessage(exception) : 'Internal server error',
      error: isHttpException ? exception.name : 'InternalServerError',
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    const logLine = `${request.method} ${request.url} -> ${status}`;
    if (status >= 500) {
      this.logger.error(logLine, exception instanceof Error ? exception.stack : String(exception));
    } else {
      this.logger.warn(logLine);
    }

    response.status(status).json(body);
  }
}

function extractMessage(exception: HttpException): string {
  const response = exception.getResponse();
  if (typeof response === 'string') return response;
  if (response && typeof response === 'object' && 'message' in response) {
    const message = (response as { message: unknown }).message;
    return Array.isArray(message) ? message.join(', ') : String(message);
  }
  return exception.message;
}
