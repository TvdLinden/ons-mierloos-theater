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

# Database (requires Docker for local PostgreSQL)
docker-compose up -d --build db  # Start local database
npm run db:generate              # Generate Drizzle migrations
npm run db:migrate               # Push schema to database

# Background worker (processes jobs like PDF generation, payment webhooks)
npm run worker           # Start job processor
npm run worker:watch     # Start with auto-reload
```

## Architecture

### Database Layer (`lib/db/`)
- **Schema**: `lib/db/schema.ts` - Drizzle ORM schema with PostgreSQL
- **Connection**: `lib/db/index.ts` - Database client and TypeScript types
- Core entities: shows, performances, orders, payments, tickets, users, coupons

### Data Access Pattern
- **Queries** (`lib/queries/`): Read operations (e.g., `getShowBySlug`, `getPerformanceById`)
- **Commands** (`lib/commands/`): Write operations (e.g., `createOrder`, `updatePayment`)
- Import db types from `@/lib/db`

### Authentication
- NextAuth with credentials provider
- Auth config: `lib/utils/auth.ts`
- Roles: `user`, `admin`, `contributor`
- Use `requireRole()` for server-side role checks
- Use `useHasRole()` hook for client-side

### API Routes (`app/api/`)
- REST endpoints in `app/api/[resource]/route.ts`
- Mollie webhooks: `app/api/webhooks/mollie/route.ts`
- OAuth for M2M: `app/api/oauth/token/route.ts`

### Background Jobs (`lib/jobs/`)
- Job queue stored in `jobs` table with exponential backoff retry
- Worker processes: PDF generation, payment creation, webhook handling, orphaned order cleanup
- Job handlers in `lib/jobs/handlers/`
- Job types: `pdf_generation`, `payment_creation`, `payment_webhook`, `orphaned_order_cleanup`, `email`
- Create jobs via `createJob(type, data, priority)` from `lib/jobs/jobProcessor.ts`

### Content Blocks System (`lib/schemas/blocks.ts`)
Shows and pages use a block-based content editor with these block types:
- `text` - Markdown content with alignment/styling options
- `image` - Single image with caption
- `youtube` - Embedded video
- `gallery` - Image carousel (max 10 images)
- `column` / `row` - Layout containers (cannot nest same type)

### Checkout Flow (`app/checkout/actions.ts`)
1. Cart validation and coupon processing
2. Transactional order creation with row-level locking (`SELECT ... FOR UPDATE`)
3. Seat reservation (decrements `availableSeats`)
4. Mollie payment creation (queued as job on failure)
5. Redirect to payment or order status page

### Homepage (`app/page.tsx`)
- `HeroCarousel` - Full-width image carousel with autoplay (Embla + `embla-carousel-autoplay`)
- `FeaturedShows` - 3-column grid of show cards ("Uitgelicht" section)
- `FeaturedShowCard` - Simplified show card with thumbnail, tags, date, price
- `NewsletterSection` - Newsletter signup wrapper using `MailingListSignup`
- `HomeNews` - News articles carousel

### Carousel System
- Uses Embla Carousel via shadcn/ui (`components/ui/carousel.tsx`)
- Components: `Carousel`, `CarouselContent`, `CarouselItem`, `CarouselPrevious`, `CarouselNext`
- Accepts `plugins` prop for autoplay: `plugins={[Autoplay({ delay: 5000 })]}`

### Reusable Components
- `TagsContainer` - Displays array of tags with `size="sm"|"md"`
- `DateDisplay` - Formats dates in Dutch locale with customizable options
- `MailingListSignup` - Newsletter subscription form (client component)
- `PerformanceCard` - Expandable show card with hover effects (used on show listing pages)

### Image Utilities (`lib/utils/performanceImages.ts`)
- `getShowImageUrl(show, size)` - Returns `/api/images/{id}?size=sm|md|lg`
- `getShowThumbnailUrl(show)` - Returns small variant

### Key Patterns
- Server components fetch data directly via queries
- Forms use react-hook-form with zod validation (`lib/schemas/`)
- UI components use shadcn/ui (`components/ui/`)
- Rich text editing with TipTap (`components/WysiwygEditor.tsx`)
- Images stored as bytea in database with 3 sizes (sm/md/lg), served via `app/api/images/[id]/route.ts`
- Prices stored as `decimal(8,2)` or `decimal(10,2)` strings
- Full-width sections: Use `className="w-screen relative left-[calc(-50vw+50%)]"` to break out of container

## Environment Variables

Required in `.env.local`:
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET`, `NEXTAUTH_URL` - Auth configuration
- `MOLLIE_API_KEY` - Payment provider (use `USE_MOCK_PAYMENT=true` for dev)
- `SMTP_*` - Email configuration for tickets/notifications
- `NEXT_PUBLIC_BASE_URL` - Base URL for payment redirects
