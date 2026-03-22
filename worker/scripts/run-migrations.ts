import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}

const main = async () => {
  const pool = new Pool({ connectionString: DATABASE_URL });
  const db = drizzle(pool);

  // Migrations live in shared/drizzle/migrations, one level up from worker/
  const migrationsFolder = path.resolve(__dirname, '../../shared/drizzle/migrations');
  console.log('Running migrations from:', migrationsFolder);

  await migrate(db, { migrationsFolder });

  await pool.end();
  console.log('Migrations applied successfully');
};

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
