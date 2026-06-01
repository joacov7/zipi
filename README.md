# Zipi 🚕🛵

Plataforma de remisería y motomandado inspirada en Uber. Monorepo con backend NestJS, web React y mobile Expo.

## Stack

| App | Tecnología |
|-----|-----------|
| **API** | NestJS + Prisma + PostgreSQL + Socket.io + JWT |
| **Web** | React 18 + TypeScript + Vite + TailwindCSS |
| **Mobile** | Expo + React Native + TypeScript |
| **Shared** | Tipos y constantes compartidos (TypeScript) |
| **Monorepo** | Turborepo + pnpm workspaces |

## Estructura

```
zipi/
├── apps/
│   ├── api/          # Backend NestJS (puerto 3000)
│   ├── web/          # Frontend React (puerto 5173)
│   └── mobile/       # App Expo React Native
├── packages/
│   └── shared/       # Tipos, enums y constantes compartidas
├── turbo.json
└── pnpm-workspace.yaml
```

## Módulos

### Pasajero / Cliente
- Registro e inicio de sesión
- Pedir un remis (con estimación de precio y tiempo)
- Pedir motomandado (envío de paquetes en moto)
- Tracking en tiempo real del conductor
- Historial de viajes y envíos
- Calificar al conductor

### Conductor
- Perfil con datos del vehículo
- Toggle de disponibilidad
- Ver y aceptar viajes pendientes (remises)
- Ver y aceptar envíos pendientes (motomandado)
- Historial de viajes
- Tracking en tiempo real vía WebSocket

### Administrador
- Dashboard con estadísticas en tiempo real
- Gestión de usuarios (activar/desactivar)
- Verificación de conductores
- Listado de viajes por estado
- Métricas de ingresos

## Inicio rápido

### Requisitos
- Node.js >= 20
- pnpm >= 9
- PostgreSQL

### 1. Instalar dependencias

```bash
pnpm install
```

### 2. Configurar variables de entorno

```bash
cp apps/api/.env.example apps/api/.env
# Editá apps/api/.env con tus valores
```

### 3. Inicializar base de datos

```bash
cd apps/api
pnpm prisma db push
pnpm prisma:seed
```

### 4. Levantar el proyecto

```bash
# Desde la raíz del monorepo
pnpm dev
```

- API: http://localhost:3000
- Swagger: http://localhost:3000/api/docs
- Web: http://localhost:5173

### Mobile

```bash
cd apps/mobile
npx expo start
```

## Cuentas de prueba

| Rol | Email | Password |
|-----|-------|----------|
| Admin | admin@zipi.ar | Password123! |
| Pasajero | juan@example.com | Password123! |
| Conductor (auto) | carlos@example.com | Password123! |
| Conductor (moto) | miguel@example.com | Password123! |

## API Endpoints principales

### Auth
- `POST /api/auth/register` — Registro
- `POST /api/auth/login` — Login
- `POST /api/auth/refresh` — Renovar token
- `POST /api/auth/logout` — Logout

### Viajes (Remisería)
- `POST /api/trips/estimate` — Estimar precio
- `POST /api/trips` — Solicitar viaje
- `GET /api/trips/pending` — Ver viajes pendientes
- `POST /api/trips/:id/accept` — Aceptar viaje
- `PATCH /api/trips/:id/status` — Cambiar estado

### Envíos (Motomandado)
- `POST /api/deliveries/estimate` — Estimar precio
- `POST /api/deliveries` — Solicitar envío
- `GET /api/deliveries/pending` — Ver envíos pendientes
- `POST /api/deliveries/:id/accept` — Aceptar envío

### Admin
- `GET /api/admin/stats` — Estadísticas
- `GET /api/admin/users` — Listar usuarios
- `GET /api/admin/drivers` — Listar conductores
- `POST /api/admin/drivers/:id/verify` — Verificar conductor

## Tarifas (ARS)

| Servicio | Tarifa base | Por km | Por minuto |
|----------|------------|--------|------------|
| Remis | $2.500 | $850 | $120 |
| Motomandado | $1.500 | $600 | $90 |

## WebSockets

Eventos principales:
- `driver:location:update` — Actualizar posición del conductor
- `trip:request` — Nuevo viaje disponible
- `trip:accepted` — Viaje aceptado por conductor
- `delivery:request` — Nuevo envío disponible
- `location:update` — Posición del conductor en tiempo real
