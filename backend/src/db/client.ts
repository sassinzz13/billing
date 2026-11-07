import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { env } from '../config/env';
import { migrationsFolder } from '../config/paths';
import * as schema from './schema';

export type Db = BetterSQLite3Database<typeof schema>;
export type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];

let sqlite: Database.Database | null = null;
let orm: Db | null = null;

export function openSqlite(file: string): Database.Database {
  if (file !== ':memory:') fs.mkdirSync(path.dirname(file), { recursive: true });
  const conn = new Database(file);
  conn.pragma('journal_mode = WAL');
  conn.pragma('foreign_keys = ON');
  conn.pragma('busy_timeout = 5000');
  conn.pragma('synchronous = NORMAL');
  return conn;
}

export function initDb(file = env.DB_PATH): Db {
  closeDb();
  sqlite = openSqlite(file);
  orm = drizzle(sqlite, { schema });
  migrate(orm, { migrationsFolder });
  return orm;
}

/** Always call at use time (not module load) so a restore can swap the connection. */
export function getDb(): Db {
  if (!orm) throw new Error('Database not initialised');
  return orm;
}

export function getSqlite(): Database.Database {
  if (!sqlite) throw new Error('Database not initialised');
  return sqlite;
}

export function closeDb(): void {
  if (sqlite) {
    try {
      sqlite.pragma('wal_checkpoint(TRUNCATE)');
    } catch {
      /* ignore */
    }
    sqlite.close();
  }
  sqlite = null;
  orm = null;
}
