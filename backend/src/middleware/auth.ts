import type { RequestHandler } from 'express';
import { COOKIE } from '../features/auth/controller';
import { authService } from '../features/auth/service';
import { unauthorized } from '../shared/errors';

export const requireAuth: RequestHandler = (req, _res, next) => {
  const user = authService.resolve(req.cookies?.[COOKIE]);
  if (!user) return next(unauthorized());
  req.user = user;
  next();
};
