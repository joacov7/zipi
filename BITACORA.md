# Bitácora de desarrollo — Zipi

## Descripción del proyecto
App de ride-sharing y servicios para Argentina (Buenos Aires). Soporta viajes en remis, moto-mandados, fletes, alquiler de maquinaria y marketplace de contratistas. Comunicación en tiempo real via WebSocket.

**Stack:** NestJS API + Prisma + PostgreSQL | React + Vite web | Expo/React Native mobile | Turborepo monorepo | pnpm

---

## Entorno de desarrollo (Windows)

- **API:** `pnpm --filter api dev` → corre en `http://0.0.0.0:4000`
- **Web:** `pnpm --filter web dev` → corre en `http://localhost:4001`
- **Mobile:** antes de iniciar, setear variable de entorno en PowerShell:
  ```powershell
  $env:EXPO_PUBLIC_API_URL = "http://<IP_LAN>:4000/api"
  pnpm --filter @zipi/mobile start
  ```
  Usar IP de LAN (ej. `10.0.0.206`), no `localhost` (en dispositivo físico apunta al celular).
- **Base de datos:** PostgreSQL instalado directamente en Windows (Docker Desktop tuvo problemas con Linux engine).
- **Firewall:** Se agregó regla para permitir entrada en puerto 4000 desde la LAN.

---

## Cambios realizados

### API (`apps/api`)

#### `src/main.ts`
- Cambiado `app.listen(port)` → `app.listen(port, '0.0.0.0')` para escuchar en todas las interfaces de red (antes solo IPv6 loopback, el celular no podía conectar).

#### `src/common/filters/all-exceptions.filter.ts`
- **Bug crítico resuelto:** `AllExceptionsFilter` enviaba el objeto completo de `HttpException.getResponse()` como campo `message` en la respuesta JSON. Esto causaba:
  1. Crash en React Native: `"Value for message cannot be cast from ReadableNativeMap to String"`
  2. El helper `apiError()` no podía parsear el mensaje real, mostrando fallback genérico ("Error al registrarse")
- **Fix:** Se extrae correctamente el mensaje plano (string o string[]) del objeto anidado `{statusCode, message, error}`.

---

### Mobile (`apps/mobile`)

#### `src/services/api.ts`
- Puerto por defecto cambiado de `3000` → `4000`.

#### `src/hooks/useExpoNotifications.ts`
- En Expo Go (SDK 53+) se quitó el soporte de push notifications remotas.
- Fix: detectar Expo Go con `Constants.appOwnership === 'expo'` y saltear todo el código de notificaciones.

#### `src/utils/error.ts` *(archivo nuevo)*
- Helper `apiError(err, fallback)` para convertir errores de Axios a string legible.
- Maneja `message: string[]` (errores de validación de NestJS class-validator) uniéndolos con `\n`.

#### `app/(auth)/login.tsx`
- Logo: fondo `#1A1714` con letra "Z" naranja.
- Botón: `#1A1714` (antes naranja).
- Usa `apiError(err, 'Credenciales incorrectas')`.

#### `app/(auth)/register.tsx`
- Botón: `#1A1714`.
- Rol activo: borde oscuro en vez de naranja.
- Usa `apiError(err, 'Error al registrarse')`.

#### `app/(passenger)/_layout.tsx` *(archivo nuevo)*
- Tab bar inferior con 4 pestañas: Inicio, Actividad, Billetera, Perfil.
- Pantallas ocultas (request-trip, etc.) usan `href: null`.
- `useSafeAreaInsets` para padding sobre botones de sistema de Android.

#### `app/(passenger)/home.tsx`
- Header claro (`#f9fafb`) con texto oscuro.
- Bloque hero CTA con círculos decorativos (estilo web).
- Grid de servicios: Motomandado, Fletes, Viajes compartidos.
- Puntos naranjas para viajes recientes, precios en naranja.

#### `app/(passenger)/profile.tsx` *(archivo nuevo)*
- Muestra info del usuario, menú de opciones, logout con confirmación.
- Avatar de iniciales del nombre.

#### `app/(passenger)/wallet.tsx` *(archivo nuevo)*
- Card de saldo en header oscuro + lista de transacciones via `GET /wallet`.

#### `app/(passenger)/activity.tsx` *(archivo nuevo)*
- Historial de viajes via `GET /users/me/trips?limit=50`.
- Badges de estado con colores.

#### `app/(passenger)/request-trip.tsx`
- Geocodificación de destino: extrae `city` del GPS inverso y lo agrega al string de búsqueda (`${destAddress}, ${city}`) para mayor precisión.
- Botón primario: `#1A1714`.
- Usa `apiError` en los catch.

#### `app/(passenger)/request-delivery.tsx`
- Botón `#1A1714`; precio en `#EF9008`; `apiError` en catches.

#### `app/(passenger)/request-freight.tsx`
- Botón `#1A1714`; botón de hora activo `#1A1714`; total en `#EF9008`; `apiError` en catches.

#### `app/(passenger)/shared-trips.tsx`
- Corregidos error handlers con `apiError`.

