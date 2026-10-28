import pino from 'pino';
import { env } from './env';

export const logger = pino({
  level: env.LOG_LEVEL,
  ...(env.NODE_ENV === 'development'
    ? {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        },
      }
    : {
        // Production: structured JSON — forward to log aggregator
        formatters: {
          level(label: string) {
            return { level: label };
          },
        },
      }),
  // Redact fields that may contain secrets — defensive belt-and-suspenders
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'req.body.password',
      'req.body.token',
      'req.body.secret',
    ],
    censor: '[REDACTED]',
  },
});
