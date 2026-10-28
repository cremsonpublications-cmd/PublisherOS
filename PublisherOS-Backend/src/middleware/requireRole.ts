import { type Request, type Response, type NextFunction } from 'express';
import { AppError } from '../lib/errors.js';
import { isAdminHost } from './domainResolution.js';
import { env } from '../env.js';

export function requireSuperAdmin() {
  return (_req: Request, res: Response, next: NextFunction) => {
    // In production, super-admin routes are only accessible from the admin domain.
    if (env.NODE_ENV === 'production' && !isAdminHost(res.locals.requestHost ?? '')) {
      return next(new AppError('Forbidden', 403, 'FORBIDDEN'));
    }
    if (res.locals.user?.systemRole !== 'SUPER_ADMIN') {
      return next(new AppError('Forbidden', 403, 'FORBIDDEN'));
    }
    next();
  };
}

export function requirePublisherOwner() {
  return (_req: Request, res: Response, next: NextFunction) => {
    if (res.locals.user?.publisherRole !== 'PUBLISHER_OWNER') {
      return next(new AppError('Forbidden', 403, 'FORBIDDEN'));
    }
    next();
  };
}

export function requirePublisher() {
  return (_req: Request, res: Response, next: NextFunction) => {
    if (!res.locals.user?.publisherId) {
      return next(new AppError('Forbidden', 403, 'FORBIDDEN'));
    }
    next();
  };
}
