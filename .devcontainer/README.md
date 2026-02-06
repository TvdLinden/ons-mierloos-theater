# Development Container Setup

This directory contains configuration for VS Code Dev Containers, providing a consistent, zero-configuration development environment for the Ons Mierloos Theater application.

## Quick Start

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running
- [VS Code](https://code.visualstudio.com/) with [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)

### Setup (One-Click)

1. Open the project in VS Code
2. When prompted, click **"Reopen in Container"** or run the command **"Dev Containers: Reopen in Container"** from the command palette (`Cmd+Shift+P`)
3. Wait for the container to build and setup (2-5 minutes on first run)
4. The terminal will display when setup is complete

That's it! Your environment is ready.

## Services Overview

The development environment includes three services:

### App (Main Dev Container)
- **Purpose:** Development environment for the Next.js application
- **Base:** Node 20 with TypeScript support
- **Includes:** All npm workspace packages (shared, web, worker)
- **Auto-starts:** Yes (always running)
- **Location:** `/workspace` inside container

### PostgreSQL Database (db)
- **Purpose:** Development database
- **Image:** `postgres:16-alpine`
- **Credentials:** `username:password`
- **Database:** `database`
- **Port:** 5432 (accessible from container and your machine)
- **Auto-starts:** Yes
- **Persistence:** Data persists in `pgdata` volume across container rebuilds

### Worker (Background Job Processor)
- **Purpose:** Optional service for job processing (PDF generation, payment webhooks, etc.)
- **Base:** Node 20 with the Dockerfile.worker configuration
- **Auto-starts:** No (opt-in via profiles)
- **Port:** 8080 (health check endpoint)

## Common Tasks

### Starting the Development Server

```bash
npm run dev
```

Access the application at `http://localhost:3000`

Hot reload is enabled—changes to code will automatically refresh the browser.

### Running Tests

```bash
# Run tests once
npm test

# Watch mode (re-runs on file changes)
npm run test:watch

# With coverage report
npm run test:coverage
```

### Code Quality

```bash
# Check for linting errors
npm run lint

# Auto-fix linting errors
npm run lint:fix

# Format code with Prettier
npm run format
```

### Database Operations

```bash
# Generate Drizzle migrations (after schema changes)
npm run db:generate

# Apply migrations to the database
npm run db:migrate

# Seed the database with initial data (optional, requires script)
npm run db:seed
```

### Working with the Background Worker

The worker service is optional and starts on-demand.

**Start the worker:**

```bash
# From .devcontainer directory
cd .devcontainer
docker-compose up worker
```

Or from VS Code terminal with Docker extension:

```bash
docker-compose --file .devcontainer/docker-compose.yml --profile worker up worker
```

**Verify worker is running:**

Visit `http://localhost:8080/health` - should return JSON with status.

**Stop the worker:**

Press `Ctrl+C` in the terminal where worker is running, or use Docker extension to stop the container.

**View worker logs:**

```bash
docker-compose --file .devcontainer/docker-compose.yml logs -f worker
```

## Environment Variables

The setup script automatically creates `.env.local` from `.env.example` with these modifications:

| Variable | Development Value | Note |
|----------|-------------------|------|
| `DATABASE_URL` | `postgresql://username:password@db:5432/database` | Uses `db` hostname (Docker service name) |
| `USE_MOCK_PAYMENT` | `true` | Uses mock Mollie payments |
| Other variables | Copied from `.env.example` | Edit `.env.local` to customize |

To customize variables after setup, edit `.env.local` in the workspace root.

## PostgreSQL Connection

### From Command Line

```bash
psql -h db -U username -d database
```

When prompted, password is `password`

### Using SQLTools Extension

The dev container includes [SQLTools](https://marketplace.visualstudio.com/items?itemName=mtxr.sqltools) with PostgreSQL driver:

1. Click the SQLTools icon in VS Code sidebar
2. Click "Add Connection"
3. Select "PostgreSQL"
4. Use these settings:
   - Host: `db`
   - Port: `5432`
   - Database: `database`
   - Username: `username`
   - Password: `password`
   - Save password: Yes

Once connected, you can:
- Browse database schema
- Run SQL queries
- Generate ERD diagrams
- Execute migrations directly

## VS Code Extensions

These extensions are automatically installed in the dev container:

| Extension | Purpose |
|-----------|---------|
| **ESLint** | Real-time linting with inline error messages |
| **Prettier** | Code formatting (auto on save) |
| **Tailwind CSS IntelliSense** | Class suggestions for Tailwind and `cva()` |
| **Docker** | Manage Docker containers and images |
| **React Snippets** | Quick React code generation |
| **Prisma** | SQL syntax highlighting and parsing |
| **SQLTools** | Database client and query runner |
| **Error Lens** | Show linting/TypeScript errors inline |
| **Path IntelliSense** | Autocomplete for file paths |
| **Vitest Explorer** | Test runner UI with coverage visualization |

## Troubleshooting

### Issue: "PostgreSQL connection refused"

**Cause:** Database container hasn't started or failed health check

**Solution:**
```bash
# Check if db container is running
docker-compose --file .devcontainer/docker-compose.yml ps

# View database logs
docker-compose --file .devcontainer/docker-compose.yml logs db

# Restart database
docker-compose --file .devcontainer/docker-compose.yml restart db
```

### Issue: "npm: command not found" or missing dependencies

**Cause:** `node_modules` not properly synced

**Solution:**
```bash
# Rebuild dev container (VS Code command palette)
# > Dev Containers: Rebuild Container

# Or manually reinstall
npm install
```

### Issue: npm error EACCES "sharp-darwin-arm64" or permission denied during npm install

**Cause:** Host machine's macOS ARM64 bindings (darwin-arm64) are incompatible with the Linux container. If you've run `npm install` on your macOS host, those bindings get mounted into the container and cause permission errors.

**Solution:**

1. **Clean up on host machine (outside devcontainer):**
```bash
# Remove host node_modules with macOS bindings (KEEP package-lock.json!)
rm -rf node_modules

# Remove the Docker volume to ensure clean install
docker volume rm ons-mierloos-theater_devcontainer_node_modules 2>/dev/null || true
```

2. **Rebuild devcontainer:**
   - VS Code command palette: **Dev Containers: Rebuild Container**
   - The postCreateCommand will use `npm ci` with the lock file for reproducible install

**Why we keep package-lock.json:**
- `npm ci` (clean install) uses the lock file to install exact versions
- Ensures dev environment matches production deployments exactly
- Prevents version inconsistencies across the team
- The lock file is version controlled in git for reproducibility

**Prevention:** Always run npm commands inside the devcontainer terminal (in VS Code), never on your host machine. The devcontainer has its own isolated `node_modules` volume that handles Linux bindings correctly.

### Issue: Database migrations fail on first setup

**Cause:** Minor race condition between db startup and migration

**Solution:**
```bash
# Wait a few seconds and try again
npm run db:migrate

# Or check database is ready
pg_isready -h db -U username -d database
```

### Issue: Port 3000 already in use

**Cause:** Another process is using the port

**Solution:**
```bash
# Find and kill the process
lsof -i :3000
kill -9 <PID>

# Or use a different port
npm run dev -- -p 3001
```

### Issue: Worker service won't start

**Cause:** Port 8080 in use or database not ready

**Solution:**
```bash
# Check if port is free
lsof -i :8080

# Ensure database is healthy
docker-compose --file .devcontainer/docker-compose.yml ps db

# Check worker logs
docker-compose --file .devcontainer/docker-compose.yml logs worker

# Rebuild and restart
docker-compose --file .devcontainer/docker-compose.yml up --build worker
```

### Issue: Container takes too long to build

**Cause:** First-time setup requires downloading Docker images and installing dependencies

**Solution:** This is normal. Subsequent opens will be much faster (30 seconds).

### Issue: Data lost after container rebuild

**Cause:** Using wrong docker-compose file or deleting volumes

**Solution:**
```bash
# Verify pgdata volume exists
docker volume ls | grep pgdata

# Don't use --volumes with docker-compose down
# Use correct compose file: .devcontainer/docker-compose.yml
```

## Customization

### Enable Auto-Start Worker

To always start the worker service when opening the dev container, edit `.devcontainer/devcontainer.json`:

```json
{
  "dockerComposeFile": "docker-compose.yml",
  "service": "app",
  "runServices": ["app", "db", "worker"]  // Add this line
}
```

### Add More Extensions

Edit `.devcontainer/devcontainer.json` and add extensions to the `extensions` array:

```json
"customizations": {
  "vscode": {
    "extensions": [
      "existing.extension",
      "new.extension-id"  // Add here
    ]
  }
}
```

### Install System Packages

Edit `.devcontainer/Dockerfile` to add apt packages:

```dockerfile
RUN apt-get update && apt-get install -y \
    postgresql-client \
    your-package-here \
    && rm -rf /var/lib/apt/lists/*
```

Then rebuild the container.

### Change Node Version

Edit `.devcontainer/Dockerfile` base image:

```dockerfile
# Change from 1-20-bookworm to your desired version
FROM mcr.microsoft.com/devcontainers/typescript-node:1-22-bookworm
```

Available versions: Node 18, 20, 22, 24 (check [devcontainers/images](https://github.com/devcontainers/images/pkgs/container/typescript-node))

## File Structure

```
.devcontainer/
├── devcontainer.json        # Main VS Code Dev Container configuration
├── docker-compose.yml       # Development services (app, db, worker)
├── Dockerfile              # Dev container image (Node 20 + tools)
├── postCreateCommand.sh    # Setup automation (env, dependencies, migrations)
└── README.md              # This file
```

## Performance Tips

### Optimize Docker Desktop Resources (macOS/Windows)

**This is the #1 performance improvement!**

1. Open **Docker Desktop Settings**
2. Go to **Resources** tab
3. Increase allocations:
   - **CPU limit:** 6-8 cores (minimum 4)
   - **Memory:** 6-8GB (minimum 4GB)
   - **Swap:** 2GB
   - **Disk image size:** 64GB+
4. Click **Apply & Restart**

### Volume Mount Performance

The dev container is optimized for macOS/Windows with:

- `:cached` flag on workspace mount - trades disk consistency for speed
- `node_modules` in named Docker volume - fast I/O
- `.next` and `.turbo` excluded from mount - let container build these
- `TURBOPACK_CACHE_DIR` in /tmp - faster builds

**Result:** Fast hot reload and builds despite mounted volumes.

### If still slow, enable VirtioFS (Docker Desktop 4.6+)

Docker Desktop settings:
1. **Preferences** → **General**
2. Enable **Use VirtioFS** (if available)
3. Restart Docker

VirtioFS provides better mount performance than osxfs.

### Clean Up Disk Space

```bash
# Remove old devcontainer images (keeps latest)
docker image prune

# Remove unused volumes
docker volume prune

# Full cleanup (careful—removes ALL unused Docker resources)
docker system prune -a

# Check Docker disk usage
docker system df
```

### Troubleshooting Slowness

**If `npm run dev` is still slow:**

1. Check Docker Desktop resource allocation (see above)
2. Verify no large processes running on host (Activity Monitor)
3. Try rebuilding the devcontainer:
   ```bash
   docker-compose -f .devcontainer/docker-compose.yml down -v
   # Then reopen in VS Code: Dev Containers: Rebuild Container
   ```
4. Check container resource limits (shouldn't need adjustment if host has resources)

**For Next.js builds specifically:**
- SWC compiler is used (faster than Babel)
- Turbopack cache is in `/tmp` (faster rebuilds)
- Telemetry is disabled (reduces overhead)

## Next Steps

1. **Start the dev server:** `npm run dev`
2. **Open the app:** Visit `http://localhost:3000`
3. **Try editing:** Change a file and watch it hot-reload
4. **Run tests:** `npm test`
5. **Explore the code:** Check `packages/web` and `packages/shared` for the application structure

## Need Help?

- **VS Code Dev Containers docs:** https://code.visualstudio.com/docs/devcontainers/containers
- **Docker Desktop docs:** https://docs.docker.com/desktop/
- **Project README:** See `/README.md` in the workspace root

## Tips for First-Time Users

1. **First startup takes 2-5 minutes** - This is normal. Subsequent opens are much faster.
2. **Check the terminal output** - The setup script prints helpful messages about what's happening.
3. **Use VS Code command palette** - Press `Cmd+Shift+P` to open commands like "Dev Containers: Rebuild Container"
4. **Keep Docker running** - The container needs Docker Desktop running in the background.
5. **Save your work** - Changes to files persist automatically; database data persists in volumes.
