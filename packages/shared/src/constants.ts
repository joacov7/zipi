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
