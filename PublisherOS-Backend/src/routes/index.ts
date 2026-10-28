import { Router } from 'express';
import { healthRouter } from './health';
import { authRouter } from './auth';
import { publishersRouter } from './publishers';
import { superAdminRouter } from './super-admin';
import { publicRouter } from './public';

export const apiRouter = Router();

// Health / readiness
apiRouter.use('/', healthRouter);

// Public (no auth) — domain-resolved publisher info for custom domain storefronts
apiRouter.use('/public', publicRouter);

// Authentication
apiRouter.use('/auth', authRouter);

// Publisher management
apiRouter.use('/publishers', publishersRouter);

// Super-admin platform management
apiRouter.use('/super-admin', superAdminRouter);
