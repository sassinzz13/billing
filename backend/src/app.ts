import fs from 'node:fs';
import path from 'node:path';
import cookieParser from 'cookie-parser';
import express, { type Express } from 'express';
import helmet from 'helmet';
import { env } from './config/env';
import { frontendDist } from './config/paths';
import { authRouter } from './features/auth/routes';
import { customerRouter } from './features/customers/routes';
import { dashboardRouter } from './features/dashboard/routes';
import { invoiceRouter } from './features/invoices/routes';
import { orderRouter } from './features/orders/routes';
import { paymentRouter } from './features/payments/routes';
import { productRouter } from './features/products/routes';
import { requireAuth } from './middleware/auth';
import { errorHandler, notFoundHandler } from './middleware/error';
import { devCors, originGuard } from './middleware/security';
import { logger } from './shared/logger';

export function createApp(): Express {
  const app = express();
  app.disable('x-powered-by');
  if (env.TRUST_PROXY > 0) app.set('trust proxy', env.TRUST_PROXY);
  app.use(
    helmet({
      // The SPA is served from the same origin; allow data: images (logo) and inline styles used by Tailwind/print.
      contentSecurityPolicy: { directives: { upgradeInsecureRequests: null, defaultSrc: ["'self'"], imgSrc: ["'self'", 'data:', 'blob:'], styleSrc: ["'self'", "'unsafe-inline'"], frameSrc: ["'self'", 'blob:'], objectSrc: ["'self'", 'blob:'] } },
    }),
  );
  app.use(devCors);
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      if (req.path.startsWith('/api')) logger.info({ method: req.method, path: req.path, status: res.statusCode, ms: Date.now() - start }, 'request');
    });
    next();
  });
  app.use(cookieParser());

  const api = express.Router();
  api.use(originGuard);
  api.use(express.json({ limit: '2mb' }));
  api.get('/health', (_req, res) => void res.json({ data: { status: 'ok' } }));
  api.use('/auth', authRouter);
  api.use(requireAuth);
  api.use('/customers', customerRouter);
  api.use('/products', productRouter);
  api.use('/orders', orderRouter);
  api.use('/invoices', invoiceRouter);
  api.use('/payments', paymentRouter);
  api.use('/dashboard', dashboardRouter);
  api.use(notFoundHandler);
  app.use('/api', api);

  // Production-like mode: serve the compiled SPA from the same server
  if (fs.existsSync(path.join(frontendDist, 'index.html'))) {
    app.use(express.static(frontendDist, { index: false, maxAge: '1h' }));
    app.get(/^(?!\/api\/).*/, (_req, res) => void res.sendFile(path.join(frontendDist, 'index.html')));
  }
  app.use(errorHandler);
  return app;
}
