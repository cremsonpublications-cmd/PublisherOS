/**
 * Session management service.
 *
 * - Generates a cryptographically random opaque session token.
 * - Stores only the SHA-256 hash in the database.
 * - Validates sessions by hashing the incoming token and looking up the hash.
 * - Applies both idle and absolute expiry.
 * - Revokes sessions on logout or security events.
 */

import { type Session } from '@prisma/client';
import { prisma } from '../db';
import { generateSecureToken, hashToken } from '../lib/crypto';
import { env } from '../env';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function idleExpiryMs(): number {
  return env.SESSION_IDLE_TTL_DAYS * MS_PER_DAY;
}

function absoluteExpiryMs(): number {
  return env.SESSION_ABSOLUTE_TTL_DAYS * MS_PER_DAY;
}

/**
 * Create a new session for a user.
 * Returns the raw token (to set in the cookie) and the session record.
 * The raw token is not stored — only its hash.
 */
export async function createSession(
  userId: string,
  meta: { ipAddress?: string; userAgent?: string },
): Promise<{ token: string; session: Session }> {
  const token = generateSecureToken(32);
  const tokenHash = hashToken(token);

  const now = Date.now();
  const absoluteExpiry = new Date(now + absoluteExpiryMs());

  const session = await prisma.session.create({
    data: {
      userId,
      tokenHash,
      expiresAt: absoluteExpiry,
      lastActiveAt: new Date(),
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    },
  });

  return { token, session };
}

export interface ValidatedSession {
  session: Session;
  userId: string;
}

/**
 * Validate an incoming session token.
 * Returns the session and userId if valid, or null if expired/revoked/not found.
 * Updates lastActiveAt on a valid session (sliding idle window).
 */
export async function validateSession(
  token: string,
): Promise<ValidatedSession | null> {
  const tokenHash = hashToken(token);

  const session = await prisma.session.findUnique({
    where: { tokenHash },
  });

  if (!session) return null;

  const now = new Date();

  // Check revocation
  if (session.revokedAt !== null) return null;

  // Check absolute expiry
  if (session.expiresAt <= now) return null;

  // Check idle expiry (time since last activity)
  const idleExpiry = new Date(session.lastActiveAt.getTime() + idleExpiryMs());
  if (idleExpiry <= now) return null;

  // Refresh lastActiveAt (sliding window) — best-effort, don't fail on error
  await prisma.session.update({
    where: { id: session.id },
    data: { lastActiveAt: now },
  }).catch(() => undefined);

  return { session, userId: session.userId };
}

/**
 * Revoke a specific session by its raw token.
 */
export async function revokeSessionByToken(token: string): Promise<void> {
  const tokenHash = hashToken(token);
  await prisma.session.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

/**
 * Revoke all sessions for a user — used on password reset and account security events.
 */
export async function revokeAllUserSessions(userId: string): Promise<void> {
  await prisma.session.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}
