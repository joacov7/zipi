import {
  DeliveryStatus,
  FreightService,
  FreightStatus,
  MachineryType,
  ServiceType,
  TripStatus,
  TruckType,
  UserRole,
  VehicleType,
} from './enums';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Address {
  coords: Coordinates;
  formatted: string;
}

export interface UserPublic {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  avatarUrl?: string;
  referralCode?: string;
  walletBalance?: number;
  cuit?: string;
  createdAt: string;
}

export interface DriverPublic {
  id: string;
  user: UserPublic;
  vehicleType: VehicleType;
  vehiclePlate: string;
  vehicleModel: string;
  licenseNumber: string;
  habilitacion: string;
  seguro: string;
  rating: number;
  totalTrips: number;
  isAvailable: boolean;
  currentLocation?: Coordinates;
}

export interface TripDto {
  id: string;
  passenger: UserPublic;
  driver?: DriverPublic;
  origin: Address;
  destination: Address;
  status: TripStatus;
  estimatedPrice: number;
  finalPrice?: number;
  estimatedMinutes?: number;
  distanceKm?: number;
  rating?: number;
  createdAt: string;
  updatedAt: string;
}

export interface DeliveryDto {
  id: string;
  sender: UserPublic;
  driver?: DriverPublic;
  pickup: Address;
  dropoff: Address;
  packageDescription: string;
  recipientName: string;
  recipientPhone: string;
  status: DeliveryStatus;
  estimatedPrice: number;
  finalPrice?: number;
  rating?: number;
  createdAt: string;
  updatedAt: string;
}

// Socket payloads
export interface LocationUpdatePayload {
  driverId: string;
  coords: Coordinates;
  heading?: number;
  speed?: number;
}

export interface TripRequestPayload {
  serviceType: ServiceType;
  origin: Address;
  destination: Address;
  estimatedPrice: number;
}

export interface DeliveryRequestPayload {
  pickup: Address;
  dropoff: Address;
  packageDescription: string;
  recipientName: string;
  recipientPhone: string;
  estimatedPrice: number;
}

// API responses
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: UserPublic;
}

// Pricing
export interface PriceEstimate {
  estimatedPrice: number;
  estimatedMinutes: number;
  distanceKm: number;
  breakdown: {
    baseFare: number;
    distanceFare: number;
    timeFare: number;
  };
}

// Freight (camiones y maquinaria)
export interface FreightRequestDto {
  id: string;
  requester: UserPublic;
  driver?: DriverPublic;
  serviceType: FreightService;
  pickupAddress: string;
  dropoffAddress: string;
  cargoDescription: string;
  estimatedWeightTons?: number;
  estimatedHours?: number;
  distanceKm?: number;
  requiresRefrigeration: boolean;
  specialRequirements?: string;
  status: FreightStatus;
  estimatedPrice: number;
  finalPrice?: number;
  requesterRating?: number;
  driverRating?: number;
  cancelReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FreightPriceEstimate {
  estimatedPrice: number;
  distanceKm: number;
  breakdown: {
    baseFare: number;
    distanceFare: number;
    hourlyFare?: number;
  };
  notes?: string;
}
