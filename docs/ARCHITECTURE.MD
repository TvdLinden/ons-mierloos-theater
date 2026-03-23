# Architecture — Ons Mierloos Theater

Theater ticket sales and management system for "Ons Mierloos Theater". Handles shows, performances, ticket sales, payments, and admin management.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router) |
| Styling | Tailwind CSS + shadcn/ui (Radix UI primitives) |
| Auth | NextAuth (credentials provider, bcryptjs) |
| Database | PostgreSQL 16 |
| ORM | Drizzle ORM |
| Payments | Mollie |
| Image storage | Cloudflare R2 (S3-compatible) |
| Background jobs | Custom job queue backed by PostgreSQL LISTEN/NOTIFY |
| PDF generation | PDFKit (tickets) |
| Email | Nodemailer (SMTP) |
| Rich text | TipTap |
| Forms | react-hook-form + Zod |
| Containerization | Docker + Kubernetes |

---

## Monorepo Structure

The repository is an **npm workspace monorepo** with three packages:

```
ons-mierloos-theater/
├── web/        # Next.js application (public site + admin)
├── shared/     # Database schema, queries, commands, utilities
├── worker/     # Background job processor + cron scheduler
├── scripts/    # Database migration and seeding scripts
└── docs/       # Documentation
```

```
┌─────────────────────────────────────────────────────┐
│                     web (Next.js)                   │
│  Public site · Admin · API routes · Server actions  │
└──────────────────────┬──────────────────────────────┘
                       │ imports
                       ▼
┌─────────────────────────────────────────────────────┐
│                      shared                         │
│   DB schema · Queries · Commands · Utils · Jobs     │
└──────────────────────▲──────────────────────────────┘
                       │ imports
┌──────────────────────┴──────────────────────────────┐
│                     worker                          │
│     Job processor · Scheduler · Job handlers        │
└─────────────────────────────────────────────────────┘
         │                           │
         ▼                           ▼
  ┌─────────────┐           ┌───────────────┐
  │  PostgreSQL │           │ Cloudflare R2 │
  └─────────────┘           └───────────────┘
```

---

## Package Breakdown

### `shared/`

Core business logic and data access. Both `web` and `worker` import from here.

```
shared/lib/
├── db/
│   ├── index.ts        # Database client + exported TypeScript types
│   └── schema/         # Per-entity schema files
│       ├── shows.ts
│       ├── performances.ts
│       ├── orders.ts
│       ├── payments.ts
│       ├── tickets.ts
│       ├── users.ts
│       ├── images.ts
│       ├── tags.ts
│       ├── coupons.ts
│       ├── sponsors.ts
│       ├── content.ts
│       ├── settings.ts
│       ├── oauth.ts
│       ├── jobs.ts
│       └── index.ts    # Barrel re-export + all relation definitions
├── commands/           # Write operations: createOrder, updatePayment, …
├── queries/            # Read operations: getShowBySlug, getUpcomingShows, …
├── jobs/
│   └── jobProcessor.ts # Job CRUD, retry scheduling, NOTIFY trigger
├── schemas/
│   └── blocks.ts       # Content block type definitions
└── utils/
    ├── couponValidation.ts
    ├── seatAssignment.ts
    ├── focalPoints.ts
    ├── r2ImageStorage.ts
    ├── email.ts
    ├── pdfHelpers.ts
    ├── export.ts        # XLSX export
    └── slug.ts
```

Data access pattern:
- `queries/` — read-only, e.g. `getShowBySlug()`, `getUpcomingShows()`
- `commands/` — writes, e.g. `createOrder()`, `updatePayment()`

### `web/`

Next.js App Router application. Server Components fetch data directly; Client Components handle interactivity.

```
web/app/
├── page.tsx                     # Homepage (hero carousel, featured shows, news)
├── voorstellingen/              # Show listing + detail pages
├── nieuws/[slug]/               # News articles
├── checkout/                    # Checkout flow + actions.ts
├── order/                       # Order status & confirmation
├── winkelwagen/                 # Shopping cart
├── account/                     # User dashboard (order history, profile)
├── admin/                       # Admin interface
│   ├── shows/                   # Show + performance management
│   ├── orders/                  # Order management + export
│   ├── coupons/                 # Discount codes
│   ├── images/                  # Image library + focal point editor
│   ├── users/                   # User management
│   └── mailing-lists/           # Newsletter lists
└── api/
    ├── images/[id]/route.ts     # Image proxy route
    ├── upload/route.ts          # Image upload
    ├── webhooks/mollie/route.ts # Mollie payment webhook
    └── oauth/token/route.ts     # M2M OAuth token
```

### `worker/`

Standalone Node.js process that drains the job queue.

