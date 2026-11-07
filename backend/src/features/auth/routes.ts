import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { requireAuth } from '../../middleware/auth';
import { authController as c } from './controller';

const loginLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: Number(process.env.LOGIN_RATE_LIMIT ?? 10),
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMITED', message: 'Too many failed attempts. Try again in 15 minutes.' } },
});

export const authRouter = Router();
authRouter.get('/status', c.status);
authRouter.post('/setup', loginLimiter, c.setup);
authRouter.post('/login', loginLimiter, c.login);
authRouter.post('/logout', c.logout);
authRouter.get('/me', requireAuth, c.me);
authRouter.post('/change-password', requireAuth, c.changePassword);
