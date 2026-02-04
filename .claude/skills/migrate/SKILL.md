---
name: migrate
description: Generate and apply Drizzle ORM database migrations after schema changes
disable-model-invocation: true
---

Run the database migration workflow after changes to `lib/db/schema.ts`.

## Steps

1. Generate a new migration:
   ```bash
   npm run db:generate
   ```
   This creates a new file in `drizzle/migrations/`.

2. Review the generated migration file to make sure it matches the intended schema changes. Pay attention to:
   - Dropped columns or tables (destructive)
   - Type changes
   - New foreign key constraints

3. Apply the migration to the local database:
   ```bash
   npm run db:migrate
   ```

4. Verify the migration succeeded — if there are errors, review and fix the schema before re-running.

## Notes

- The database must be running (`docker-compose up -d db`) before applying migrations.
- Both commands use `cross-env NODE_ENV=development` internally — do not set it manually.
- Migration files are checked into git and should be committed alongside schema changes.
