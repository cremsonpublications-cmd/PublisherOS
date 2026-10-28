import { createApp } from './app';
import { env } from './env';
import { logger } from './logger';
import { prisma } from './db';
import { redis } from './redis';

async function main(): Promise<void> {
  const app = createApp();

  // Connect to Redis eagerly so the connection is established before requests
  await redis.connect().catch((err: Error) => {
    logger.warn({ error: err.name }, 'Redis initial connect failed — will retry');
  });

  const server = app.listen(env.PORT, () => {
    logger.info(
      {
        port: env.PORT,
        env: env.NODE_ENV,
        docs:
          env.NODE_ENV === 'development'
            ? `http://localhost:${env.PORT}/api/v1/docs`
            : undefined,
      },
      'Server started',
    );
  });

  // ── Graceful shutdown ──────────────────────────────────────────────────────
  async function shutdown(signal: string): Promise<void> {
    logger.info({ signal }, 'Shutdown signal received');

    server.close(async () => {
      logger.info('HTTP server closed');

      await Promise.allSettled([
        prisma.$disconnect().then(() => logger.info('Prisma disconnected')),
        redis.quit().then(() => logger.info('Redis disconnected')),
      ]);

      logger.info('Graceful shutdown complete');
      process.exit(0);
    });

    // Force-exit if graceful shutdown takes too long
    setTimeout(() => {
      logger.error('Forced exit after shutdown timeout');
      process.exit(1);
    }, 10_000).unref();
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // Unhandled rejections — log and exit so the process doesn't continue in
  // an unknown state
  process.on('unhandledRejection', (reason) => {
    logger.error({ reason }, 'Unhandled promise rejection');
    process.exit(1);
  });
}

main().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
