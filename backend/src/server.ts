import { createApp } from './app';
import { env } from './config/env';
import { closeDb, initDb } from './db/client';
import { seedDemoData } from './db/seed';
import { logger } from './shared/logger';

initDb();
seedDemoData();
const app = createApp();
const server = app.listen(env.PORT, env.HOST, () => {
  logger.info(`Billing system API listening on http://${env.HOST}:${env.PORT} (db: ${env.DB_PATH})`);
});

function shutdown() {
  server.close(() => {
    closeDb();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 5000).unref();
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
