FROM node:20-alpine AS base
RUN npm install -g pnpm@10.33.0

# --- dependencias ---
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/
RUN pnpm install --frozen-lockfile

# --- build ---
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api
RUN cd apps/api && ./node_modules/.bin/prisma generate && cd /app && pnpm --filter api build

# --- imagen final ---
FROM node:20-alpine
RUN apk add --no-cache openssl
RUN npm install -g pnpm@10.33.0 prisma@5.22.0 ts-node@10.9.2
WORKDIR /app
ENV NODE_ENV=production

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/
RUN pnpm install --frozen-lockfile

COPY packages/shared ./packages/shared
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY apps/api/prisma ./apps/api/prisma

WORKDIR /app/apps/api
EXPOSE 4000

CMD ["sh", "-c", "prisma generate && prisma db push && ts-node prisma/seed.ts && node dist/main"]
