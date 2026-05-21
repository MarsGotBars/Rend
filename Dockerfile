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
COPY . .

# Build args for env vars needed at build time
ARG PAYLOAD_SECRET=build-time-placeholder
ARG DATABASE_URL=file:./dev.db

ENV PAYLOAD_SECRET=${PAYLOAD_SECRET}
ENV DATABASE_URL=${DATABASE_URL}
ENV NODE_ENV=production
ENV NODE_OPTIONS=--no-deprecation

# Create empty database (needed for Payload init during prerender)
RUN touch dev.db

# Build Next.js (Payload CMS admin)
RUN pnpm run build:next

# Build SvelteKit (frontend)
RUN PAYLOAD_CONFIG_PATH=./app/cms/src/payload.config.ts pnpm run build:sveltekit

# Remove build cache (not needed at runtime)
RUN rm -rf /app/app/cms/.next/cache

# --- Production ---
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NODE_OPTIONS=--no-deprecation
ENV PORT=3000
ENV DATABASE_URL=file:/app/data/rend.db
ENV PAYLOAD_CONFIG_PATH=./app/cms/src/payload.config.ts

# Create non-root user
RUN groupadd --system --gid 1001 rend && \
    useradd --system --uid 1001 --gid rend rend

# Copy only what's needed at runtime
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/server.mjs ./server.mjs

# SvelteKit build output + static assets
COPY --from=builder /app/build ./build
COPY --from=builder /app/static ./static

# Next.js build output (full .next minus cache)
COPY --from=builder /app/app/cms/.next ./app/cms/.next

# Payload source (imported at runtime for config + collections)
COPY --from=builder /app/app/cms/src ./app/cms/src
COPY --from=builder /app/app/cms/package.json ./app/cms/package.json
COPY --from=builder /app/app/cms/next.config.ts ./app/cms/next.config.ts

# Persistent data directories
RUN mkdir -p /app/data /app/media && chown -R rend:rend /app/data /app/media

USER rend

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD node -e "fetch('http://localhost:3000/__health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

CMD ["node", "server.mjs"]
