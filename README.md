[No content]

# Ons Mierloos Theater

This is a full-stack web application for managing theater shows, ticket sales, and administration. Built with Next.js, TypeScript, Drizzle ORM, Tailwind CSS, and Docker.

## Features

- **Performance Management:** Add, edit, and view theater performances.
- **Admin Panel:** Manage performances and users.
- **Authentication:** Secure login via NextAuth.
- **Shopping Cart:** Users can add tickets to their cart and checkout.
- **File Uploads:** Upload images for performances.
- **Database Migrations:** Schema managed with Drizzle ORM.

## Project Structure

- `app/` — Next.js app directory with pages and API routes
  - `admin/` — Admin dashboard and performance management
  - `checkout/` — Ticket checkout page
  - `performances/` — Performance details and listings
  - `api/` — API routes for authentication and uploads
- `components/` — Reusable React components (forms, cards, context, etc.)
- `drizzle/` — Database schema and migrations
- `lib/` — Database connection, queries, and utility functions
- `public/` — Static assets and uploaded images

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- Docker (for local database)

### Installation

1. Clone the repository:
   ```sh
   git clone <repo-url>
   cd ons-mierloos-theater
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Copy `.env.example` to `.env` and fill in required environment variables.
4. Start the database with Docker Compose:
   ```sh
   docker-compose up -d --build db
   ```
5. Run database migrations (if needed):
   ```sh
   npm run migrate
   ```
6. Start the development server:
   ```sh
   npm run dev
   ```

## Usage

- Visit `http://localhost:3000` to view the app.
- Admin panel is at `/admin` (requires authentication).
- Performances are listed at `/performances`.
- Checkout is at `/checkout`.

## Environment Variables

Create a `.env` file based on `.env.example` and set values for:

- `DATABASE_URL` — Database connection string
- `NEXTAUTH_SECRET` — Secret for NextAuth
- `NEXTAUTH_URL` — Base URL for authentication

## Scripts

- `npm run dev` — Start development server
- `npm run build` — Build for production
- `npm run start` — Start production server
- `npm run migrate` — Run database migrations

## Technologies Used

- Next.js
- TypeScript
- Drizzle ORM
- Tailwind CSS
- Docker
- NextAuth

## Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

## License

MIT
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
