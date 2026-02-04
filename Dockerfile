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

# Build Next.js
RUN npm run build --workspace=web

# Stage 2: Production
FROM node:20-alpine AS production
WORKDIR /app

# Install production deps
COPY package.json package-lock.json ./
COPY shared/package.json shared/
COPY web/package.json web/
COPY worker/package.json worker/
RUN npm ci --omit=dev

# Shared source (resolved via symlink in node_modules)
COPY shared/lib shared/lib

# Next.js build output + static assets
COPY --from=builder /app/web/.next web/.next
COPY --from=builder /app/web/public web/public
COPY web/next.config.ts web/

WORKDIR /app/web
EXPOSE 3000
CMD ["npm", "run", "start"]
