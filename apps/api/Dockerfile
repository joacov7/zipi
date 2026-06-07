FROM node:20-alpine
RUN apk add --no-cache openssl
RUN npm install -g pnpm@10.33.0 prisma@5.22.0 ts-node@10.9.2

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/
RUN pnpm install --frozen-lockfile

COPY packages/shared ./packages/shared
COPY apps/api ./apps/api

WORKDIR /app
RUN pnpm --filter api prisma:generate && pnpm --filter api build && echo "=== dist ===" && ls apps/api/dist/

WORKDIR /app/apps/api
EXPOSE 4000

CMD ["sh", "-c", "prisma db push && ts-node --transpile-only --compiler-options '{\"module\":\"CommonJS\"}' prisma/seed.ts && node /app/apps/api/dist/main"]
