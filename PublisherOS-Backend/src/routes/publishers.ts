/**
 * Publisher routes — /api/v1/publishers
 *
 * All routes require authentication (requireAuth).
 * Mutation routes require PUBLISHER_OWNER role (requirePublisherOwner).
 */

import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/authenticate';
import { requirePublisher, requirePublisherOwner } from '../middleware/requireRole';
import {
  getPublisher,
  updatePublisher,
  getStaff,
  createStaff,
  removeStaff,
  setCustomDomain,
} from '../services/publisherService';

export const publishersRouter = Router();

// ── Schemas ───────────────────────────────────────────────────────────────────

const updatePublisherSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  website: z.string().url().max(255).nullable().optional(),
  description: z.string().trim().max(500).nullable().optional(),
  logoUrl: z.string().url().max(2048).nullable().optional(),
  brandColor: z
    .string()
    .trim()
    .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Must be a valid hex colour, e.g. #FF5733')
    .nullable()
    .optional(),
  contactEmail: z.string().email().max(254).nullable().optional(),
  contactPhone: z.string().trim().max(30).nullable().optional(),
});

const createStaffSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().email().max(254),
  password: z.string().min(8).max(128),
});

const customDomainSchema = z.object({
  // Basic domain validation — no scheme, no path, no port
  domain: z
    .string()
    .trim()
    .min(4)
    .max(253)
    .regex(
      /^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i,
      'Must be a valid domain name (e.g. apublisher.com)',
    ),
});

// ── GET /api/v1/publishers/me ─────────────────────────────────────────────────

publishersRouter.get('/me', requireAuth, requirePublisher(), async (_req: Request, res: Response) => {
  const { user } = res.locals;
  const publisher = await getPublisher(user.publisherId!);
  res.json({ publisher });
});

// ── PATCH /api/v1/publishers/me ───────────────────────────────────────────────

publishersRouter.patch(
  '/me',
  requireAuth,
  requirePublisherOwner(),
  async (req: Request, res: Response) => {
    const { user } = res.locals;
    const body = updatePublisherSchema.parse(req.body);
    const publisher = await updatePublisher(user.publisherId!, body);
    res.json({ publisher });
  },
);

// ── GET /api/v1/publishers/me/staff ───────────────────────────────────────────

publishersRouter.get(
  '/me/staff',
  requireAuth,
  requirePublisherOwner(),
  async (_req: Request, res: Response) => {
    const { user } = res.locals;
    const staff = await getStaff(user.publisherId!);
    res.json({ staff });
  },
);

// ── POST /api/v1/publishers/me/staff ─────────────────────────────────────────

publishersRouter.post(
  '/me/staff',
  requireAuth,
  requirePublisherOwner(),
  async (req: Request, res: Response) => {
    const { user } = res.locals;
    const body = createStaffSchema.parse(req.body);
    const staff = await createStaff(user.publisherId!, body);
    res.status(201).json({ staff });
  },
);

// ── DELETE /api/v1/publishers/me/staff/:userId ────────────────────────────────

publishersRouter.delete(
  '/me/staff/:userId',
  requireAuth,
  requirePublisherOwner(),
  async (req: Request, res: Response) => {
    const { user } = res.locals;
    await removeStaff(user.publisherId!, String(req.params.userId));
    res.json({ message: 'Staff member removed.' });
  },
);

// ── GET /api/v1/publishers/me/customers ───────────────────────────────────────

publishersRouter.get(
  '/me/customers',
  requireAuth,
  requirePublisher(),
  async (_req: Request, res: Response) => {
    const { user } = res.locals;
    const customers = await import('../db.js').then(({ prisma }) =>
      prisma.user.findMany({
        where: { publisherId: user.publisherId!, publisherRole: 'PUBLISHER_CUSTOMER' },
        select: { id: true, name: true, email: true, status: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      }),
    );
    res.json({ customers });
  },
);

// ── PUT /api/v1/publishers/me/custom-domain ───────────────────────────────────
// Set or update the publisher's custom domain. Clears verification status.

publishersRouter.put(
  '/me/custom-domain',
  requireAuth,
  requirePublisherOwner(),
  async (req: Request, res: Response) => {
    const { user } = res.locals;
    const { domain } = customDomainSchema.parse(req.body);
    const publisher = await setCustomDomain(user.publisherId!, domain);
    res.json({ publisher });
  },
);

// ── DELETE /api/v1/publishers/me/custom-domain ────────────────────────────────
// Remove the publisher's custom domain.

publishersRouter.delete(
  '/me/custom-domain',
  requireAuth,
  requirePublisherOwner(),
  async (_req: Request, res: Response) => {
    const { user } = res.locals;
    const publisher = await setCustomDomain(user.publisherId!, null);
    res.json({ publisher });
  },
);
