---
name: quality
description: Run the full quality check suite before committing (format, lint, typecheck)
disable-model-invocation: true
---

Run all quality gates to make sure the code is ready to commit.

## Steps

Run these in order — each step may surface issues that affect the next.

1. Auto-format all files:

   ```bash
   npm run format
   ```

2. Lint and report errors:

   ```bash
   npm run lint
   ```

   If there are auto-fixable issues, run `npm run lint:fix` and then lint again to confirm only non-fixable warnings remain.

3. Typecheck without emitting:
   ```bash
   npx tsc --noEmit
   ```

## Result

- If all three pass cleanly, the code is ready to commit.
- Report any remaining errors that need manual attention — do not ignore TypeScript or lint errors.
- Prettier formatting changes and lint fixes can be staged and committed automatically.
