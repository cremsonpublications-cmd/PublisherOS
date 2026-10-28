/**
 * Authentication middleware.
 *
 * Reads the session cookie, validates the token against the sessions table,
 * and attaches the userId, session, and full user context to res.locals.
 *
 * Never trusts any user-supplied ID — only the validated session record.
 */

import { type Request, type Response, type NextFunction } from 'express';
import { type SystemRole, type PublisherRole, type AccountStatus } from '@prisma/client';
import { validateSession } from '../services/sessionService';
import { prisma } from '../db';
import { AuthError } from '../lib/errors';
import { env } from '../env';

interface AuthUser {
  id: string;
  name: string;
  email: string;
  status: AccountStatus;
  systemRole: SystemRole | null;
  publisherRole: PublisherRole | null;
  publisherId: string | null;
  emailVerifiedAt: Date | null;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Locals {
      userId: string;
      sessionId: string;
      sessionToken: string;
      user: AuthUser;
    }
  }
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const token = req.cookies?.[env.SESSION_COOKIE_NAME] as string | undefined;

  if (!token) {
    return next(new AuthError());
  }

  const result = await validateSession(token);

  if (!result) {
    // Clear the stale cookie
    res.clearCookie(env.SESSION_COOKIE_NAME, { path: '/' });
    return next(new AuthError('Session has expired. Please log in again.'));
  }

  // Verify the user still exists and is active
  const user = await prisma.user.findUnique({
    where: { id: result.userId },
    select: {
      id: true,
      name: true,
      email: true,
      status: true,
      systemRole: true,
      publisherRole: true,
      publisherId: true,
      emailVerifiedAt: true,
    },
  });

  if (!user || user.status === 'SUSPENDED') {
    res.clearCookie(env.SESSION_COOKIE_NAME, { path: '/' });
    return next(new AuthError('Account is not accessible'));
  }

  res.locals.userId = result.userId;
  res.locals.sessionId = result.session.id;
  res.locals.sessionToken = token;
  res.locals.user = user;

  next();
}
