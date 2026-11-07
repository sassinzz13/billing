import crypto from 'node:crypto';
import { hash, verify } from '@node-rs/argon2';
import { env } from '../../config/env';
import { AppError, badRequest, conflict, unauthorized } from '../../shared/errors';
import { authRepository as repo } from './repository';
import type { AuthUser } from './types';

const ARGON = { algorithm: 2 as const /* Argon2id */, memoryCost: 19456, timeCost: 2, parallelism: 1 };
export const sha256 = (s: string) => crypto.createHash('sha256').update(s).digest('hex');
const ttlMs = () => env.SESSION_TTL_HOURS * 3600_000;
const expiry = () => new Date(Date.now() + ttlMs()).toISOString();

let dummyHash: string | undefined;

export const authService = {
  status: () => ({ setupRequired: repo.countUsers() === 0 }),

  async setup(username: string, password: string) {
    if (repo.countUsers() > 0) throw conflict('An administrator account already exists');
    const user = repo.createUser(username, await hash(password, ARGON));
    return this.openSession({ id: user.id, username: user.username, role: user.role });
  },

  async login(username: string, password: string) {
    const user = repo.findByUsername(username);
    if (!user) {
      // equalise timing so usernames cannot be probed
      dummyHash ??= await hash('dummy-password', ARGON);
      await verify(dummyHash, password).catch(() => false);
      throw unauthorized('Invalid username or password');
    }
    const ok = await verify(user.passwordHash, password).catch(() => false);
    if (!ok) {
      throw unauthorized('Invalid username or password');
    }
    repo.touchLogin(user.id);
    repo.deleteExpired();
    return this.openSession({ id: user.id, username: user.username, role: user.role });
  },

  openSession(user: AuthUser) {
    const token = crypto.randomBytes(32).toString('base64url');
    repo.createSession(sha256(token), user.id, expiry());
    return { token, user, maxAgeMs: ttlMs() };
  },

  /** Resolve a cookie token to a user; slides expiry forward when more than a minute has passed. */
  resolve(token: string | undefined): AuthUser | null {
    if (!token) return null;
    const id = sha256(token);
    const s = repo.findValidSession(id);
    if (!s) return null;
    const remaining = new Date(s.expiresAt).getTime() - Date.now();
    if (ttlMs() - remaining > 60_000) repo.extendSession(id, expiry());
    return { id: s.userId, username: s.username, role: s.role };
  },

  logout(token: string | undefined) {
    if (token) repo.deleteSession(sha256(token));
  },

  async changePassword(user: AuthUser, token: string | undefined, current: string, next: string) {
    const row = repo.findById(user.id);
    if (!row) throw new AppError(404, 'NOT_FOUND', 'User not found');
    if (!(await verify(row.passwordHash, current).catch(() => false))) throw badRequest('Current password is incorrect');
    if (current === next) throw badRequest('New password must differ from the current password');
    repo.updatePassword(user.id, await hash(next, ARGON));
    if (token) repo.deleteUserSessionsExcept(user.id, sha256(token));
  },
};
