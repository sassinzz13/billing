import { env } from '../config/env';
import { closeDb, initDb } from './client';
import { seedDemoData } from './seed';

initDb();
if (process.argv.includes('--seed')) seedDemoData();
closeDb();
console.log(`Migrations applied to ${env.DB_PATH}${process.argv.includes('--seed') ? ' (demo data seeded)' : ''}`);
