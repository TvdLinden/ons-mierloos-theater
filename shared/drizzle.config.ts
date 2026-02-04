// drizzle.config.ts
import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';

const NODE_ENV = process.env.NODE_ENV || 'local';
console.log('NODE_ENV', NODE_ENV);

// Treat 'local' and 'development' similarly for env file selection
const isLocalEnv = NODE_ENV === 'development' || NODE_ENV === 'local';

// Try a few sensible env file locations in order of precedence
const triedPaths: string[] = [];
const tryPaths = isLocalEnv
  ? ['../.env.local', '../.env', '../.env.development']
  : ['../.env.production', '../.env'];

for (const p of tryPaths) {
  triedPaths.push(p);
  dotenv.config({ path: p });
}

const DATABASE_URL = process.env.DATABASE_URL;
if (isLocalEnv) {
  console.log('Tried env files:', triedPaths.join(', '));
  console.log('DATABASE_URL (raw):', DATABASE_URL);
}

if (!DATABASE_URL) {
  throw new Error(
    `Cannot read environment - DATABASE_URL is not set. Tried: ${triedPaths.join(', ')}`,
  );
}

export default defineConfig({
  out: 'drizzle/migrations',
  schema: 'lib/db/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: DATABASE_URL,
  },
});