```
worker/lib/jobs/
├── worker.ts          # Main loop — PostgreSQL LISTEN/NOTIFY polling
├── scheduler.ts       # node-cron scheduled tasks
└── handlers/
    ├── paymentCreationHandler.ts
    ├── paymentWebhookHandler.ts
    ├── orphanedOrderCleanupHandler.ts
    └── cleanupOldJobsHandler.ts
```

---

## Key Processes

### Checkout & Order Processing

```
Browser cart
  └─► Server action: checkout/actions.ts
        ├── Validate coupon (shared/lib/utils/couponValidation.ts)
        ├── Validate cart items & seat availability
        └── DB transaction:
              1. INSERT order (status: pending)
              2. INSERT line items        ← before lock (avoids FK/lock conflict)
              3. SELECT performances FOR UPDATE  ← acquire seat lock
              4. Verify availableSeats within lock
              5. UPDATE availableSeats (decrement)
              6. Record coupon usage (if applicable)
        └── Create Mollie payment
              └── On failure: queue `payment_creation` job
        └── Redirect to Mollie payment URL
```

After the user completes payment on Mollie:

```
Mollie webhook → POST /api/webhooks/mollie
  └── Queue `payment_webhook` job  (fast ACK to Mollie)
Worker picks up job:
  ├── Fetch payment status from Mollie API
  ├── Update order + payment records
  ├── Queue `pdf_generation` job (generate ticket PDF)
  └── Queue `email` job (send confirmation + tickets)
```

### Seat Assignment

Seat numbers are assigned at order confirmation time via `shared/lib/utils/seatAssignment.ts`. The logic runs within the same database transaction as the seat lock to guarantee uniqueness.

### Shopping Cart

The cart is managed entirely client-side (React state / localStorage). No server-side cart session exists. On checkout submission, the cart contents are sent as `FormData` and validated fresh against the database.

### User Dashboard (`/account`)

Authenticated users can view:
- Past and upcoming orders with ticket download links
- Personal details

Authentication is role-based (`user`, `admin`, `contributor`) via NextAuth. Server-side: `requireRole()`. Client-side: `useHasRole()` hook.

### Admin: Show Management

```
Admin form (block-based editor with TipTap)
  └── Upload images via /api/upload
        └── Uploaded to Cloudflare R2; R2 URL stored in DB
  └── Server action: updateShow() / createPerformance()
        └── revalidatePath() clears ISR cache
  └── Public pages update within seconds
```

Show and performance content is composed of **content blocks** (text, image, gallery, YouTube, column/row layout). The `BlockRenderer` component handles rendering on the public site.

### Admin: Image Management

- Images are uploaded to Cloudflare R2; the resulting URL is stored in PostgreSQL.
- Served via `next/image` which handles optimization and resizing automatically.
- **Focal point editor**: admins can set per-context crop hints (hero 16:7, card 4:3, carousel 21:9, thumbnail, gallery) by clicking on the full-size image. Focal points are stored as JSONB and applied as CSS `object-position` values at render time.

---

## Background Jobs

| Job type | Triggered by | Handler |
|---|---|---|
| `payment_creation` | Checkout (Mollie call failed) | `paymentCreationHandler` |
| `payment_webhook` | Mollie webhook | `paymentWebhookHandler` |
| `pdf_generation` | Successful payment | inline |
| `email` | Order confirmation | inline |
| `orphaned_order_cleanup` | Scheduler (cron) | `orphanedOrderCleanupHandler` |
| `cleanup_old_jobs` | Scheduler (cron) | `cleanupOldJobsHandler` |

Retry strategy: exponential backoff, up to 5 attempts, max ~10 minutes between retries. The worker uses PostgreSQL `LISTEN/NOTIFY` for near-real-time job pickup.

---

## Deployment

### Development (Docker Compose)

```
docker-compose up -d --build db   # Start PostgreSQL
npm run db:migrate                 # Apply migrations
npm run dev                        # Next.js dev server
npm run worker:watch               # Background worker with auto-reload
```

### Production (Dokploy on VPS)

`docker-compose.yml` is deployed as a service in **Dokploy** running on a VPS. Dokploy automatically redeploys when a new tag is pushed to the `main` branch.

Routing is handled by Dokploy (Traefik). Environment variables are configured in the Dokploy service settings.

---

## Environment Variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_SECRET` / `NEXTAUTH_URL` | Auth configuration |
| `MOLLIE_API_KEY` | Payment provider |
| `USE_MOCK_PAYMENT` | Set `true` to skip Mollie in development |
| `SMTP_HOST` / `SMTP_USER` / `SMTP_PASS` | Transactional email |
| `R2_ACCOUNT_ID` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` | Image storage |
| `R2_JURISDICTION` | Cloudflare R2 jurisdiction (e.g. `eu`) |
| `NEXT_PUBLIC_BASE_URL` | Base URL for payment redirects (baked into build) |
