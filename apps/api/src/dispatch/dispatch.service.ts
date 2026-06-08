import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../gateway/events.gateway';
import { SocketEvent } from '@zipi/shared';

const OFFER_TIMEOUT_MS = 15_000;
const MAX_SEARCH_RADIUS_KM = 10;

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

@Injectable()
export class DispatchService {
  private activeOffers = new Map<string, NodeJS.Timeout>(); // offerId -> timeout handle

  constructor(
    private prisma: PrismaService,
    private gateway: EventsGateway,
  ) {}

  async dispatchTrip(tripId: string) {
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      include: { passenger: { select: { name: true } } },
    });
    if (!trip || trip.status !== 'PENDING') return;

    await this.findAndOfferNextDriver(tripId, 'trip', trip.originLat, trip.originLng);
  }

  async dispatchDelivery(deliveryId: string) {
    const delivery = await this.prisma.delivery.findUnique({ where: { id: deliveryId } });
    if (!delivery || delivery.status !== 'PENDING') return;

    await this.findAndOfferNextDriver(deliveryId, 'delivery', delivery.pickupLat, delivery.pickupLng);
  }

  private async findAndOfferNextDriver(
    jobId: string,
    jobType: 'trip' | 'delivery',
    lat: number,
    lng: number,
  ) {
    const alreadyOffered = await this.prisma.driverOffer.findMany({
      where: jobType === 'trip' ? { tripId: jobId } : { deliveryId: jobId },
      select: { driverId: true },
    });
    const excludedDriverIds = alreadyOffered.map((o) => o.driverId);

    const vehicleFilter = jobType === 'trip'
      ? { vehicleType: { in: ['CAR' as const] } }
      : { vehicleType: { in: ['MOTORCYCLE' as const, 'CAR' as const] } };

    const candidates = await this.prisma.driver.findMany({
      where: {
        isAvailable: true,
        isVerified: true,
        currentLat: { not: null },
        currentLng: { not: null },
        id: { notIn: excludedDriverIds },
        ...vehicleFilter,
      },
      select: { id: true, userId: true, currentLat: true, currentLng: true, rating: true },
    });

    const nearby = candidates
      .map((d) => ({
        ...d,
        distKm: haversineKm(lat, lng, d.currentLat!, d.currentLng!),
      }))
      .filter((d) => d.distKm <= MAX_SEARCH_RADIUS_KM)
      .sort((a, b) => a.distKm - b.distKm || b.rating - a.rating);

    if (nearby.length === 0) {
      await this.noDriversAvailable(jobId, jobType);
      return;
    }

    const chosen = nearby[0];
    const expiresAt = new Date(Date.now() + OFFER_TIMEOUT_MS);

    const offer = await this.prisma.driverOffer.create({
      data: {
        driverId: chosen.id,
        ...(jobType === 'trip' ? { tripId: jobId } : { deliveryId: jobId }),
        expiresAt,
      },
    });

    await this.prisma[jobType === 'trip' ? 'trip' : 'delivery'].update({
      where: { id: jobId },
      data: { dispatchAttempts: { increment: 1 } },
    });

    this.gateway.emitToDriver(chosen.userId, SocketEvent.TRIP_REQUEST, {
      offerId: offer.id,
      jobType,
      jobId,
    });

    const handle = setTimeout(() => this.handleOfferTimeout(offer.id, jobId, jobType, lat, lng), OFFER_TIMEOUT_MS);
    this.activeOffers.set(offer.id, handle);
  }

  async acceptOffer(offerId: string, driverUserId: string): Promise<boolean> {
    const driver = await this.prisma.driver.findUnique({ where: { userId: driverUserId }, select: { id: true } });
    if (!driver) return false;

    const offer = await this.prisma.driverOffer.findFirst({
      where: { id: offerId, driverId: driver.id, status: 'PENDING' },
    });
    if (!offer || offer.expiresAt < new Date()) return false;

    this.clearOfferTimeout(offerId);

    await this.prisma.driverOffer.update({
      where: { id: offerId },
      data: { status: 'ACCEPTED', respondedAt: new Date() },
    });

    if (offer.tripId) {
      const trip = await this.prisma.trip.update({
        where: { id: offer.tripId },
        data: { driverId: driver.id, status: 'ACCEPTED' },
        include: { passenger: { select: { id: true } } },
      });
      await this.prisma.driver.update({ where: { id: driver.id }, data: { isAvailable: false } });
      this.gateway.emitToUser(trip.passenger.id, SocketEvent.TRIP_ACCEPTED, { tripId: trip.id, driverId: driver.id });
    } else if (offer.deliveryId) {
      const delivery = await this.prisma.delivery.update({
        where: { id: offer.deliveryId },
        data: { driverId: driver.id, status: 'ACCEPTED' },
        include: { sender: { select: { id: true } } },
      });
      await this.prisma.driver.update({ where: { id: driver.id }, data: { isAvailable: false } });
      this.gateway.emitToUser(delivery.sender.id, SocketEvent.TRIP_ACCEPTED, { deliveryId: delivery.id, driverId: driver.id });
    }

    return true;
  }

  async rejectOffer(offerId: string, driverUserId: string): Promise<boolean> {
    const driver = await this.prisma.driver.findUnique({ where: { userId: driverUserId }, select: { id: true } });
    if (!driver) return false;

    const offer = await this.prisma.driverOffer.findFirst({
      where: { id: offerId, driverId: driver.id, status: 'PENDING' },
    });
    if (!offer) return false;

    this.clearOfferTimeout(offerId);
    await this.prisma.driverOffer.update({
      where: { id: offerId },
      data: { status: 'REJECTED', respondedAt: new Date() },
    });

    if (offer.tripId) {
      const trip = await this.prisma.trip.findUnique({ where: { id: offer.tripId }, select: { originLat: true, originLng: true } });
      if (trip) await this.findAndOfferNextDriver(offer.tripId, 'trip', trip.originLat, trip.originLng);
    } else if (offer.deliveryId) {
      const delivery = await this.prisma.delivery.findUnique({ where: { id: offer.deliveryId }, select: { pickupLat: true, pickupLng: true } });
      if (delivery) await this.findAndOfferNextDriver(offer.deliveryId, 'delivery', delivery.pickupLat, delivery.pickupLng);
    }

    return true;
  }

  private async handleOfferTimeout(offerId: string, jobId: string, jobType: 'trip' | 'delivery', lat: number, lng: number) {
    this.activeOffers.delete(offerId);
    const offer = await this.prisma.driverOffer.findUnique({ where: { id: offerId } });
    if (!offer || offer.status !== 'PENDING') return;

    await this.prisma.driverOffer.update({ where: { id: offerId }, data: { status: 'TIMEOUT' } });
    await this.findAndOfferNextDriver(jobId, jobType, lat, lng);
  }

  private clearOfferTimeout(offerId: string) {
    const handle = this.activeOffers.get(offerId);
    if (handle) { clearTimeout(handle); this.activeOffers.delete(offerId); }
  }

  private async noDriversAvailable(jobId: string, jobType: 'trip' | 'delivery') {
    if (jobType === 'trip') {
      const trip = await this.prisma.trip.findUnique({ where: { id: jobId }, select: { passengerId: true } });
      if (trip) this.gateway.emitToUser(trip.passengerId, 'no_drivers_available', { tripId: jobId });
    } else {
      const delivery = await this.prisma.delivery.findUnique({ where: { id: jobId }, select: { senderId: true } });
      if (delivery) this.gateway.emitToUser(delivery.senderId, 'no_drivers_available', { deliveryId: jobId });
    }
  }
}
