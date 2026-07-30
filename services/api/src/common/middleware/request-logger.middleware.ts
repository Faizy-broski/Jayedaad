import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

// Every other error/incident-relevant log now flows through
// AllExceptionsFilter or explicit Logger calls — this is the remaining piece:
// a line per request, so "what was happening right before this broke" is
// answerable from logs alone rather than needing to reproduce locally.
@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction): void {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      this.logger.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
    });
    next();
  }
}