#### `app/(passenger)/shared-trip-detail.tsx`
- Corregido error handler: `apiError(err, 'No se pudo solicitar el lugar')`.

#### `app/(driver)/home.tsx`
- Header: `#1A1714` (antes naranja).
- Botón setup: `#1A1714`.

#### `app/(driver)/profile.tsx`
- Botón: `#1A1714`.
- `onError`: usa `apiError(err, 'Error al guardar')`.

---

### Web (`apps/web`)

#### `src/pages/passenger/PassengerHome.tsx`
- Gradiente del hero: `#EF9008` → `#1A1714`.
- Ícono lupa: naranja → `#1A1714`.

#### `src/pages/passenger/WalletPage.tsx`
- Gradiente + sombra de la card de saldo: naranja → `#1A1714`.

#### `src/pages/passenger/TripTracking.tsx`
- Emoji 🎉 → `<DuoIcon name="check" />` verde.
- ⭐ en botón de calificación → `<DuoIcon name="star" />`.
- Ícono de estrella en card de conductor → DuoIcon.

#### `src/pages/passenger/SharedTripDetailPage.tsx`
- Estrellas de calificación: carácter ★ → `<DuoIcon name="star" />` con fill dinámico.
- Botón volver: circular con DuoIcon arrowLeft.

---

## Errores encontrados y soluciones

| Error | Causa | Solución |
|-------|-------|----------|
| `pnpm: El término no se reconoce` | pnpm no instalado | `iwr https://get.pnpm.io/install.ps1 -useb \| iex` |
| `expo not recognized` | dependencias no instaladas | `pnpm install` desde la raíz |
| `expo-notifications` crash en Expo Go | SDK 53+ removió push en Expo Go | Detectar con `Constants.appOwnership === 'expo'` y saltear |
| "Credenciales incorrectas" en red local | `EXPO_PUBLIC_API_URL` indefinida | Setear en PowerShell antes de `expo start` |
| `ERR_CONNECTION_REFUSED` desde celular | API solo en IPv6 + Firewall bloqueando | `listen(port, '0.0.0.0')` + regla de firewall en puerto 4000 |
| Docker Desktop no conecta | Linux engine no arranca en Windows | Instalar PostgreSQL directamente en Windows |
| `PRISMA_CLIENT_NOT_FOUND` | Cliente no generado | `pnpm --filter api prisma:generate` |
| Geocodificación de destino incorrecta | Sin contexto de ciudad en la búsqueda | Extraer ciudad del GPS y agregar al string de búsqueda |
| `ReadableNativeMap cannot be cast to String` | `AllExceptionsFilter` enviaba objeto como `message` | Extraer string plano del response de HttpException |
| "Error al registrarse" genérico | `apiError()` no podía parsear objeto anidado | Fix en `AllExceptionsFilter` + `apiError` helper |

---

### Landing page (`apps/web/src/pages/landing/LandingPage.tsx`) *(nuevo)*
- Página pública en `/` para usuarios no autenticados
- Secciones: hero (#1A1714 + #EF9008), 3 servicios (Remis, Moto mandados, Fletes), cómo funciona, CTA conductor, footer
- Usuarios autenticados en `/` son redirigidos a su dashboard por rol

### Sistema de módulos

#### API (`apps/api/src/settings/`)
- Nuevo módulo NestJS: `SettingsModule` con controller y service
- `GET /settings/modules` — público, devuelve estado de cada módulo
- `PATCH /settings/modules/:key` — admin, activa/desactiva un módulo
- `AppSetting` model en Prisma (`key` PK, `value` string, `updatedAt`)
- Se inicializa con todos los módulos activos en `onModuleInit`

#### Shared (`packages/shared/src/enums.ts`)
- Nuevo enum `AppModule`: `REMIS`, `MOTO_DELIVERY`, `FREIGHT`, `SHARED_TRIPS`, `SERVICES`

#### Web admin (`apps/web/src/pages/admin/AdminModules.tsx`) *(nuevo)*
- Página en `/admin/modules` con toggle switches para cada módulo
- Actualización en tiempo real via React Query
- Agregado al nav del admin en Layout.tsx

#### Web hook (`apps/web/src/hooks/useModuleSettings.ts`) *(nuevo)*
- `useModuleSettings()` — fetcha `/settings/modules` con staleTime 30s
- Layout sidebar de pasajero filtra ítems según módulos habilitados

#### Mobile hook (`apps/mobile/src/hooks/useModuleSettings.ts`) *(nuevo)*
- `useModuleSettings()` y `useModule(key)` helpers
- Home screen del pasajero oculta Hero CTA, cards de servicios y viajes compartidos según estado del módulo

---

## Pendientes / Próximas funcionalidades

- [ ] **Selector de cantidad de pasajeros** en solicitud de viaje (mobile + web + backend)
- [ ] Verificar que registro de nuevos usuarios muestre error real si el email/teléfono ya existe
- [ ] Testing end-to-end del flujo de registro y login con el fix de `AllExceptionsFilter`
- [ ] Correr `pnpm --filter api prisma:push` en producción para crear la tabla `app_settings`
