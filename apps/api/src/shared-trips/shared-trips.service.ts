import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SharedTripStatus, ParticipantStatus } from '@prisma/client';
import { CreateSharedTripDto } from './dto/shared-trip.dto';
import { NotificationsService } from '../notifications/notifications.service';

const INCLUDE_FULL = {
  publisher: { select: { id: true, name: true, phone: true, avatarUrl: true } },
  participants: {
    include: { user: { select: { id: true, name: true, avatarUrl: true } } },
    orderBy: { createdAt: 'asc' as const },
  },
};

@Injectable()
export class SharedTripsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async create(publisherId: string, dto: CreateSharedTripDto) {
    const costPerSeat = Math.ceil(dto.totalCost / dto.totalSeats);
    return this.prisma.sharedTrip.create({
      data: {
        publisherId,
        originAddress: dto.originAddress,
        originLat: dto.originLat,
        originLng: dto.originLng,
        destAddress: dto.destAddress,
        destLat: dto.destLat,
        destLng: dto.destLng,
        departureTime: new Date(dto.departureTime),
        totalSeats: dto.totalSeats,
        costPerSeat,
        description: dto.description,
      },
      include: INCLUDE_FULL,
    });
  }

  async findAll() {
    return this.prisma.sharedTrip.findMany({
      where: { status: SharedTripStatus.OPEN, departureTime: { gt: new Date() } },
      include: INCLUDE_FULL,
      orderBy: { departureTime: 'asc' },
    });
  }

  async findMine(userId: string) {
    const [published, joined] = await Promise.all([
      this.prisma.sharedTrip.findMany({
        where: { publisherId: userId },
        include: INCLUDE_FULL,
        orderBy: { departureTime: 'desc' },
      }),
      this.prisma.sharedTripParticipant.findMany({
        where: { userId, status: { not: ParticipantStatus.CANCELLED } },
        include: {
          sharedTrip: { include: INCLUDE_FULL },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);
    return { published, joined: joined.map((p) => p.sharedTrip) };
  }

  async findById(id: string) {
    const trip = await this.prisma.sharedTrip.findUnique({ where: { id }, include: INCLUDE_FULL });
    if (!trip) throw new NotFoundException('Viaje compartido no encontrado');
    return trip;
  }

  async join(tripId: string, userId: string) {
    const trip = await this.findById(tripId);

    if (trip.publisherId === userId) {
      throw new BadRequestException('No podés unirte a tu propio viaje');
    }
    if (trip.status !== SharedTripStatus.OPEN) {
      throw new BadRequestException('Este viaje ya no está disponible');
    }

    const confirmedCount = trip.participants.filter(
      (p) => p.status === ParticipantStatus.CONFIRMED,
    ).length;
    if (confirmedCount >= trip.totalSeats) {
      throw new BadRequestException('No hay asientos disponibles');
    }

    const existing = trip.participants.find((p) => p.userId === userId);
    if (existing && existing.status !== ParticipantStatus.CANCELLED) {
      throw new BadRequestException('Ya estás en este viaje');
    }

    const participant = await this.prisma.sharedTripParticipant.upsert({
      where: { sharedTripId_userId: { sharedTripId: tripId, userId } },
      create: { sharedTripId: tripId, userId, status: ParticipantStatus.PENDING },
      update: { status: ParticipantStatus.PENDING },
    });

    // Notify publisher
    this.notifications.sendToUser(
      trip.publisherId,
      'Nueva solicitud de viaje',
      `Alguien quiere unirse a tu viaje a ${trip.destAddress}`,
      { sharedTripId: tripId },
    );

    return participant;
  }

  async respondToParticipant(
    tripId: string,
    publisherId: string,
    participantUserId: string,
    accept: boolean,
  ) {
    const trip = await this.findById(tripId);
    if (trip.publisherId !== publisherId) throw new ForbiddenException('No autorizado');

    const newStatus = accept ? ParticipantStatus.CONFIRMED : ParticipantStatus.CANCELLED;

    const updated = await this.prisma.sharedTripParticipant.update({
      where: { sharedTripId_userId: { sharedTripId: tripId, userId: participantUserId } },
      data: { status: newStatus },
    });

    // Check if trip is now full
    if (accept) {
      const confirmedCount = trip.participants.filter(
        (p) => p.status === ParticipantStatus.CONFIRMED || p.userId === participantUserId,
      ).length;
      if (confirmedCount >= trip.totalSeats) {
        await this.prisma.sharedTrip.update({
          where: { id: tripId },
          data: { status: SharedTripStatus.FULL },
        });
      }
    }

    this.notifications.sendToUser(
      participantUserId,
      accept ? '¡Solicitud aceptada!' : 'Solicitud rechazada',
      accept
        ? `Tu lugar en el viaje a ${trip.destAddress} fue confirmado`
        : `Tu solicitud para el viaje a ${trip.destAddress} fue rechazada`,
      { sharedTripId: tripId },
    );

    return updated;
  }

  async leave(tripId: string, userId: string) {
    const trip = await this.findById(tripId);
    const participant = trip.participants.find((p) => p.userId === userId);
    if (!participant) throw new NotFoundException('No estás en este viaje');

    await this.prisma.sharedTripParticipant.update({
      where: { sharedTripId_userId: { sharedTripId: tripId, userId } },
      data: { status: ParticipantStatus.CANCELLED },
    });

    // Reopen if was full
    if (trip.status === SharedTripStatus.FULL) {
      await this.prisma.sharedTrip.update({ where: { id: tripId }, data: { status: SharedTripStatus.OPEN } });
    }

    this.notifications.sendToUser(
      trip.publisherId,
      'Un pasajero abandonó el viaje',
      `Un pasajero salió del viaje a ${trip.destAddress}`,
      { sharedTripId: tripId },
    );
  }

  async cancel(tripId: string, publisherId: string) {
    const trip = await this.findById(tripId);
    if (trip.publisherId !== publisherId) throw new ForbiddenException('No autorizado');

    await this.prisma.sharedTrip.update({
      where: { id: tripId },
      data: { status: SharedTripStatus.CANCELLED },
    });

    const confirmedIds = trip.participants
      .filter((p) => p.status === ParticipantStatus.CONFIRMED)
      .map((p) => p.userId);

    if (confirmedIds.length) {
      await this.notifications.sendToUsers(
        confirmedIds,
        'Viaje cancelado',
        `El viaje a ${trip.destAddress} fue cancelado`,
        { sharedTripId: tripId },
      );
    }
  }
}
