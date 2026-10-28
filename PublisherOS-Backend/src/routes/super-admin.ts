/**
 * Super-admin routes — /api/v1/super-admin
 *
 * All routes require authentication + SUPER_ADMIN system role.
 */

import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/authenticate';
import { requireSuperAdmin } from '../middleware/requireRole';
import {
  getStats,
  listPublishers,
  getPublisherDetails,
  setPublisherStatus,
  listUsers,
  listAuditEvents,
} from '../services/superAdminService';

export const superAdminRouter = Router();

// Apply auth + super admin guard to all routes
superAdminRouter.use(requireAuth, requireSuperAdmin());

// ── Schemas ───────────────────────────────────────────────────────────────────

const pageSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

const setStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED']),
});

// ── GET /api/v1/super-admin/stats ─────────────────────────────────────────────

superAdminRouter.get('/stats', async (_req: Request, res: Response) => {
  const stats = await getStats();
  res.json({ stats });
});

// ── GET /api/v1/super-admin/publishers ───────────────────────────────────────

superAdminRouter.get('/publishers', async (req: Request, res: Response) => {
  const { page, pageSize } = pageSchema.parse(req.query);
  const result = await listPublishers(page, pageSize);
  res.json(result);
});

// ── GET /api/v1/super-admin/publishers/:id ───────────────────────────────────

superAdminRouter.get('/publishers/:id', async (req: Request, res: Response) => {
  const publisher = await getPublisherDetails(String(req.params.id));
  res.json({ publisher });
});

// ── PATCH /api/v1/super-admin/publishers/:id/status ──────────────────────────

superAdminRouter.patch(
  '/publishers/:id/status',
  async (req: Request, res: Response) => {
    const body = setStatusSchema.parse(req.body);
    const publisher = await setPublisherStatus(String(req.params.id), body.status);
    res.json({ publisher });
  },
);

// ── GET /api/v1/super-admin/users ────────────────────────────────────────────

superAdminRouter.get('/users', async (req: Request, res: Response) => {
  const { page, pageSize } = pageSchema.parse(req.query);
  const result = await listUsers(page, pageSize);
  res.json(result);
});

// ── GET /api/v1/super-admin/audit-events ─────────────────────────────────────

superAdminRouter.get('/audit-events', async (req: Request, res: Response) => {
  const { page, pageSize } = pageSchema.parse(req.query);
  const result = await listAuditEvents(page, pageSize);
  res.json(result);
});
