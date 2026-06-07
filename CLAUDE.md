# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What is Zipi

Ride-sharing and services marketplace for Argentina (Buenos Aires). Supports remis trips, moto deliveries, freight transport (fletes), heavy machinery rentals, and a contractor marketplace. Uses real-time WebSocket communication between drivers and passengers.

## Monorepo structure

```
apps/api      – NestJS REST + WebSocket API (port 4000)
apps/web      – React + Vite + Tailwind web app (port 4001)
apps/mobile   – Expo / React Native app (Expo Router)
packages/shared – Shared TypeScript types, enums, constants
```

**Package manager:** pnpm only (`only-allow pnpm` preinstall guard). Never use npm or yarn.

## Commands

### Root (run all apps)
```bash
pnpm dev          # start all apps via Turborepo
pnpm build        # build all
pnpm lint         # lint all
pnpm format       # prettier format
```

### API (`apps/api`)
```bash
pnpm --filter api dev               # ts-node --transpile-only src/main.ts
pnpm --filter api build             # nest build → dist/
pnpm --filter api start             # node dist/main (production)
pnpm --filter api lint              # eslint
pnpm --filter api test              # jest

pnpm --filter api prisma:push       # prisma db push (apply schema without migration)
pnpm --filter api prisma:migrate    # prisma migrate dev
pnpm --filter api prisma:generate   # regenerate Prisma client
pnpm --filter api prisma:studio     # open Prisma Studio
pnpm --filter api prisma:seed       # run prisma/seed.ts
```

### Web (`apps/web`)
```bash
pnpm --filter web dev     # vite dev server on port 4001
pnpm --filter web build   # tsc + vite build
pnpm --filter web lint    # tsc --noEmit
```

### Mobile (`apps/mobile`)
```bash
pnpm --filter @zipi/mobile start    # expo start
pnpm --filter @zipi/mobile android  # expo start --android
pnpm --filter @zipi/mobile ios      # expo start --ios
pnpm --filter @zipi/mobile lint     # tsc --noEmit
```

## Required environment files

### `apps/api/.env`
```
DATABASE_URL="postgresql://USER@HOST/zipi_db?schema=public"
JWT_SECRET="<random hex 32>"
JWT_REFRESH_SECRET="<random hex 32>"
PORT=4000
CORS_ORIGINS="http://localhost:4001"
```
After creating or modifying the schema, always run `prisma db push` or `prisma migrate dev`.

### `apps/mobile/.env`
```
EXPO_PUBLIC_API_URL=http://<LAN_IP>:4000/api
```
`localhost` on a physical device points to the phone itself, not the dev machine.

## Architecture

### API (NestJS)

Standard NestJS module pattern. Each domain has `module / controller / service / dto` under `src/<domain>/`.

**Modules:** auth, users, drivers, trips, deliveries, freight, services (contractor marketplace), shared-trips, admin, wallet, discounts, zones, notifications, gateway (WebSocket), prisma, chat.

**Auth flow:** JWT (access + refresh tokens). Guards: `JwtAuthGuard` (default), `RolesGuard`. Decorators: `@CurrentUser()`, `@Roles(UserRole.ADMIN)`. Global rate limit: 100 req / 60s.

**WebSocket:** `events.gateway.ts` in `src/gateway/` handles all real-time events (driver location, trip status, etc.). Socket events are defined in `packages/shared/src/enums.ts` → `SocketEvent` enum.

**Pricing:** All pricing logic uses constants from `packages/shared/src/constants.ts` → `PRICING` object. Surge multipliers come from `SURGE_SCHEDULE`.

### Web (React + Vite)

- **State:** Zustand stores in `src/stores/`
- **Data fetching:** TanStack Query via `src/lib/api.ts` (axios)
- **Routing:** React Router; route structure mirrors `src/pages/<role>/`
- **Styles:** Tailwind with custom Zipi tokens (color palette defined in `tailwind.config.js`); font is Hanken Grotesk
- **API proxy:** Vite proxies `/api` → `localhost:4000` and `/socket.io` → `localhost:4000` (with WebSocket support)

Page groups by user role:
- `pages/auth/` – login, register
- `pages/passenger/` – home map, trip/delivery/freight request, tracking, wallet, profile, shared trips
- `pages/driver/` – home (availability toggle + map), profile setup, history
- `pages/admin/` – users, drivers (verification), trips, discounts, zones dashboards
- `pages/contractor/` – profile, dashboard
- `pages/services/` – request service, browse services, my requests

### Mobile (Expo + React Native)

- **Routing:** Expo Router with grouped layouts: `(auth)/`, `(driver)/`, `(passenger)/`
- **State:** Zustand stores in `src/stores/` (same pattern as web)
- **Data fetching:** TanStack Query via `src/services/api.ts` (axios, uses `EXPO_PUBLIC_API_URL`)
- **Push notifications:** `src/hooks/useExpoNotifications.ts` — registers Expo push token and POSTs to `/notifications/token`
- **Maps:** `react-native-maps`
- **Path alias:** `@` → `./src` (via `babel-plugin-module-resolver`)

### Shared package (`packages/shared`)

Single source of truth for types, enums, and constants used by both web and mobile.

- `enums.ts` — all domain enums + `SocketEvent` enum (20+ real-time events)
- `types.ts` — `UserPublic`, `DriverPublic`, `TripDto`, socket payloads, response wrappers
- `constants.ts` — `PRICING`, `DEFAULT_MAP_CENTER` (Buenos Aires), `DRIVER_SEARCH_RADIUS_KM`, `SURGE_SCHEDULE`

Import from `@zipi/shared` in both apps.

## Database (Prisma + PostgreSQL)

Key relations:
- `User` 1→1 `Driver` (optional; only when role=DRIVER)
- `User` 1→1 `ContractorProfile` (optional; only when role=CONTRACTOR)
- `Trip` / `Delivery` / `FreightRequest` / `ServiceJob` all link to both a `User` (requester) and a `Driver` / `ContractorProfile`
- Driver status flow: register profile → `isVerified=false` (admin reviews) → admin sets `isVerified=true` → driver can toggle `isAvailable`

Schema changes require `pnpm --filter api prisma:push` (dev) or `prisma migrate dev` (with migration file).

## Working branch

All changes go to `claude/uber-clone-remiseria-a6Vun`.
