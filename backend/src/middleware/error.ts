import type { ErrorRequestHandler, RequestHandler } from 'express';
import { AppError } from '../shared/errors';
import { logger } from '../shared/logger';

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.path} not found` } });
};

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.status).json({ error: { code: err.code, message: err.message, details: err.details } });
    return;
  }
  const e = err as { type?: string; status?: number; code?: string; message?: string };
  if (e?.type === 'entity.parse.failed') {
    res.status(400).json({ error: { code: 'BAD_JSON', message: 'Malformed JSON body' } });
    return;
  }
  if (e?.type === 'entity.too.large') {
    res.status(413).json({ error: { code: 'TOO_LARGE', message: 'Request body too large' } });
    return;
  }
  if (typeof e?.code === 'string' && e.code.startsWith('SQLITE_CONSTRAINT')) {
    logger.warn({ err, path: req.path }, 'constraint violation');
    res.status(409).json({ error: { code: 'CONSTRAINT', message: 'The change conflicts with existing data (duplicate or in use)' } });
    return;
  }
  logger.error({ err, path: req.path }, 'unhandled error');
  res.status(500).json({ error: { code: 'INTERNAL', message: 'Something went wrong' } });
};
