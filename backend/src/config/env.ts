import path from 'node:path';
import { z } from 'zod';
import { backendRoot } from './paths';

try {
  process.loadEnvFile(path.join(backendRoot, '.env'));
} catch {
  /* .env is optional */
}

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  HOST: z.string().default('127.0.0.1'),
  LOG_LEVEL: z.string().default('info'),
  DB_PATH: z.string().default('data/billing.db'),
  BACKUP_DIR: z.string().default('data/backups'),
  SESSION_TTL_HOURS: z.coerce.number().min(0.1).max(720).default(8),
  /** Set true when served over HTTPS (any public host) so the session cookie is Secure. */
  COOKIE_SECURE: z.enum(['true', 'false']).default('false').transform((v) => v === 'true'),
  /** Number of reverse proxies in front of the app (1 on most PaaS) so rate limiting sees real client IPs. */
  TRUST_PROXY: z.coerce.number().int().min(0).default(0),
  /** If set, the first-run account creation requires this key (prevents strangers claiming a public instance). */
  SETUP_KEY: z.string().optional(),
  DEV_FRONTEND_ORIGIN: z.string().default('http://localhost:5173'),
});

const parsed = schema.parse(process.env);
const resolve = (p: string) => (p === ':memory:' || path.isAbsolute(p) ? p : path.resolve(backendRoot, p));

export const env = {
  ...parsed,
  DB_PATH: resolve(parsed.DB_PATH),
  BACKUP_DIR: resolve(parsed.BACKUP_DIR),
  isProd: parsed.NODE_ENV === 'production',
  isTest: parsed.NODE_ENV === 'test',
};
