import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../logger';
import { env } from '../env';
import { AppError } from '../lib/errors';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const requestId = req.headers['x-request-id'];

  if (err instanceof ZodError) {
    logger.warn({ requestId, issues: err.issues }, 'Validation error');
    res.status(400).json({
      error: {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: err.issues.map((i) => ({
          path: i.path.join('.'),
          message: i.message,
        })),
      },
    });
    return;
  }

  if (err instanceof AppError) {
    // Log 4xx at warn, 5xx at error
    const logFn = err.statusCode >= 500 ? logger.error.bind(logger) : logger.warn.bind(logger);
    logFn({ requestId, code: err.code, statusCode: err.statusCode }, err.message);
    res.status(err.statusCode).json({
      error: {
        message:
          err.statusCode >= 500 && env.NODE_ENV === 'production'
            ? 'Internal server error'
            : err.message,
        code: err.code,
      },
    });
    return;
  }

  logger.error(
    {
      requestId,
      err: {
        name: err.name,
        message: err.message,
        ...(env.NODE_ENV !== 'production' && { stack: err.stack }),
      },
    },
    'Unhandled error',
  );

  res.status(500).json({
    error: {
      message: env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
      code: 'INTERNAL_ERROR',
    },
  });
}
