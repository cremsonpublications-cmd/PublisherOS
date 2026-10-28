/**
 * Authentication routes — POST /api/v1/auth/*
 *
 * All responses avoid leaking sensitive information:
 * - Forgot-password always returns 200 regardless of whether the email exists.
 * - Login uses generic "Invalid email or password" on any auth failure.
 * - Verification/reset token errors are generic.
 *
 * Cookies:
 * - HttpOnly, SameSite=Lax, Secure in production.
 * - Cookie name and TTL are configurable via environment variables.
 */

import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import {
  registerPublisher,
  loginUser,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
} from '../services/authService';
import { revokeSessionByToken } from '../services/sessionService';
import { requireAuth } from '../middleware/authenticate';
import {
  authRateLimiter,
  sensitiveAuthRateLimiter,
} from '../middleware/rateLimiter';
import { prisma } from '../db';
import { env } from '../env';
import { logger } from '../logger';

export const authRouter = Router();

// ── Cookie helpers ────────────────────────────────────────────────────────────

function setSessionCookie(res: Response, token: string): void {
  const absoluteTtlMs =
    env.SESSION_ABSOLUTE_TTL_DAYS * 24 * 60 * 60 * 1000;

  res.cookie(env.SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: absoluteTtlMs,
    ...(env.COOKIE_DOMAIN && { domain: env.COOKIE_DOMAIN }),
  });
}

function clearSessionCookie(res: Response): void {
  res.clearCookie(env.SESSION_COOKIE_NAME, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    ...(env.COOKIE_DOMAIN && { domain: env.COOKIE_DOMAIN }),
  });
}

// ── Input schemas ─────────────────────────────────────────────────────────────

const registerSchema = z.object({
  publisherName: z.string().trim().min(2).max(100),
  name: z.string().trim().min(1).max(100),
  email: z.string().email().max(254),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128),
});


const loginSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(1).max(128),
});

const forgotPasswordSchema = z.object({
  email: z.string().email().max(254),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1).max(128),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128),
});

const verifyEmailSchema = z.object({
  otp: z.string().length(6).regex(/^\d{6}$/, 'OTP must be 6 digits'),
  email: z.string().email().max(254),
});

// ── Routes ────────────────────────────────────────────────────────────────────

// POST /api/v1/auth/register
authRouter.post('/register', authRateLimiter, async (req: Request, res: Response) => {
  const body = registerSchema.parse(req.body);
  const { user } = await registerPublisher(body);

  res.status(201).json({
    message: 'Registration successful. Enter the 6-digit OTP sent to your email.',
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      status: user.status,
      emailVerifiedAt: user.emailVerifiedAt,
      systemRole: user.systemRole,
      publisherRole: user.publisherRole,
      publisherId: user.publisherId,
    },
  });
});


// POST /api/v1/auth/login
authRouter.post('/login', authRateLimiter, async (req: Request, res: Response) => {
  const body = loginSchema.parse(req.body);

  const ipAddress = req.ip;
  const userAgent = req.headers['user-agent'];

  const { user, token } = await loginUser(body.email, body.password, {
    ipAddress,
    userAgent,
  });

  setSessionCookie(res, token);

  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      status: user.status,
      emailVerifiedAt: user.emailVerifiedAt,
      systemRole: user.systemRole,
      publisherRole: user.publisherRole,
      publisherId: user.publisherId,
    },
  });
});

// POST /api/v1/auth/logout
authRouter.post('/logout', requireAuth, async (_req: Request, res: Response) => {
  const token = res.locals.sessionToken;

  await revokeSessionByToken(token).catch((err: Error) =>
    logger.error({ error: err.name }, 'Error revoking session on logout'),
  );

  clearSessionCookie(res);
  res.json({ message: 'Logged out successfully' });
});

// GET /api/v1/auth/me
authRouter.get('/me', requireAuth, async (_req: Request, res: Response) => {
  const { userId } = res.locals;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      status: true,
      emailVerifiedAt: true,
      systemRole: true,
      publisherRole: true,
      publisherId: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    clearSessionCookie(res);
    res.status(401).json({ error: { message: 'Authentication required', code: 'UNAUTHORIZED' } });
    return;
  }

  res.json({ user });
});

// POST /api/v1/auth/forgot-password
authRouter.post(
  '/forgot-password',
  sensitiveAuthRateLimiter,
  async (req: Request, res: Response) => {
    const body = forgotPasswordSchema.parse(req.body);

    // Always succeeds — prevent email enumeration
    await forgotPassword(body.email);

    res.json({
      message:
        'If an account exists for that email, you will receive a password reset link.',
    });
  },
);

// POST /api/v1/auth/reset-password
authRouter.post(
  '/reset-password',
  sensitiveAuthRateLimiter,
  async (req: Request, res: Response) => {
    const body = resetPasswordSchema.parse(req.body);
    await resetPassword(body.token, body.password);

    res.json({ message: 'Password reset successfully. You can now log in.' });
  },
);

// POST /api/v1/auth/verify-email
authRouter.post('/verify-email', async (req: Request, res: Response) => {
  const body = verifyEmailSchema.parse(req.body);
  const user = await verifyEmail(body.otp, body.email);

  res.json({
    message: 'Email verified successfully.',
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      status: user.status,
      emailVerifiedAt: user.emailVerifiedAt,
    },
  });
});

// POST /api/v1/auth/resend-verification
authRouter.post(
  '/resend-verification',
  requireAuth,
  sensitiveAuthRateLimiter,
  async (_req: Request, res: Response) => {
    const { userId } = res.locals;
    await resendVerification(userId);

    res.json({ message: 'Verification email sent if your email is not yet verified.' });
  },
);
