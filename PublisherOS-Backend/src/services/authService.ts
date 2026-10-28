/**
 * Authentication service.
 *
 * Encapsulates all auth business logic:
 * - Publisher registration (publisher + PUBLISHER_OWNER user in a transaction)
 * - Invitation acceptance (PUBLISHER_STAFF user creation)
 * - Login (generic error responses to prevent account enumeration)
 * - Password reset request and completion
 * - Email verification
 *
 * Security properties:
 * - Passwords hashed with argon2id (default config: m=65536, t=3, p=4)
 * - Verification and reset tokens: random bytes → SHA-256 hash stored
 * - Forgot-password always returns success (prevents email enumeration)
 * - Login uses generic "Invalid credentials" message
 * - Revokes all sessions on password reset
 * - SUPER_ADMIN cannot be created via public registration
 */

import argon2 from 'argon2';
import { prisma } from '../db';
import { generateSecureToken, generateOtp, hashToken } from '../lib/crypto';
import { slugify } from '../lib/slug';
import { createSession } from './sessionService';
import { revokeAllUserSessions } from './sessionService';
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
} from './emailService';
import { AuthError, ConflictError, ValidationError } from '../lib/errors';
import { logger } from '../logger';
import type { User } from '@prisma/client';

const EMAIL_VERIFICATION_TTL_HOURS = 24;
const PASSWORD_RESET_TTL_HOURS = 1;

// ── Safe user shape (never includes passwordHash) ─────────────────────────────

export type SafeUser = Omit<User, 'passwordHash'>;

function toSafeUser(user: User): SafeUser {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash: _ph, ...safe } = user;
  return safe;
}

// ── Publisher Registration ────────────────────────────────────────────────────

export async function registerPublisher(input: {
  publisherName: string;
  name: string;
  email: string;
  password: string;
}): Promise<{ user: SafeUser }> {
  const normalizedEmail = input.email.toLowerCase().trim();

  // Check for existing email
  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true },
  });

  if (existing) {
    throw new ConflictError('An account with this email already exists');
  }

  const passwordHash = await argon2.hash(input.password);

  const slug = slugify(input.publisherName);
  if (!slug) {
    throw new ValidationError('Publisher name must contain alphanumeric characters');
  }

  // Check slug uniqueness — try to append a suffix if taken
  const existingSlug = await prisma.publisher.findUnique({
    where: { slug },
    select: { id: true },
  });
  const finalSlug = existingSlug ? `${slug}-${Date.now().toString(36)}` : slug;

  const otp = generateOtp();
  const verificationTokenHash = hashToken(otp);

  // Create publisher + user + verification token atomically
  const user = await prisma.$transaction(async (tx) => {
    const publisher = await tx.publisher.create({
      data: {
        name: input.publisherName.trim(),
        slug: finalSlug,
      },
    });

    const created = await tx.user.create({
      data: {
        name: input.name.trim(),
        email: normalizedEmail,
        passwordHash,
        status: 'PENDING_VERIFICATION',
        publisherId: publisher.id,
        publisherRole: 'PUBLISHER_OWNER',
      },
    });

    await tx.emailVerification.create({
      data: {
        userId: created.id,
        tokenHash: verificationTokenHash,
        expiresAt: new Date(
          Date.now() + EMAIL_VERIFICATION_TTL_HOURS * 60 * 60 * 1000,
        ),
      },
    });

    return created;
  });

  logger.info({ userId: user.id }, 'Publisher owner registered');

  await prisma.auditEvent.create({
    data: { userId: user.id, publisherId: user.publisherId, event: 'auth.register' },
  }).catch(() => undefined);

  // Fire-and-forget email — don't block the response
  sendVerificationEmail(user.email, user.name, otp).catch(
    (err: Error) => logger.error({ error: err.name }, 'Failed to send verification email'),
  );

  return { user: toSafeUser(user) };
}


// ── Login ─────────────────────────────────────────────────────────────────────

const GENERIC_CREDENTIALS_ERROR = 'Invalid email or password';

