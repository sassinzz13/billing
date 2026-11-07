import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { createdAt } from './_common';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  /** Only 'finance' users may record payments (business rule 9). */
  role: text('role', { enum: ['finance', 'staff'] }).notNull().default('finance'),
  lastLoginAt: text('last_login_at'),
  createdAt: createdAt(),
});

/** Session id is the SHA-256 of the cookie token; the raw token is never stored. */
export const sessions = sqliteTable(
  'sessions',
  {
    id: text('id').primaryKey(),
    userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    expiresAt: text('expires_at').notNull(),
    createdAt: createdAt(),
  },
  (t) => [index('sessions_user_idx').on(t.userId), index('sessions_expires_idx').on(t.expiresAt)],
);
