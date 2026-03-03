---
name: devcontainer
description: Run commands inside the devcontainer when a local Node/npm SDK is not available. Use this for running builds, tests, linting, migrations, or any CLI commands that require the project's runtime environment.
argument-hint: <command>
allowed-tools: Bash(docker exec *)
---

Execute the given command inside the devcontainer:

```bash
docker exec ons-mierloos-theater_devcontainer-app-1 sh -c "cd /workspace && $ARGUMENTS"
```

Return the full output including any errors.

## Examples

- `/devcontainer npm run build`
- `/devcontainer npm run lint`
- `/devcontainer npm run db:migrate`
- `/devcontainer npx tsc --noEmit`
