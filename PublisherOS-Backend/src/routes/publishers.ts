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
} from '../services/publisherService';

export const publishersRouter = Router();

// ── Schemas ───────────────────────────────────────────────────────────────────

const updatePublisherSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  website: z.string().url().max(255).nullable().optional(),
  description: z.string().trim().max(500).nullable().optional(),
});

const createStaffSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().email().max(254),
  password: z.string().min(8).max(128),
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
