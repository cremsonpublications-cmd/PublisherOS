/**
 * Domain resolution middleware.
 *
 * Reads the incoming Host header and resolves it to a Publisher via
 * the customDomain field. Attaches the resolved publisherId to res.locals
 * so that downstream routes can use it without trusting any client-supplied value.
 *
 * Also defines which hosts are considered "admin" hosts (i.e. publisheros.com
 * or localhost in development). Super-admin routes should only be accessible
 * from admin hosts.
 */

import { type Request, type Response, type NextFunction } from 'express';
import { prisma } from '../db.js';
import { env } from '../env.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Strip port from a host string, e.g. "localhost:8000" → "localhost" */
function stripPort(host: string): string {
  const idx = host.lastIndexOf(':');
  if (idx === -1) return host;
  // IPv6 addresses contain colons — only strip if the part after : is numeric
  const maybePort = host.slice(idx + 1);
  return /^\d+$/.test(maybePort) ? host.slice(0, idx) : host;
}

/**
 * Return true if the host is an "admin" host.
 * In development, localhost and 127.0.0.1 are always treated as admin hosts.
 * In production, only ADMIN_DOMAIN (defaults to publisheros.com) is admin.
 */
export function isAdminHost(host: string): boolean {
  const h = stripPort(host).toLowerCase();

  if (env.NODE_ENV !== 'production') {
    return h === 'localhost' || h === '127.0.0.1';
  }

  const adminDomain = env.ADMIN_DOMAIN.toLowerCase();
  return h === adminDomain || h === `www.${adminDomain}`;
}

// ── Middleware ────────────────────────────────────────────────────────────────

/**
 * Resolves an incoming request's Host to a Publisher.
 *
 * - Admin hosts: sets res.locals.isAdminHost = true, no publisherId attached.
 * - Known custom domains: sets res.locals.resolvedPublisherId to the matching publisher.
 * - Unknown non-admin hosts: continues without resolvedPublisherId (individual
 *   route handlers decide whether to reject).
 *
 * This middleware never blocks requests — it only enriches res.locals.
 */
export async function domainResolutionMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  // Prefer explicit ?domain= query param (sent by frontend public API calls),
  // then X-Forwarded-Host (set by reverse proxies), then fall back to req.hostname.
  const rawHost =
    (req.query['domain'] as string | undefined) ??
    (req.headers['x-forwarded-host'] as string | undefined) ??
    req.hostname ??
    '';
  const host = stripPort(rawHost);

  res.locals.requestHost = host;
  res.locals.isAdminHost = isAdminHost(host);

  if (res.locals.isAdminHost) {
    return next();
  }

  // Attempt to resolve the host to a Publisher via customDomain
  if (host) {
    const publisher = await prisma.publisher.findUnique({
      where: { customDomain: host },
      select: { id: true, status: true },
    });

    if (publisher) {
      res.locals.resolvedPublisherId = publisher.id;
      res.locals.resolvedPublisherStatus = publisher.status;
    }
  }

  next();
}

/**
 * Guard middleware: blocks super-admin routes when accessed from a non-admin host
 * in production. In development all hosts are allowed through.
 */
export function requireAdminHost() {
  return (_req: Request, res: Response, next: NextFunction): void => {
    if (env.NODE_ENV !== 'production') {
      return next();
    }
    if (!res.locals.isAdminHost) {
      res.status(403).json({ error: { message: 'Forbidden', code: 'FORBIDDEN' } });
      return;
    }
    next();
  };
}
