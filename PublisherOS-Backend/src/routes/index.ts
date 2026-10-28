import { Router } from 'express';
import { healthRouter } from './health';
import { authRouter } from './auth';
import { publishersRouter } from './publishers';
import { superAdminRouter } from './super-admin';

export const apiRouter = Router();

// Health / readiness
apiRouter.use('/', healthRouter);

// Authentication
apiRouter.use('/auth', authRouter);

// Publisher management
apiRouter.use('/publishers', publishersRouter);

// Super-admin platform management
apiRouter.use('/super-admin', superAdminRouter);
