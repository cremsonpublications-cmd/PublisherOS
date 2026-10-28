/**
 * Public auth service — customer registration, verification, and login.
 *
 * Customers sign up via a publisher's custom domain.
 * Accounts start as PENDING_VERIFICATION; email OTP confirms them.
 *
 * Dev shortcut: when SMTP_HOST is not configured, the OTP is always "123456"
 * so you can verify without a real inbox.
 */

import argon2 from 'argon2';
import { prisma } from '../db.js';
import { createSession } from './sessionService.js';
import { sendVerificationEmail } from './emailService.js';
import { generateOtp, hashToken } from '../lib/crypto.js';
import { AuthError, ConflictError, ValidationError } from '../lib/errors.js';
import { env } from '../env.js';
import { logger } from '../logger.js';

const VERIFICATION_TTL_HOURS = 24;

// In dev (no SMTP) always use a fixed OTP so testers don't need a real inbox.
function devOrRealOtp(): string {
  return env.SMTP_HOST ? generateOtp() : '123456';
}

// ── Register ──────────────────────────────────────────────────────────────────

export async function registerCustomer(input: {
  publisherId: string;
  name: string;
  email: string;
  password: string;
}) {
  const normalizedEmail = input.email.toLowerCase().trim();

  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true },
  });
  if (existing) throw new ConflictError('An account with this email already exists');

  const passwordHash = await argon2.hash(input.password);
  const otp = devOrRealOtp();
  const tokenHash = hashToken(otp);

  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        name: input.name.trim(),
        email: normalizedEmail,
        passwordHash,
        status: 'PENDING_VERIFICATION',
        publisherId: input.publisherId,
        publisherRole: 'PUBLISHER_CUSTOMER',
      },
      select: {
        id: true, name: true, email: true, status: true,
        publisherId: true, publisherRole: true, emailVerifiedAt: true, systemRole: true,
      },
    });

    await tx.emailVerification.create({
      data: {
        userId: created.id,
        tokenHash,
        expiresAt: new Date(Date.now() + VERIFICATION_TTL_HOURS * 60 * 60 * 1000),
      },
    });

    return created;
  });

  logger.info({ userId: user.id, publisherId: input.publisherId }, 'Customer registered');

  sendVerificationEmail(user.email, user.name, otp).catch(
    (err: Error) => logger.error({ error: err.name }, 'Failed to send customer verification email'),
  );

  return user;
}

// ── Verify email ──────────────────────────────────────────────────────────────

export async function verifyCustomerEmail(input: {
  publisherId: string;
  email: string;
  otp: string;
}) {
  const normalizedEmail = input.email.toLowerCase().trim();
  const tokenHash = hashToken(input.otp.trim());

  const user = await prisma.user.findFirst({
    where: {
      email: normalizedEmail,
      publisherId: input.publisherId,
      publisherRole: 'PUBLISHER_CUSTOMER',
      status: 'PENDING_VERIFICATION',
    },
    select: { id: true, name: true, email: true, status: true, publisherId: true, publisherRole: true, emailVerifiedAt: true, systemRole: true },
  });

  if (!user) throw new ValidationError('Invalid or expired verification code');

  const verification = await prisma.emailVerification.findFirst({
    where: { userId: user.id, tokenHash, usedAt: null },
  });

  if (!verification || verification.expiresAt < new Date()) {
    throw new ValidationError('Invalid or expired verification code');
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { status: 'ACTIVE', emailVerifiedAt: new Date() },
    }),
    prisma.emailVerification.update({
      where: { id: verification.id },
      data: { usedAt: new Date() },
    }),
  ]);

  return { ...user, status: 'ACTIVE' as const, emailVerifiedAt: new Date() };
}

// ── Login ─────────────────────────────────────────────────────────────────────

export async function loginCustomer(input: {
  publisherId: string;
  email: string;
  password: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  const normalizedEmail = input.email.toLowerCase().trim();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: {
      id: true, name: true, email: true, passwordHash: true,
      status: true, publisherId: true, publisherRole: true,
      emailVerifiedAt: true, systemRole: true,
    },
  });

  const invalid =
    !user ||
    user.publisherId !== input.publisherId ||
    user.publisherRole !== 'PUBLISHER_CUSTOMER';

  if (invalid) throw new AuthError('Invalid email or password');

  if (user.status === 'PENDING_VERIFICATION') {
    throw new AuthError('Please verify your email before signing in');
  }
  if (user.status === 'SUSPENDED') throw new AuthError('Invalid email or password');

  const valid = await argon2.verify(user.passwordHash, input.password);
  if (!valid) throw new AuthError('Invalid email or password');

  const session = await createSession(user.id, {
    ipAddress: input.ipAddress,
    userAgent: input.userAgent,
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash: _ph, ...safeUser } = user;
  return { user: safeUser, session };
}
