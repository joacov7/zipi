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
