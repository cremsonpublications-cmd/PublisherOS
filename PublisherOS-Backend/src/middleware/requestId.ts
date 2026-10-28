import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

export const REQUEST_ID_HEADER = 'x-request-id';

/**
 * Attaches a correlation ID to every request.
 * Reuses the client-supplied header if present, otherwise generates a new UUID.
 */
export function requestIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const existing = req.headers[REQUEST_ID_HEADER];
  const requestId =
    typeof existing === 'string' && existing.length > 0 ? existing : uuidv4();

  req.headers[REQUEST_ID_HEADER] = requestId;
  res.setHeader(REQUEST_ID_HEADER, requestId);

  next();
}
