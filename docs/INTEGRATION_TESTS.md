# Integration Tests

Integration tests run against a real PostgreSQL database spun up via [testcontainers](https://testcontainers.com/). No mocks for DB-backed logic — only external network calls (Mollie, SMTP) are mocked.

## Running

```bash
# Both suites in parallel (separate containers)
npm run test:integration

# Individual suites
npm run test:integration --workspace=shared
npm run test:integration --workspace=web
```

## What is mocked vs real

|                                              | Mocked | Real |
| -------------------------------------------- | ------ | ---- |
| Database (orders, seats, jobs, mailing list) |        | ✓    |
| Mollie payments (`createMolliePayment`)      | ✓      |      |
| SMTP email (`sendQueuedPaymentEmail`)        | ✓      |      |

Everything that imports `db` from `@ons-mierloos-theater/shared/db` runs against the real container: commands, job processor, mailing list — all of it.

## DB injection pattern

`vi.mock` factories are hoisted before module imports, so you can't reference a variable that hasn't been declared yet. Use `vi.hoisted` to create a mutable ref that the factory can close over, then set it in `beforeAll` once the container is up:

```typescript
const dbState = vi.hoisted(() => ({
  instance: null as NodePgDatabase<typeof schema> | null,
}));

vi.mock('@ons-mierloos-theater/shared/db', () => ({
  db: new Proxy(
    {},
    {
      get(_, prop) {
        if (!dbState.instance) throw new Error('Real DB not initialised');
        const val = (dbState.instance as any)[prop];
        return typeof val === 'function' ? val.bind(dbState.instance) : val;
      },
    },
  ),
  imageUsages: {},
}));

beforeAll(async () => {
  container = await new PostgreSqlContainer('postgres:16-alpine').start();
  pool = new Pool({ connectionString: container.getConnectionUri() });
  db = drizzle(pool, { schema });
  await migrate(db, { migrationsFolder: MIGRATIONS_DIR });
  dbState.instance = db; // all db imports now point here
}, 60_000);
```

Always pass `'postgres:16-alpine'` explicitly — the `.DEFAULT_IMAGE` static field on `PostgreSqlContainer` is unreliable.

## Data isolation

Each test generates a unique email address. Assertions query by that email so tests never see each other's rows. No `beforeEach` table wipe is needed.

```typescript
function uniqueEmail() {
  return `test-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
}
```

## Concurrency

Tests within a file run **sequentially**. `describe.concurrent` + `vi.mock` don't mix — concurrent tests share a mock call queue, so `mockResolvedValueOnce` entries get consumed by the wrong test.

Parallelism happens at the **suite level**: `shared` and `web` each spin up their own container and run simultaneously via `& ... & wait` in the root `test:integration` script.

## Colima (Docker on macOS)

Docker socket and Ryuk config are set in `vitest.integration.config.ts` under the `env` key — not in npm scripts, where `${HOME}` expansion is unreliable:

```typescript
// web/vitest.integration.config.ts  (same pattern in shared/)
env: {
  DOCKER_HOST: `unix://${process.env.HOME}/.colima/default/docker.sock`,
  TESTCONTAINERS_RYUK_DISABLED: 'true',
},
```

## Adding a new integration test

1. Create `your-feature.integration.test.ts` in the appropriate workspace
2. Copy the `vi.hoisted` + Proxy boilerplate above
3. Mock only `createMolliePayment` and `sendQueuedPaymentEmail`
4. Use `uniqueEmail()` (or a similar unique key) to scope assertions to the current test's data
5. The vitest integration configs (`web/vitest.integration.config.ts`, `shared/vitest.integration.config.ts`) already pick up `*.integration.test.ts` automatically
