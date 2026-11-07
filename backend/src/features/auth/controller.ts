import type { CookieOptions, Request, RequestHandler, Response } from 'express';
import crypto from 'node:crypto';
import { env } from '../../config/env';
import { AppError } from '../../shared/errors';
import { parse } from '../../shared/validate';
import { changePasswordSchema, loginSchema, setupSchema } from './schemas';
import { authService } from './service';

export const COOKIE = 'billing_sid';
const cookieOpts = (maxAge?: number): CookieOptions => ({
  httpOnly: true,
  sameSite: 'strict',
  secure: env.COOKIE_SECURE, // true when hosted behind HTTPS
  path: '/',
  ...(maxAge ? { maxAge } : {}),
});
const token = (req: Request) => req.cookies?.[COOKIE] as string | undefined;
const startSession = (res: Response, s: { token: string; user: unknown; maxAgeMs: number }) => {
  res.cookie(COOKIE, s.token, cookieOpts(s.maxAgeMs));
  res.json({ data: { user: s.user } });
};

export const authController = {
  status: ((req, res) => {
    const user = authService.resolve(token(req));
    res.json({ data: { ...authService.status(), setupKeyRequired: !!env.SETUP_KEY, user } });
  }) as RequestHandler,
  setup: (async (req, res) => {
    const b = parse(setupSchema, req.body);
    if (env.SETUP_KEY) {
      const a = Buffer.from(b.setupKey ?? '');
      const k = Buffer.from(env.SETUP_KEY);
      if (a.length !== k.length || !crypto.timingSafeEqual(a, k)) throw new AppError(403, 'FORBIDDEN', 'Invalid setup key');
    }
    res.status(201);
    startSession(res, await authService.setup(b.username, b.password));
  }) as RequestHandler,
  login: (async (req, res) => {
    const b = parse(loginSchema, req.body);
    startSession(res, await authService.login(b.username, b.password));
  }) as RequestHandler,
  logout: ((req, res) => {
    authService.logout(token(req));
    res.clearCookie(COOKIE, cookieOpts());
    res.json({ data: { ok: true } });
  }) as RequestHandler,
  changePassword: (async (req, res) => {
    const b = parse(changePasswordSchema, req.body);
    await authService.changePassword(req.user!, token(req), b.currentPassword, b.newPassword);
    res.json({ data: { ok: true } });
  }) as RequestHandler,
  me: ((req, res) => {
    res.json({ data: { user: req.user } });
  }) as RequestHandler,
};
