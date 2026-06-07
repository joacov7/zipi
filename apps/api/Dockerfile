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
RUN cd apps/api && npx prisma generate && cd /app && pnpm --filter api build

# --- imagen final ---
FROM node:20-alpine
RUN npm install -g pnpm@10.33.0
WORKDIR /app
ENV NODE_ENV=production

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/
RUN pnpm install --frozen-lockfile --prod

COPY packages/shared ./packages/shared
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY apps/api/prisma ./apps/api/prisma

WORKDIR /app/apps/api
EXPOSE 4000

CMD ["sh", "-c", "pnpm exec prisma generate && pnpm exec prisma db push && node dist/main"]
