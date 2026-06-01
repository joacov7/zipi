export enum UserRole {
  PASSENGER = 'PASSENGER',
  DRIVER = 'DRIVER',
  ADMIN = 'ADMIN',
}

export enum VehicleType {
  CAR = 'CAR',
  MOTORCYCLE = 'MOTORCYCLE',
}

export enum TripStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum DeliveryStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  PICKED_UP = 'PICKED_UP',
  IN_TRANSIT = 'IN_TRANSIT',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

export enum ServiceType {
  REMIS = 'REMIS',
  MOTO = 'MOTO',
}

export enum SocketEvent {
  // Driver events
  DRIVER_LOCATION_UPDATE = 'driver:location:update',
  DRIVER_AVAILABLE = 'driver:available',
  DRIVER_OFFLINE = 'driver:offline',

  // Trip events
  TRIP_REQUEST = 'trip:request',
  TRIP_ACCEPTED = 'trip:accepted',
  TRIP_REJECTED = 'trip:rejected',
  TRIP_STARTED = 'trip:started',
  TRIP_COMPLETED = 'trip:completed',
  TRIP_CANCELLED = 'trip:cancelled',

  // Delivery events
  DELIVERY_REQUEST = 'delivery:request',
  DELIVERY_ACCEPTED = 'delivery:accepted',
  DELIVERY_REJECTED = 'delivery:rejected',
  DELIVERY_PICKED_UP = 'delivery:picked_up',
  DELIVERY_COMPLETED = 'delivery:completed',
  DELIVERY_CANCELLED = 'delivery:cancelled',

  // Location tracking
  LOCATION_UPDATE = 'location:update',
}
