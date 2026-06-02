// Pricing config (ARS)
export const PRICING = {
  REMIS: {
    BASE_FARE: 2500,
    PER_KM: 850,
    PER_MINUTE: 120,
  },
  MOTO: {
    BASE_FARE: 1500,
    PER_KM: 600,
    PER_MINUTE: 90,
  },
  // Fletes por tipo de camión
  FLETE: {
    PICKUP:       { BASE_FARE: 8_000,  PER_KM: 1_200 },
    SMALL_TRUCK:  { BASE_FARE: 15_000, PER_KM: 1_800 },
    LARGE_TRUCK:  { BASE_FARE: 25_000, PER_KM: 2_500 },
    SEMI:         { BASE_FARE: 45_000, PER_KM: 4_000 },
  },
  // Maquinaria pesada: se cobra base + por hora
  MACHINERY: {
    EXCAVATOR:      { BASE_FARE: 60_000, PER_HOUR: 18_000 },
    CRANE:          { BASE_FARE: 80_000, PER_HOUR: 25_000 },
    BULLDOZER:      { BASE_FARE: 55_000, PER_HOUR: 16_000 },
    FORKLIFT:       { BASE_FARE: 35_000, PER_HOUR: 10_000 },
    CONCRETE_MIXER: { BASE_FARE: 40_000, PER_HOUR: 12_000 },
    COMPACTOR:      { BASE_FARE: 30_000, PER_HOUR: 9_000 },
  },
} as const;

// Search radius for available drivers (km)
export const DRIVER_SEARCH_RADIUS_KM = 5;

// Default map center (Buenos Aires)
export const DEFAULT_MAP_CENTER = {
  lat: -34.6037,
  lng: -58.3816,
};

// Pagination defaults
export const DEFAULT_PAGE_SIZE = 20;

// Cancellation penalty (ARS) charged to passenger when cancelling after driver accepted
export const CANCELLATION_FEE_AFTER_ACCEPT = 1000;

// Surge pricing multipliers by hour (Argentina time, UTC-3)
export const SURGE_SCHEDULE: Array<{ hours: number[]; multiplier: number; label: string }> = [
  { hours: [7, 8, 9],        multiplier: 1.5, label: 'Hora pico mañana' },
  { hours: [17, 18, 19, 20], multiplier: 1.5, label: 'Hora pico tarde' },
  { hours: [23, 0, 1, 2],    multiplier: 1.3, label: 'Tarifa nocturna' },
];
