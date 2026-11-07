import { and, eq, gt, lt, ne } from 'drizzle-orm';
import { getDb } from '../../db/client';
import { sessions, users } from '../../db/schema';

export const authRepository = {
  countUsers: () => getDb().select().from(users).all().length,
  findByUsername: (username: string) => getDb().select().from(users).where(eq(users.username, username)).get(),
  findById: (id: number) => getDb().select().from(users).where(eq(users.id, id)).get(),
  createUser: (username: string, passwordHash: string) =>
    getDb().insert(users).values({ username, passwordHash }).returning().get(),
  updatePassword: (id: number, passwordHash: string) =>
    getDb().update(users).set({ passwordHash }).where(eq(users.id, id)).run(),
  touchLogin: (id: number) => getDb().update(users).set({ lastLoginAt: new Date().toISOString() }).where(eq(users.id, id)).run(),

  createSession: (id: string, userId: number, expiresAt: string) =>
    getDb().insert(sessions).values({ id, userId, expiresAt }).run(),
  findValidSession: (id: string) =>
    getDb()
      .select({ id: sessions.id, userId: sessions.userId, expiresAt: sessions.expiresAt, username: users.username, role: users.role })
      .from(sessions)
      .innerJoin(users, eq(users.id, sessions.userId))
      .where(and(eq(sessions.id, id), gt(sessions.expiresAt, new Date().toISOString())))
      .get(),
  extendSession: (id: string, expiresAt: string) => getDb().update(sessions).set({ expiresAt }).where(eq(sessions.id, id)).run(),
  deleteSession: (id: string) => getDb().delete(sessions).where(eq(sessions.id, id)).run(),
  deleteUserSessionsExcept: (userId: number, keepId: string) =>
    getDb().delete(sessions).where(and(eq(sessions.userId, userId), ne(sessions.id, keepId))).run(),
  deleteExpired: () => getDb().delete(sessions).where(lt(sessions.expiresAt, new Date().toISOString())).run(),
};
