/**
 * CSRF protection via Origin header validation.
 *
 * Approach: For all state-changing requests (non-GET, non-HEAD, non-OPTIONS),
 * we verify that the Origin header matches an allowed CORS origin.
 *
 * Why this is sufficient for this application:
 * - All auth state is in HttpOnly, SameSite=Lax cookies (not accessible to JS).
 * - The API only accepts JSON bodies (not multipart/form-data from arbitrary sites).
 * - SameSite=Lax already blocks cross-site POSTs in modern browsers.
 * - Origin header validation adds a defence-in-depth layer.
 *
 * This approach is simpler and more maintainable than a CSRF token double-submit
 * pattern while providing equivalent security for this architecture.
 */

import { type Request, type Response, type NextFunction } from 'express';
import { env } from '../env';
import { logger } from '../logger';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export function csrfProtection(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (SAFE_METHODS.has(req.method)) {
    return next();
  }

  const origin = req.headers.origin;

  if (!origin) {
    // No Origin header — could be a non-browser client (curl, Postman, server-to-server).
    // Allow in development; block in production where cookie auth is involved.
    if (env.NODE_ENV === 'production') {
      logger.warn({ path: req.path }, 'CSRF: missing Origin header on state-changing request');
      res.status(403).json({
        error: { message: 'Forbidden', code: 'FORBIDDEN' },
      });
      return;
    }
    return next();
  }

  const allowedOrigins = env.CORS_ORIGINS.split(',').map((o) => o.trim());

  if (!allowedOrigins.includes(origin)) {
    logger.warn({ origin, path: req.path }, 'CSRF: Origin not in allowed list');
    res.status(403).json({
      error: { message: 'Forbidden', code: 'FORBIDDEN' },
    });
    return;
  }

  next();
}
