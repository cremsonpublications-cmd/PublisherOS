import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

// Singleton Prisma client
const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'event', level: 'error' },
    { emit: 'event', level: 'warn' },
  ],
});

// Forward Prisma logs to Pino (never log query params — may contain sensitive data)
prisma.$on('error', (e) => {
  logger.error({ source: 'prisma', message: e.message }, 'Prisma error');
});
prisma.$on('warn', (e) => {
  logger.warn({ source: 'prisma', message: e.message }, 'Prisma warning');
});

export { prisma };

/**
 * Verify PostgreSQL connectivity. Throws if the database is unreachable.
 */
export async function checkDb(): Promise<void> {
  await prisma.$queryRaw`SELECT 1`;
}
