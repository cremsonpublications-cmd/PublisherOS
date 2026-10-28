import { Router } from 'express';
import { checkDb } from '../db';
import { checkRedis } from '../redis';

export const healthRouter = Router();

/**
 * GET /api/v1/health
 * Lightweight liveness check — confirms the process is running.
 * Does NOT check downstream dependencies.
 */
healthRouter.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET /api/v1/ready
 * Readiness check — verifies PostgreSQL and Redis are reachable.
 * Returns 503 if any dependency is unavailable.
 */
healthRouter.get('/ready', async (_req, res) => {
  const checks = { postgres: false, redis: false };

  await Promise.allSettled([
    checkDb().then(() => {
      checks.postgres = true;
    }),
    checkRedis().then(() => {
      checks.redis = true;
    }),
  ]);

  const allReady = checks.postgres && checks.redis;

  res.status(allReady ? 200 : 503).json({
    status: allReady ? 'ready' : 'not_ready',
    checks,
  });
});
