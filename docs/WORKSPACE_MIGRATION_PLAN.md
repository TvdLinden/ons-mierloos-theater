# Migration Plan: Split Project into NPM Workspaces

## 1. Plan Structure

```
/packages
  /api         # Next.js app and API routes
  /worker      # Worker service (job processor)
  /shared      # Shared code: db, types, utils, etc.
/package.json  # Root, with workspaces config
```

---

## 2. Prepare for Migration

- Ensure all code is committed and CI is green.
- List all shared code (e.g., lib/db, lib/utils) to move to /shared.

---

## 3. Create Workspaces

1. At project root, create a new `/packages` directory.
2. Move your Next.js app (everything in `/app`, `/components`, etc.) into `/packages/api`.
3. Move worker code (e.g., `/lib/jobs`, `/scripts/start-worker.ts`) into `/packages/worker`.
4. Move shared code (e.g., `/lib/db`, `/lib/utils`, `/lib/queries`, `/lib/schemas`) into `/packages/shared`.

---

## 4. Update package.json Files

- At root, add:
  ```json
  {
    "private": true,
    "workspaces": ["packages/*"]
  }
  ```
- Create a `package.json` in each of `/api`, `/worker`, `/shared` with only their needed dependencies.
- Move devDependencies (like eslint, prettier, vitest) to the root or to each package as needed.

---

## 5. Update Imports

- Change imports in `/api` and `/worker` to use `@shared/db`, `@shared/utils`, etc. (use path aliases or package.json "exports" for clean imports).
- Update `tsconfig.json` in each package to support new paths.

---

## 6. Update Build & Docker

- Update Dockerfiles to only copy relevant package and `/shared`.
- Use `npm install --workspace=worker --omit=dev` in worker Dockerfile.
- Update scripts and CI to use workspace commands (e.g., `npm run build --workspace=api`).

---

## 7. Test Everything

- Run and test API and worker locally.
- Run all tests in `/shared`, `/api`, `/worker`.
- Build Docker images for both services and verify they work.

---

## 8. Clean Up

- Remove old `/lib`, `/scripts`, etc. from root.
- Update documentation and README.

---

## 9. Deploy

- Deploy API and worker using new Docker images.
- Monitor for issues.

---

**Tip:**
Do this in a feature branch. Migrate incrementally (start with shared code, then worker, then API).
