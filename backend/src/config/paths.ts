import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** Walk up from this file until the backend package.json is found (works for src/ via tsx and dist/ bundle). */
function findBackendRoot(): string {
  let dir = path.dirname(fileURLToPath(import.meta.url));
  for (let i = 0; i < 6; i++) {
    const pkg = path.join(dir, 'package.json');
    if (fs.existsSync(pkg) && JSON.parse(fs.readFileSync(pkg, 'utf8')).name === 'billing-backend') return dir;
    dir = path.dirname(dir);
  }
  throw new Error('Could not locate backend root');
}

export const backendRoot = findBackendRoot();
export const migrationsFolder = path.join(backendRoot, 'src', 'db', 'migrations');
export const frontendDist = path.resolve(backendRoot, '..', 'frontend', 'dist');
