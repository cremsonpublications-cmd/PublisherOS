import express from 'express';
import 'express-async-errors';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';
import { env } from './env';
import { logger } from './logger';
import { requestIdMiddleware } from './middleware/requestId';
import { errorHandler } from './middleware/errorHandler';
import { csrfProtection } from './middleware/csrf';
import { domainResolutionMiddleware } from './middleware/domainResolution';
import { apiRouter } from './routes';
import { openApiSpec } from './openapi';

export function createApp(): express.Application {
  const app = express();

  // ── Security headers ──────────────────────────────────────────────────────
  app.use(helmet());

  // ── CORS ──────────────────────────────────────────────────────────────────
  const allowedOrigins = env.CORS_ORIGINS.split(',').map((o) => o.trim());
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (e.g. curl, Postman in dev)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        callback(new Error(`Origin ${origin} not allowed by CORS policy`));
      },
      credentials: true,
    }),
  );

  // ── Request size limits ───────────────────────────────────────────────────
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // ── Cookie parsing ────────────────────────────────────────────────────────
  app.use(cookieParser());

  // ── Domain resolution (Host → Publisher mapping) ─────────────────────────
  app.use(domainResolutionMiddleware);

  // ── CSRF protection (Origin header validation) ────────────────────────────
  app.use('/api/v1', csrfProtection);

  // ── Correlation ID ────────────────────────────────────────────────────────
  app.use(requestIdMiddleware);

  // ── Structured request logging ────────────────────────────────────────────
  app.use(
    pinoHttp({
      logger,
      customProps: (req) => ({
        requestId: req.headers['x-request-id'],
      }),
      // Don't log health/ready checks to avoid noise
      autoLogging: {
        ignore: (req) =>
          req.url === '/api/v1/health' || req.url === '/api/v1/ready',
      },
    }),
  );

  // ── OpenAPI spec (development only) ──────────────────────────────────────
  if (env.NODE_ENV === 'development') {
    app.get('/api/v1/openapi.json', (_req, res) => {
      res.json(openApiSpec);
    });

    // Scalar API reference UI
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { apiReference } = require('@scalar/express-api-reference') as {
      apiReference: (opts: Record<string, unknown>) => express.RequestHandler;
    };
    app.use(
      '/api/v1/docs',
      apiReference({
        spec: { url: '/api/v1/openapi.json' },
      }),
    );
  }

  // ── API routes ────────────────────────────────────────────────────────────
  app.use('/api/v1', apiRouter);

  // ── 404 handler ───────────────────────────────────────────────────────────
  app.use((_req, res) => {
    res.status(404).json({ error: { message: 'Not found', code: 'NOT_FOUND' } });
  });

  // ── Centralized error handler ─────────────────────────────────────────────
  app.use(errorHandler);

  return app;
}