export async function loginUser(
  email: string,
  password: string,
  meta: { ipAddress?: string; userAgent?: string },
): Promise<{ user: SafeUser; token: string }> {
  const normalizedEmail = email.toLowerCase().trim();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) {
    // Run argon2 to prevent timing-based email enumeration
    await argon2.hash(password);
    await prisma.auditEvent.create({
      data: {
        event: 'auth.login_failure',
        metadata: { reason: 'user_not_found' },
        ipAddress: meta.ipAddress,
      },
    }).catch(() => undefined);
    throw new AuthError(GENERIC_CREDENTIALS_ERROR);
  }

  const passwordValid = await argon2.verify(user.passwordHash, password);

  if (!passwordValid) {
    await prisma.auditEvent.create({
      data: {
        userId: user.id,
        event: 'auth.login_failure',
        metadata: { reason: 'wrong_password' },
        ipAddress: meta.ipAddress,
      },
    }).catch(() => undefined);
    throw new AuthError(GENERIC_CREDENTIALS_ERROR);
  }

  if (user.status === 'SUSPENDED') {
    throw new AuthError('This account has been suspended');
  }

  const { token } = await createSession(user.id, meta);

  await prisma.auditEvent.create({
    data: {
      userId: user.id,
      publisherId: user.publisherId,
      event: 'auth.login_success',
      ipAddress: meta.ipAddress,
    },
  }).catch(() => undefined);

  logger.info({ userId: user.id }, 'User logged in');
  return { user: toSafeUser(user), token };
}

// ── Email verification ────────────────────────────────────────────────────────

export async function verifyEmail(otp: string, email?: string): Promise<SafeUser> {
  // Dev bypass — "123456" verifies the most recent unverified user with that email
  if (process.env.NODE_ENV === 'development' && otp === '123456') {
    if (!email) throw new ValidationError('Email is required for dev OTP bypass');
    const user = await prisma.user.update({
      where: { email: email.toLowerCase().trim() },
      data: { emailVerifiedAt: new Date(), status: 'ACTIVE' },
    });
    return toSafeUser(user);
  }

  const tokenHash = hashToken(otp);

  const record = await prisma.emailVerification.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!record || record.usedAt || record.expiresAt <= new Date()) {
    throw new ValidationError('OTP is invalid or has expired');
  }

  const user = await prisma.$transaction(async (tx) => {
    await tx.emailVerification.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    });

    return tx.user.update({
      where: { id: record.userId },
      data: {
        emailVerifiedAt: new Date(),
        status: 'ACTIVE',
      },
    });
  });

  await prisma.auditEvent.create({
    data: { userId: user.id, event: 'auth.email_verified' },
  }).catch(() => undefined);

  return toSafeUser(user);
}

export async function resendVerification(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return;

  if (user.emailVerifiedAt) return; // already verified

  // Invalidate any existing tokens for this user
  await prisma.emailVerification.updateMany({
    where: { userId, usedAt: null },
    data: { usedAt: new Date() },
  });

  const otp = generateOtp();
  const tokenHash = hashToken(otp);

  await prisma.emailVerification.create({
    data: {
      userId,
      tokenHash,
      expiresAt: new Date(
        Date.now() + EMAIL_VERIFICATION_TTL_HOURS * 60 * 60 * 1000,
      ),
    },
  });

  sendVerificationEmail(user.email, user.name, otp).catch(
    (err: Error) => logger.error({ error: err.name }, 'Failed to send verification email'),
  );
}

// ── Password reset ────────────────────────────────────────────────────────────

/**
 * Initiate password reset.
 * Always returns success to prevent email enumeration — even if the email
 * is not found, the response is identical.
 */
export async function forgotPassword(email: string): Promise<void> {
  const normalizedEmail = email.toLowerCase().trim();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, name: true, email: true, status: true },
  });

  if (!user || user.status === 'SUSPENDED') {
    // Silently succeed — no information leaked
    return;
  }

  // Invalidate any existing reset tokens
  await prisma.passwordReset.updateMany({
    where: { userId: user.id, usedAt: null },
    data: { usedAt: new Date() },
  });

  const resetToken = generateSecureToken(32);
  const tokenHash = hashToken(resetToken);

  await prisma.passwordReset.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt: new Date(
        Date.now() + PASSWORD_RESET_TTL_HOURS * 60 * 60 * 1000,
      ),
    },
  });

  sendPasswordResetEmail(user.email, user.name, resetToken).catch(
    (err: Error) => logger.error({ error: err.name }, 'Failed to send password reset email'),
  );

  await prisma.auditEvent.create({
    data: { userId: user.id, event: 'auth.password_reset_requested' },
  }).catch(() => undefined);
}

export async function resetPassword(
  token: string,
  newPassword: string,
): Promise<void> {
  const tokenHash = hashToken(token);

  const record = await prisma.passwordReset.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!record || record.usedAt || record.expiresAt <= new Date()) {
    throw new ValidationError('Reset link is invalid or has expired');
  }

  const passwordHash = await argon2.hash(newPassword);

  await prisma.$transaction(async (tx) => {
    await tx.passwordReset.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    });

    await tx.user.update({
      where: { id: record.userId },
      data: { passwordHash },
    });
  });

  // Revoke all sessions after password change — security requirement
  await revokeAllUserSessions(record.userId);

  await prisma.auditEvent.create({
    data: { userId: record.userId, event: 'auth.password_reset_completed' },
  }).catch(() => undefined);
}
