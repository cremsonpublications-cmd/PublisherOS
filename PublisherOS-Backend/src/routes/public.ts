/**
 * Public routes — /api/v1/public
 *
 * No authentication required. These endpoints power the public-facing
 * publisher website when accessed via a custom domain.
 *
 * The domain resolution middleware (app.ts) runs before these routes and
 * sets res.locals.resolvedPublisherId when the request host matches a
 * publisher's customDomain.
 */

import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { registerCustomer, verifyCustomerEmail, loginCustomer } from '../services/publicAuthService.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';
import { env } from '../env.js';

export const publicRouter = Router();

// ── Helpers ───────────────────────────────────────────────────────────────────

function setSessionCookie(res: Response, token: string): void {
  res.cookie(env.SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: env.SESSION_ABSOLUTE_TTL_DAYS * 24 * 60 * 60 * 1000,
    ...(env.COOKIE_DOMAIN && { domain: env.COOKIE_DOMAIN }),
  });
}

// ── Schemas ───────────────────────────────────────────────────────────────────

const registerSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().email().max(254),
  password: z.string().min(8).max(128),
});

const loginSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(1).max(128),
});

// ── GET /api/v1/public/publisher ──────────────────────────────────────────────

publicRouter.get('/publisher', async (_req: Request, res: Response) => {
  const publisherId = res.locals.resolvedPublisherId as string | undefined;

  if (!publisherId) {
    res.status(404).json({ error: { message: 'No publisher found for this domain', code: 'NOT_FOUND' } });
    return;
  }

  const publisher = await prisma.publisher.findUnique({
    where: { id: publisherId },
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      website: true,
      description: true,
      customDomain: true,
    },
  });

  if (!publisher || publisher.status === 'SUSPENDED') {
    res.status(404).json({ error: { message: 'Publisher not found or suspended', code: 'NOT_FOUND' } });
    return;
  }

  res.json({ publisher });
});

// ── POST /api/v1/public/register ──────────────────────────────────────────────

publicRouter.post('/register', authRateLimiter, async (req: Request, res: Response) => {
  const publisherId = res.locals.resolvedPublisherId as string | undefined;
  if (!publisherId) {
    res.status(400).json({ error: { message: 'No publisher associated with this domain', code: 'BAD_REQUEST' } });
    return;
  }

  const body = registerSchema.parse(req.body);
  const user = await registerCustomer({ publisherId, ...body });
  res.status(201).json({ user });
});

// ── POST /api/v1/public/verify-email ─────────────────────────────────────────

publicRouter.post('/verify-email', authRateLimiter, async (req: Request, res: Response) => {
  const publisherId = res.locals.resolvedPublisherId as string | undefined;
  if (!publisherId) {
    res.status(400).json({ error: { message: 'No publisher associated with this domain', code: 'BAD_REQUEST' } });
    return;
  }

  const body = z.object({
    email: z.string().email(),
    otp: z.string().length(6),
  }).parse(req.body);

  const user = await verifyCustomerEmail({ publisherId, ...body });
  res.json({ user });
});

// ── POST /api/v1/public/login ─────────────────────────────────────────────────

publicRouter.post('/login', authRateLimiter, async (req: Request, res: Response) => {
  const publisherId = res.locals.resolvedPublisherId as string | undefined;
  if (!publisherId) {
    res.status(400).json({ error: { message: 'No publisher associated with this domain', code: 'BAD_REQUEST' } });
    return;
  }

  const body = loginSchema.parse(req.body);
  const { user, session } = await loginCustomer({
    publisherId,
    email: body.email,
    password: body.password,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  });

  setSessionCookie(res, session.token);
  res.json({ user });
});
