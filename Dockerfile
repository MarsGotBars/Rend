# Rend - Combined SvelteKit + Payload CMS (Next.js) Server
# Builds both apps and runs them via the unified server.mjs

FROM node:22-slim AS base
RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@10 --activate

# --- Dependencies ---
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY app/cms/package.json ./app/cms/package.json
RUN pnpm install --frozen-lockfile

# --- Build ---
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/app/cms/node_modules ./app/cms/node_modules
COPY . .

# Build args for env vars needed at build time
ARG PAYLOAD_SECRET=build-time-placeholder
ARG DATABASE_URL=file:./dev.db

ENV PAYLOAD_SECRET=${PAYLOAD_SECRET}
ENV DATABASE_URL=${DATABASE_URL}
ENV NODE_ENV=production
ENV NODE_OPTIONS=--no-deprecation

# Create empty database if it doesn't exist (needed for prerender)
RUN touch dev.db

# Build Next.js (Payload CMS admin)
RUN pnpm run build:next

# Build SvelteKit (frontend) - needs PAYLOAD_CONFIG_PATH for entries() generation
RUN PAYLOAD_CONFIG_PATH=./app/cms/src/payload.config.ts pnpm run build:sveltekit

# --- Production ---
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NODE_OPTIONS=--no-deprecation
ENV PORT=3000

# Create non-root user
RUN groupadd --system --gid 1001 rend && \
    useradd --system --uid 1001 --gid rend rend

# Copy package files for runtime imports
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /app/.npmrc ./.npmrc

# Copy node_modules (needed for runtime: payload, next, dotenv, etc.)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/app/cms/node_modules ./app/cms/node_modules

# Copy the unified server
COPY --from=builder /app/server.mjs ./server.mjs
COPY --from=builder /app/.env ./.env

# Copy SvelteKit build output
COPY --from=builder /app/build ./build

# Copy Next.js build output + Payload source (needed for runtime config)
COPY --from=builder /app/app/cms/.next ./app/cms/.next
COPY --from=builder /app/app/cms/src ./app/cms/src
COPY --from=builder /app/app/cms/package.json ./app/cms/package.json
COPY --from=builder /app/app/cms/next.config.ts ./app/cms/next.config.ts

# Copy static assets
COPY --from=builder /app/static ./static

# Create directories for persistent data with correct permissions
RUN mkdir -p /app/data /app/media && chown -R rend:rend /app/data /app/media

# Database and media will be mounted as volumes
# Default database path points to persistent volume
ENV DATABASE_URL=file:/app/data/rend.db

USER rend

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD node -e "fetch('http://localhost:3000/__health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

CMD ["node", "server.mjs"]
