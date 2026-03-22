# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app

# Copy workspace package manifests (all three needed for npm ci)
COPY package.json package-lock.json ./
COPY shared/package.json shared/
COPY web/package.json web/
COPY worker/package.json worker/

RUN npm ci

# Copy source for shared and web
COPY shared shared
COPY web web

# Build-time public env vars (baked into the Next.js bundle)
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_BASE_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL

# Dummy DATABASE_URL so Next.js static page collection doesn't fail at build time.
# The real value is injected at runtime via env_file and overrides this.
ARG DATABASE_URL=postgresql://placeholder:placeholder@localhost:5432/placeholder
ENV DATABASE_URL=$DATABASE_URL

# Build Next.js (standalone output)
RUN npm run build --workspace=web

# Stage 2: Production
# With outputFileTracingRoot set to the monorepo root, Next.js standalone traces
# all dependencies (including shared/) and outputs them under web/.next/standalone/.
# The server entry point lands at web/.next/standalone/web/server.js.
FROM node:20-alpine AS production
WORKDIR /app

# curl for healthchecks
RUN apk add --no-cache curl

# Copy the self-contained standalone server (includes its own node_modules)
COPY --from=builder /app/web/.next/standalone ./

# Static assets and public folder must be copied alongside the standalone server
COPY --from=builder /app/web/.next/static web/.next/static
COPY --from=builder /app/web/public web/public

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

EXPOSE 3000
CMD ["node", "web/server.js"]
