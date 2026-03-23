# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Theater ticket sales and management system for "Ons Mierloos Theater". Dutch-language application handling shows, performances, ticket sales, payments (Mollie), and admin management.

## Commands

```bash
# Development
npm run dev              # Start Next.js dev server (localhost:3000)
npm run build            # Production build
npm run lint             # ESLint check
npm run lint:fix         # ESLint auto-fix
npm run format           # Prettier format

# Tests (Vitest)
npm test                 # Run all tests
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report

# Database (requires Docker for local PostgreSQL)
docker-compose up -d --build db  # Start local database
npm run db:generate              # Generate Drizzle migrations
npm run db:migrate               # Apply migrations to database
npm run db:seed                  # Seed database with sample data

# Background worker (processes jobs like PDF generation, payment webhooks)
npm run worker           # Start job processor
npm run worker:watch     # Start with auto-reload
```

## Architecture

This is an **npm workspace monorepo** with three packages:

- **`@ons-mierloos-theater/shared`** — DB schema, queries, commands, utilities (imported by both web and worker)
- **`@ons-mierloos-theater/web`** — Next.js App Router application (public site + admin)
- **`@ons-mierloos-theater/worker`** — Background job processor and cron scheduler

### Database Layer (`shared/lib/db/`)

- **Schema**: Split into per-entity files in `shared/lib/db/schema/` (shows, performances, orders, payments, tickets, users, images, tags, coupons, sponsors, content, settings, oauth, jobs). Relations are centralized in `schema/index.ts` using lazy lambdas to avoid circular imports.
- **Connection**: `shared/lib/db/index.ts` — database client and exported TypeScript types
- Import DB types from `@ons-mierloos-theater/shared/db`

### Data Access Pattern

- **Queries** (`shared/lib/queries/`): Read operations (e.g., `getShowBySlug`, `getPerformanceById`, `getUpcomingShows`)
- **Commands** (`shared/lib/commands/`): Write operations (e.g., `createOrder`, `updatePayment`)
- Import via `@ons-mierloos-theater/shared/queries/shows`, `@ons-mierloos-theater/shared/commands/orders`, etc.

**Key Show Queries:**

- `getUpcomingShows()` — Fetches shows with future performances (ordered by date)
- `getRecentlyPassedShows()` — Fetches shows with past performances (ordered by most recent first)
- Both support pagination (`offset`, `limit`) and tag filtering
- Both return `ShowWithTagsAndPerformances` with tags and performances included

### Authentication

- NextAuth with credentials provider
- Auth config: `web/lib/utils/auth.ts`
- Roles: `user`, `admin`, `contributor`
- Use `requireRole()` for server-side role checks
- Use `useHasRole()` hook for client-side

### API Routes (`web/app/api/`)

- REST endpoints in `app/api/[resource]/route.ts`
- Mollie webhooks: `app/api/webhooks/mollie/route.ts`
- OAuth for M2M: `app/api/oauth/token/route.ts`

### Content Blocks System (`shared/lib/schemas/blocks.ts`)

Shows and pages use a block-based content editor with these block types:

- `text` — Markdown content with alignment/styling options
- `image` — Single image with caption
- `youtube` — Embedded video
- `gallery` — Image carousel (max 10 images)
- `column` / `row` — Layout containers (cannot nest same type)

### Carousel System

- Uses Embla Carousel via shadcn/ui (`components/ui/carousel.tsx`)
- Components: `Carousel`, `CarouselContent`, `CarouselItem`, `CarouselPrevious`, `CarouselNext`
- Accepts `plugins` prop for autoplay: `plugins={[Autoplay({ delay: 5000 })]}`

### Reusable Components

- `TagsContainer` — Displays array of tags with `size="sm"|"md"`
- `DateDisplay` — Formats dates in Dutch locale with customizable options
- `MailingListSignup` — Newsletter subscription form (client component)
- `PerformanceCard` — Expandable show card with hover effects (used on show listing pages)

### Image Handling

- Images are uploaded to Cloudflare R2; the R2 URL is stored in the database
- Rendered with `next/image` (handles optimization and resizing automatically)
- **Focal points**: Per-context crop hints stored as JSONB on the `images` table. Contexts: `hero` (16:7), `card` (4:3), `carousel` (21:9), `thumbnail` (4:3), `gallery` (16:9). Applied via `getFocalPointStyle()` from `shared/lib/utils/focalPoints.ts` as CSS `object-position`.

### Key Patterns

- Server components fetch data directly via queries
- Forms use react-hook-form with zod validation (`web/lib/schemas/`)
- UI components use shadcn/ui (`web/components/ui/`)
- Rich text editing with TipTap (`web/components/WysiwygEditor.tsx`)
- Prices stored as `decimal(10,2)` strings (never floating point)
- Full-width sections: Use `className="w-screen relative left-[calc(-50vw+50%)]"` to break out of container

## Environment Variables

Required in `.env.local` (see `.env.example` for all defaults):

- `DATABASE_URL` — PostgreSQL connection string
- `NEXTAUTH_SECRET`, `NEXTAUTH_URL` — Auth configuration
- `MOLLIE_API_KEY`, `MOLLIE_WEBHOOK_URL` — Payment provider (use `USE_MOCK_PAYMENT=true` for dev)
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `FROM_EMAIL`, `FROM_NAME` — Email
- `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_IMAGES_BUCKET_NAME` — Image storage
- `R2_JURISDICTION` — Optional; set to `eu` for EU-regional R2 endpoint
- `NEXT_PUBLIC_BASE_URL`, `NEXT_PUBLIC_APP_URL` — Base URLs (baked into build)
