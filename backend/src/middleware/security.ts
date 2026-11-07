import type { RequestHandler } from 'express';
import { env } from '../config/env';

const SAFE = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * CSRF defence in depth (cookie is SameSite=Strict as well):
 * state-changing requests must come from the same origin (or the configured dev frontend).
 */
export const originGuard: RequestHandler = (req, res, next) => {
  if (SAFE.has(req.method)) return next();
  const origin = req.headers.origin;
  if (!origin) return next(); // non-browser clients (tests, curl) carry no Origin
  const host = req.headers.host;
  let ok = false;
  try {
    const o = new URL(origin);
    ok = o.host === host || (!env.isProd && origin === env.DEV_FRONTEND_ORIGIN);
  } catch {
    ok = false;
  }
  if (!ok) {
    res.status(403).json({ error: { code: 'FORBIDDEN_ORIGIN', message: 'Cross-origin request blocked' } });
    return;
  }
  next();
};

/** Dev-only CORS so the Vite dev server (5173) can call the API with credentials. */
export const devCors: RequestHandler = (req, res, next) => {
  if (env.isProd || req.headers.origin !== env.DEV_FRONTEND_ORIGIN) return next();
  res.setHeader('Access-Control-Allow-Origin', env.DEV_FRONTEND_ORIGIN);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Vary', 'Origin');
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
};
