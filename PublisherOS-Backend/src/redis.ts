import Redis from 'ioredis';
import { env } from './env';
import { logger } from './logger';

export const redis = new Redis(env.REDIS_URL, {
  // Don't crash the process on connection failure at startup — let the
  // readiness endpoint report the real status.
  lazyConnect: true,
  maxRetriesPerRequest: 1,
  enableReadyCheck: true,
});

redis.on('connect', () => logger.info('Redis connected'));
redis.on('ready', () => logger.info('Redis ready'));
redis.on('error', (err: Error) => {
  // Log the error class but not the connection string (may contain credentials)
  logger.error({ source: 'redis', error: err.name }, 'Redis connection error');
});
redis.on('close', () => logger.warn('Redis connection closed'));

/**
 * Verify Redis connectivity. Throws if Redis is unreachable.
 */
export async function checkRedis(): Promise<void> {
  const pong = await redis.ping();
  if (pong !== 'PONG') {
    throw new Error(`Unexpected Redis PING response: ${pong}`);
  }
}
