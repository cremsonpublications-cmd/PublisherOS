import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(8000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  REDIS_URL: z.string().min(1, 'REDIS_URL is required'),
  CORS_ORIGINS: z.string().default('http://localhost:5174'),
  LOG_LEVEL: z
    .enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal'])
    .default('info'),

  // ── Session ────────────────────────────────────────────────────────────────
  SESSION_COOKIE_NAME: z.string().default('pos_session'),
  SESSION_IDLE_TTL_DAYS: z.coerce.number().int().positive().default(30),
  SESSION_ABSOLUTE_TTL_DAYS: z.coerce.number().int().positive().default(90),
  COOKIE_DOMAIN: z.string().default(''),

  // ── Application ────────────────────────────────────────────────────────────
  APP_BASE_URL: z.string().default('http://localhost:5174'),

  // ── Email ──────────────────────────────────────────────────────────────────
  SMTP_HOST: z.string().default(''),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_SECURE: z
    .string()
    .transform((v) => v === 'true')
    .default('false'),
  SMTP_USER: z.string().default(''),
  SMTP_PASS: z.string().default(''),
  SMTP_FROM: z.string().default('PublisherOS <noreply@publisheros.dev>'),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  // Safe to print field names but never values (they may contain credentials)
  const missing = result.error.issues.map((i) => i.path.join('.')).join(', ');
  console.error(`[env] Invalid or missing environment variables: ${missing}`);
  process.exit(1);
}

export const env = result.data;
