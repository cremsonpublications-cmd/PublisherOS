import { createHash, randomBytes, randomInt } from 'node:crypto';

/**
 * Generate a cryptographically random URL-safe token.
 * Returns base64url-encoded bytes (no padding, no +/).
 * Default 32 bytes → 43-char string.
 */
export function generateSecureToken(byteLength = 32): string {
  return randomBytes(byteLength).toString('base64url');
}

/**
 * Hash a token with SHA-256 for safe database storage.
 * The raw token is sent to the client; only its hash is persisted.
 */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Generate a cryptographically secure 6-digit OTP.
 * Returns a zero-padded string e.g. "042891".
 */
export function generateOtp(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, '0');
}
