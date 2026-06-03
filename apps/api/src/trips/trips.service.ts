import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { TripStatus, WalletTransactionType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ZonesService } from '../zones/zones.service';
import { DiscountsService } from '../discounts/discounts.service';
import { WalletService } from '../wallet/wallet.service';
import { CreateTripDto, UpdateTripStatusDto, RateTripDto, EstimatePriceDto } from './dto/trip.dto';
import { PRICING, SURGE_SCHEDULE, CANCELLATION_FEE_AFTER_ACCEPT } from '@zipi/shared';

@Injectable()
export class TripsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
    private zones: ZonesService,
    private discounts: DiscountsService,
    private wallet: WalletService,
  ) {}

  getSurgeMultiplier(): { multiplier: number; label: string | null } {
    // Argentina is UTC-3
    const argHour = new Date(Date.now() - 3 * 60 * 60 * 1000).getUTCHours();
    for (const { hours, multiplier, label } of SURGE_SCHEDULE) {
      if (hours.includes(argHour)) return { multiplier, label };
    }
    return { multiplier: 1.0, label: null };
  }

  async estimatePrice(dto: EstimatePriceDto) {
    const distance = this.haversine(dto.originLat, dto.originLng, dto.destLat, dto.destLng);
    const estimatedMinutes = Math.ceil((distance / 30) * 60);

    const { BASE_FARE, PER_KM, PER_MINUTE } = PRICING.REMIS;
    const breakdown = {
      baseFare: BASE_FARE,
      distanceFare: Math.ceil(distance * PER_KM),
      timeFare: Math.ceil(estimatedMinutes * PER_MINUTE),
    };
    const basePrice = breakdown.baseFare + breakdown.distanceFare + breakdown.timeFare;
    const { multiplier: surgeMultiplier, label: surgeLabel } = this.getSurgeMultiplier();
    const estimatedPrice = Math.ceil(basePrice * surgeMultiplier);

    return {
      estimatedPrice,
      estimatedMinutes,
      distanceKm: Math.round(distance * 10) / 10,
      breakdown,
      surgeMultiplier,
      surgeLabel,
    };
  }

  async create(passengerId: string, dto: CreateTripDto) {
    const withinCoverage = await this.zones.isWithinCoverage(dto.originLat, dto.originLng);
    if (!withinCoverage) {
      throw new BadRequestException('Tu ubicación está fuera de nuestra zona de cobertura');
    }

    const estimate = await this.estimatePrice({
      originLat: dto.originLat,
      originLng: dto.originLng,
      destLat: dto.destLat,
      destLng: dto.destLng,
    });

    let discountAmount = 0;
    let appliedCode: string | undefined;

    if (dto.discountCode) {
      const result = await this.discounts.validate(dto.discountCode, estimate.estimatedPrice);
      discountAmount = result.discountAmount;
      appliedCode = dto.discountCode.toUpperCase();
      await this.discounts.redeem(appliedCode);
    }

    const finalEstimatedPrice = Math.max(0, estimate.estimatedPrice - discountAmount);

    // Determine wallet credits to apply
    let walletCreditsUsed = 0;
    if (dto.useWalletCredits) {
      const { balance } = await this.wallet.getBalance(passengerId);
      walletCreditsUsed = Math.min(balance, finalEstimatedPrice);
    }

    const trip = await this.prisma.trip.create({
      data: {
        passengerId,
        originLat: dto.originLat,
        originLng: dto.originLng,
        originAddress: dto.originAddress,
        destLat: dto.destLat,
        destLng: dto.destLng,
        destAddress: dto.destAddress,
        estimatedPrice: finalEstimatedPrice,
        estimatedMinutes: estimate.estimatedMinutes,
        distanceKm: estimate.distanceKm,
        surgeMultiplier: estimate.surgeMultiplier,
        discountCode: appliedCode,
        discountAmount: discountAmount > 0 ? discountAmount : undefined,
        walletCreditsUsed,
      },
      include: {
        passenger: { select: { id: true, name: true, phone: true, avatarUrl: true } },
      },
    });

    if (walletCreditsUsed > 0) {
      await this.wallet.debit(
        passengerId,
        walletCreditsUsed,
        `Créditos viaje ${trip.id.slice(-6).toUpperCase()}`,
        trip.id,
      );
    }

    return trip;
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

    const updated = await this.prisma.trip.update({
      where: { id: tripId },
      data: { driverId: driver.id, status: TripStatus.ACCEPTED },
      include: {
        passenger: { select: { id: true, name: true, phone: true, avatarUrl: true } },
        driver: { include: { user: { select: { id: true, name: true, phone: true, avatarUrl: true } } } },
      },
    });

    this.notifications.sendToUser(
      trip.passengerId,
      '¡Conductor en camino!',
      `${updated.driver!.user.name} aceptó tu viaje y está en camino`,
      { tripId },
    );

    return updated;
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

    if (dto.status === TripStatus.CANCELLED) {
      updateData.cancelledBy = userId;
      if (trip.status === TripStatus.ACCEPTED && isPassenger) {
        updateData.cancellationFee = CANCELLATION_FEE_AFTER_ACCEPT;
      }
      // Refund wallet credits on cancellation
      if ((trip as any).walletCreditsUsed > 0) {
        await this.wallet.credit(
          trip.passengerId,
          (trip as any).walletCreditsUsed,
          WalletTransactionType.CREDIT,
          `Reembolso viaje cancelado ${tripId.slice(-6).toUpperCase()}`,
          tripId,
        );
      }
    }

    if (dto.status === TripStatus.COMPLETED) {
      updateData.finalPrice = trip.estimatedPrice;
      await this.prisma.driver.update({
        where: { id: driver!.id },
        data: { totalTrips: { increment: 1 } },
      });
    }

    const result = await this.prisma.trip.update({ where: { id: tripId }, data: updateData });

    if (dto.status === TripStatus.IN_PROGRESS) {
      this.notifications.sendToUser(
        trip.passenger.id,
        '¡Viaje iniciado!',
        'Tu viaje ha comenzado. ¡Buen viaje!',
        { tripId },
      );
    } else if (dto.status === TripStatus.COMPLETED) {
      this.notifications.sendToUser(
        trip.passenger.id,
        '¡Llegaste!',
        `Tu viaje ha finalizado. Precio: $${trip.estimatedPrice}`,
        { tripId },
      );
    } else if (dto.status === TripStatus.CANCELLED) {
      const otherUserId = isDriver ? trip.passenger.id : trip.driver?.user.id;
      if (otherUserId) {
        this.notifications.sendToUser(
          otherUserId,
          'Viaje cancelado',
          dto.cancelReason || 'El viaje fue cancelado',
          { tripId },
        );
      }
    }

    return result;
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

  async getActiveTrip(driverUserId: string) {
    const driver = await this.prisma.driver.findUnique({ where: { userId: driverUserId } });
    if (!driver) return null;
    return this.prisma.trip.findFirst({
      where: {
        driverId: driver.id,
        status: { in: [TripStatus.ACCEPTED, TripStatus.IN_PROGRESS] },
      },
      include: {
        passenger: { select: { id: true, name: true, phone: true, avatarUrl: true } },
      },
    });
  }

  async getPendingTrips() {
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
