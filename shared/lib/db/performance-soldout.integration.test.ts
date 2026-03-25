/**
 * Integration test: performance sold_out status transition
 *
 * Verifies that the checkout UPDATE SQL correctly sets status = 'sold_out'
 * when the last available seat is purchased.
 *
 * Uses a real PostgreSQL container via testcontainers — no mocks.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { Pool } from 'pg';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { sql, eq } from 'drizzle-orm';
import path from 'path';
import * as schema from './schema';
import { shows, performances } from './schema';

const MIGRATIONS_DIR = path.join(__dirname, '../../drizzle/migrations');

describe('Performance sold_out status transition', () => {
  let container: StartedPostgreSqlContainer;
  let db: NodePgDatabase<typeof schema>;
  let pool: Pool;

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:16-alpine').start();
    pool = new Pool({ connectionString: container.getConnectionUri() });
    db = drizzle(pool, { schema });
    await migrate(db, { migrationsFolder: MIGRATIONS_DIR });
  }, 60_000);

  afterAll(async () => {
    await pool.end();
    await container.stop();
  });

  it('sets status to sold_out when the last seat is purchased', async () => {
    // Insert minimum required data: a show + one performance with 1 seat
    const [show] = await db
      .insert(shows)
      .values({ title: 'Test Show', slug: 'test-show-soldout', status: 'published' })
      .returning();

    const [performance] = await db
      .insert(performances)
      .values({
        showId: show.id,
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        availableSeats: 1,
        totalSeats: 1,
        status: 'published',
      })
      .returning();

    // Execute the exact same SQL used in checkout/actions.ts
    const perfId = performance.id;
    const quantity = 1;
    await db.execute(
      sql`
        UPDATE ${performances}
        SET
          available_seats = available_seats - ${quantity},
          status = CASE
            WHEN available_seats - ${quantity} = 0 THEN 'sold_out'
            ELSE status
          END
        WHERE id = ${perfId}
        AND available_seats >= ${quantity}
      `,
    );

    const [updated] = await db
      .select()
      .from(performances)
      .where(eq(performances.id, performance.id));

    expect(updated.availableSeats).toBe(0);
    expect(updated.status).toBe('sold_out');
  });

  it('does not change status to sold_out when seats remain after purchase', async () => {
    const [show] = await db
      .insert(shows)
      .values({ title: 'Test Show 2', slug: 'test-show-seats-remain', status: 'published' })
      .returning();

    const [performance] = await db
      .insert(performances)
      .values({
        showId: show.id,
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        availableSeats: 10,
        totalSeats: 10,
        status: 'published',
      })
      .returning();

    const perfId = performance.id;
    const quantity = 3;
    await db.execute(
      sql`
        UPDATE ${performances}
        SET
          available_seats = available_seats - ${quantity},
          status = CASE
            WHEN available_seats - ${quantity} = 0 THEN 'sold_out'
            ELSE status
          END
        WHERE id = ${perfId}
        AND available_seats >= ${quantity}
      `,
    );

    const [updated] = await db
      .select()
      .from(performances)
      .where(eq(performances.id, performance.id));

    expect(updated.availableSeats).toBe(7);
    expect(updated.status).toBe('published');
  });

  it('does not decrement seats when requested quantity exceeds available', async () => {
    const [show] = await db
      .insert(shows)
      .values({ title: 'Test Show 3', slug: 'test-show-overflow', status: 'published' })
      .returning();

    const [performance] = await db
      .insert(performances)
      .values({
        showId: show.id,
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        availableSeats: 2,
        totalSeats: 2,
        status: 'published',
      })
      .returning();

    const perfId = performance.id;
    const quantity = 5; // more than available
    await db.execute(
      sql`
        UPDATE ${performances}
        SET
          available_seats = available_seats - ${quantity},
          status = CASE
            WHEN available_seats - ${quantity} = 0 THEN 'sold_out'
            ELSE status
          END
        WHERE id = ${perfId}
        AND available_seats >= ${quantity}
      `,
    );

    const [updated] = await db
      .select()
      .from(performances)
      .where(eq(performances.id, performance.id));

    // Row should be untouched — WHERE clause prevents the update
    expect(updated.availableSeats).toBe(2);
    expect(updated.status).toBe('published');
  });
});
