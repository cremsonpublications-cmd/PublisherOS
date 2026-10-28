/**
 * Rate limiting middleware for sensitive auth endpoints.
 *
 * Uses the in-process memory store (sufficient for a single API instance).
 * For multi-instance deployments, replace with a Redis store.
 *
 * Applies to: login, register, forgot-password, reset-password, verify-email.
 */

import rateLimit from 'express-rate-limit';

function jsonRateLimitHandler(
  _req: import('express').Request,
  res: import('express').Response,
): void {
  res.status(429).json({
    error: {
      message: 'Too many requests. Please wait and try again.',
      code: 'RATE_LIMITED',
    },
  });
}

/** 10 attempts per 15 minutes per IP — for login and register. */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: jsonRateLimitHandler,
  keyGenerator: (req) => (req.ip ?? 'unknown').replace(/^::ffff:/, ''),
  skip: () => process.env.NODE_ENV === 'test',
});

/** 5 attempts per 60 minutes per IP — for password-reset and verification resend. */
export const sensitiveAuthRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: jsonRateLimitHandler,
  keyGenerator: (req) => (req.ip ?? 'unknown').replace(/^::ffff:/, ''),
  skip: () => process.env.NODE_ENV === 'test',
});
