import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { TripStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTripDto, UpdateTripStatusDto, RateTripDto, EstimatePriceDto } from './dto/trip.dto';
import { PRICING } from '@zipi/shared';

@Injectable()
export class TripsService {
  constructor(private prisma: PrismaService) {}

  async estimatePrice(dto: EstimatePriceDto) {
    const distance = this.haversine(dto.originLat, dto.originLng, dto.destLat, dto.destLng);
    const estimatedMinutes = Math.ceil((distance / 30) * 60); // avg 30 km/h in city

    const { BASE_FARE, PER_KM, PER_MINUTE } = PRICING.REMIS;
    const breakdown = {
      baseFare: BASE_FARE,
      distanceFare: Math.ceil(distance * PER_KM),
      timeFare: Math.ceil(estimatedMinutes * PER_MINUTE),
    };
    const estimatedPrice = breakdown.baseFare + breakdown.distanceFare + breakdown.timeFare;

    return { estimatedPrice, estimatedMinutes, distanceKm: Math.round(distance * 10) / 10, breakdown };
  }

  async create(passengerId: string, dto: CreateTripDto) {
    const estimate = await this.estimatePrice({
      originLat: dto.originLat,
      originLng: dto.originLng,
      destLat: dto.destLat,
      destLng: dto.destLng,
    });

    return this.prisma.trip.create({
      data: {
        passengerId,
        ...dto,
        estimatedPrice: estimate.estimatedPrice,
        estimatedMinutes: estimate.estimatedMinutes,
        distanceKm: estimate.distanceKm,
      },
      include: {
        passenger: { select: { id: true, name: true, phone: true, avatarUrl: true } },
      },
    });
  }

  async findById(id: string) {
    const trip = await this.prisma.trip.findUnique({
      where: { id },
      include: {
        passenger: { select: { id: true, name: true, phone: true, avatarUrl: true } },
        driver: {
          include: { user: { select: { id: true, name: true, phone: true, avatarUrl: true } } },
        },
      },
    });
    if (!trip) throw new NotFoundException('Viaje no encontrado');
    return trip;
  }

  async acceptTrip(driverUserId: string, tripId: string) {
    const driver = await this.prisma.driver.findUnique({ where: { userId: driverUserId } });
    if (!driver) throw new NotFoundException('Conductor no encontrado');
    if (!driver.isAvailable) throw new ForbiddenException('No estás disponible');

    const trip = await this.prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) throw new NotFoundException('Viaje no encontrado');
    if (trip.status !== TripStatus.PENDING) {
      throw new BadRequestException('El viaje ya no está disponible');
    }

    return this.prisma.trip.update({
      where: { id: tripId },
      data: { driverId: driver.id, status: TripStatus.ACCEPTED },
      include: {
        passenger: { select: { id: true, name: true, phone: true, avatarUrl: true } },
        driver: { include: { user: { select: { id: true, name: true, phone: true, avatarUrl: true } } } },
      },
    });
  }

  async updateStatus(userId: string, tripId: string, dto: UpdateTripStatusDto) {
    const trip = await this.findById(tripId);

    const driver = await this.prisma.driver.findUnique({ where: { userId } });
    const isDriver = driver && trip.driver?.id === driver.id;
    const isPassenger = trip.passenger.id === userId;

    if (!isDriver && !isPassenger) throw new ForbiddenException('No autorizado');

    const validTransitions: Record<TripStatus, TripStatus[]> = {
      [TripStatus.PENDING]: [TripStatus.CANCELLED],
      [TripStatus.ACCEPTED]: [TripStatus.IN_PROGRESS, TripStatus.CANCELLED],
      [TripStatus.IN_PROGRESS]: [TripStatus.COMPLETED, TripStatus.CANCELLED],
      [TripStatus.COMPLETED]: [],
      [TripStatus.CANCELLED]: [],
    };

    if (!validTransitions[trip.status].includes(dto.status)) {
      throw new BadRequestException(`No se puede cambiar de ${trip.status} a ${dto.status}`);
    }

    const updateData: any = { status: dto.status };
    if (dto.cancelReason) updateData.cancelReason = dto.cancelReason;
    if (dto.status === TripStatus.COMPLETED) {
      updateData.finalPrice = trip.estimatedPrice;
      await this.prisma.driver.update({
        where: { id: driver!.id },
        data: { totalTrips: { increment: 1 } },
      });
    }

    return this.prisma.trip.update({ where: { id: tripId }, data: updateData });
  }

  async rateTrip(userId: string, tripId: string, dto: RateTripDto) {
    const trip = await this.findById(tripId);
    if (trip.status !== TripStatus.COMPLETED) {
      throw new BadRequestException('Solo podés calificar viajes completados');
    }

    const driver = await this.prisma.driver.findUnique({ where: { userId } });
    const isPassenger = trip.passenger.id === userId;
    const isDriver = driver && trip.driver?.id === driver.id;

    if (!isPassenger && !isDriver) throw new ForbiddenException('No autorizado');

    const updateData: any = isPassenger
      ? { passengerRating: dto.rating }
      : { driverRating: dto.rating };

    const updatedTrip = await this.prisma.trip.update({ where: { id: tripId }, data: updateData });

    if (isPassenger && trip.driver) {
      await this.updateDriverRating(trip.driver.id);
    }

    return updatedTrip;
  }

  async getPendingTrips(vehicleType?: string) {
    return this.prisma.trip.findMany({
      where: { status: TripStatus.PENDING },
      include: {
        passenger: { select: { id: true, name: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  private async updateDriverRating(driverId: string) {
    const trips = await this.prisma.trip.findMany({
      where: { driverId, passengerRating: { not: null } },
      select: { passengerRating: true },
    });
    if (!trips.length) return;
    const avg = trips.reduce((s, t) => s + t.passengerRating!, 0) / trips.length;
    await this.prisma.driver.update({ where: { id: driverId }, data: { rating: avg } });
  }

  private haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
}
