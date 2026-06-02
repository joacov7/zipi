export enum UserRole {
  PASSENGER = 'PASSENGER',
  DRIVER = 'DRIVER',
  ADMIN = 'ADMIN',
  CONTRACTOR = 'CONTRACTOR',
}

export enum VehicleType {
  CAR = 'CAR',
  MOTORCYCLE = 'MOTORCYCLE',
  TRUCK = 'TRUCK',
  HEAVY_MACHINERY = 'HEAVY_MACHINERY',
}

export enum TruckType {
  PICKUP = 'PICKUP',
  SMALL_TRUCK = 'SMALL_TRUCK',
  LARGE_TRUCK = 'LARGE_TRUCK',
  SEMI = 'SEMI',
}

export enum MachineryType {
  EXCAVATOR = 'EXCAVATOR',
  CRANE = 'CRANE',
  BULLDOZER = 'BULLDOZER',
  FORKLIFT = 'FORKLIFT',
  CONCRETE_MIXER = 'CONCRETE_MIXER',
  COMPACTOR = 'COMPACTOR',
}

export enum FreightService {
  FLETE = 'FLETE',
  MACHINERY = 'MACHINERY',
}

export enum FreightStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
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
  FLETE = 'FLETE',
  MACHINERY = 'MACHINERY',
}

export enum ServiceUrgency {
  URGENT   = 'URGENT',
  NORMAL   = 'NORMAL',
  FLEXIBLE = 'FLEXIBLE',
}

export enum ServiceRequestStatus {
  OPEN        = 'OPEN',
  QUOTED      = 'QUOTED',
  ACCEPTED    = 'ACCEPTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED   = 'COMPLETED',
  CANCELLED   = 'CANCELLED',
  EXPIRED     = 'EXPIRED',
}

export enum QuoteStatus {
  PENDING   = 'PENDING',
  ACCEPTED  = 'ACCEPTED',
  REJECTED  = 'REJECTED',
  WITHDRAWN = 'WITHDRAWN',
}

export enum JobStatus {
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  PAID            = 'PAID',
  IN_PROGRESS     = 'IN_PROGRESS',
  COMPLETED       = 'COMPLETED',
  CANCELLED       = 'CANCELLED',
  DISPUTED        = 'DISPUTED',
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

  // Freight events
  FREIGHT_REQUEST = 'freight:request',
  FREIGHT_ACCEPTED = 'freight:accepted',
  FREIGHT_COMPLETED = 'freight:completed',
  FREIGHT_CANCELLED = 'freight:cancelled',

  // Location tracking
  LOCATION_UPDATE = 'location:update',

  // Chat
  CHAT_MESSAGE = 'chat:message',
}
