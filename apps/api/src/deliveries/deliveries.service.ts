import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { DeliveryStatus, VehicleType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateDeliveryDto,
  UpdateDeliveryStatusDto,
  RateDeliveryDto,
  EstimateDeliveryPriceDto,
} from './dto/delivery.dto';
import { PRICING } from '@zipi/shared';

@Injectable()
export class DeliveriesService {
  constructor(private prisma: PrismaService) {}

  async estimatePrice(dto: EstimateDeliveryPriceDto) {
    const distance = this.haversine(dto.pickupLat, dto.pickupLng, dto.dropoffLat, dto.dropoffLng);
    const estimatedMinutes = Math.ceil((distance / 35) * 60); // avg 35 km/h moto

    const { BASE_FARE, PER_KM, PER_MINUTE } = PRICING.MOTO;
    const breakdown = {
      baseFare: BASE_FARE,
      distanceFare: Math.ceil(distance * PER_KM),
      timeFare: Math.ceil(estimatedMinutes * PER_MINUTE),
    };
    const estimatedPrice = breakdown.baseFare + breakdown.distanceFare + breakdown.timeFare;

    return { estimatedPrice, estimatedMinutes, distanceKm: Math.round(distance * 10) / 10, breakdown };
  }

  async create(senderId: string, dto: CreateDeliveryDto) {
    const estimate = await this.estimatePrice({
      pickupLat: dto.pickupLat,
      pickupLng: dto.pickupLng,
      dropoffLat: dto.dropoffLat,
      dropoffLng: dto.dropoffLng,
    });

    return this.prisma.delivery.create({
      data: {
        senderId,
        ...dto,
        estimatedPrice: estimate.estimatedPrice,
      },
      include: {
        sender: { select: { id: true, name: true, phone: true, avatarUrl: true } },
      },
    });
  }

  async findById(id: string) {
    const delivery = await this.prisma.delivery.findUnique({
      where: { id },
      include: {
        sender: { select: { id: true, name: true, phone: true, avatarUrl: true } },
        driver: {
          include: { user: { select: { id: true, name: true, phone: true, avatarUrl: true } } },
        },
      },
    });
    if (!delivery) throw new NotFoundException('Envío no encontrado');
    return delivery;
  }

  async acceptDelivery(driverUserId: string, deliveryId: string) {
    const driver = await this.prisma.driver.findUnique({ where: { userId: driverUserId } });
    if (!driver) throw new NotFoundException('Conductor no encontrado');
    if (driver.vehicleType !== VehicleType.MOTORCYCLE) {
      throw new ForbiddenException('Solo los motociclistas pueden aceptar envíos');
    }
    if (!driver.isAvailable) throw new ForbiddenException('No estás disponible');

    const delivery = await this.prisma.delivery.findUnique({ where: { id: deliveryId } });
    if (!delivery) throw new NotFoundException('Envío no encontrado');
    if (delivery.status !== DeliveryStatus.PENDING) {
      throw new BadRequestException('El envío ya no está disponible');
    }

    return this.prisma.delivery.update({
      where: { id: deliveryId },
      data: { driverId: driver.id, status: DeliveryStatus.ACCEPTED },
      include: {
        sender: { select: { id: true, name: true, phone: true, avatarUrl: true } },
        driver: { include: { user: { select: { id: true, name: true, phone: true, avatarUrl: true } } } },
      },
    });
  }

  async updateStatus(userId: string, deliveryId: string, dto: UpdateDeliveryStatusDto) {
    const delivery = await this.findById(deliveryId);

    const driver = await this.prisma.driver.findUnique({ where: { userId } });
    const isDriver = driver && delivery.driver?.id === driver.id;
    const isSender = delivery.sender.id === userId;

    if (!isDriver && !isSender) throw new ForbiddenException('No autorizado');

    const validTransitions: Record<DeliveryStatus, DeliveryStatus[]> = {
      [DeliveryStatus.PENDING]: [DeliveryStatus.CANCELLED],
      [DeliveryStatus.ACCEPTED]: [DeliveryStatus.PICKED_UP, DeliveryStatus.CANCELLED],
      [DeliveryStatus.PICKED_UP]: [DeliveryStatus.IN_TRANSIT],
      [DeliveryStatus.IN_TRANSIT]: [DeliveryStatus.DELIVERED, DeliveryStatus.CANCELLED],
      [DeliveryStatus.DELIVERED]: [],
      [DeliveryStatus.CANCELLED]: [],
    };

    if (!validTransitions[delivery.status].includes(dto.status)) {
      throw new BadRequestException(`No se puede cambiar de ${delivery.status} a ${dto.status}`);
    }

    const updateData: any = { status: dto.status };
    if (dto.cancelReason) updateData.cancelReason = dto.cancelReason;
    if (dto.status === DeliveryStatus.DELIVERED) {
      updateData.finalPrice = delivery.estimatedPrice;
      await this.prisma.driver.update({
        where: { id: driver!.id },
        data: { totalTrips: { increment: 1 } },
      });
    }

    return this.prisma.delivery.update({ where: { id: deliveryId }, data: updateData });
  }

  async rateDelivery(userId: string, deliveryId: string, dto: RateDeliveryDto) {
    const delivery = await this.findById(deliveryId);
    if (delivery.status !== DeliveryStatus.DELIVERED) {
      throw new BadRequestException('Solo podés calificar envíos completados');
    }

    const driver = await this.prisma.driver.findUnique({ where: { userId } });
    const isSender = delivery.sender.id === userId;
    const isDriver = driver && delivery.driver?.id === driver.id;

    if (!isSender && !isDriver) throw new ForbiddenException('No autorizado');

    const updateData: any = isSender
      ? { senderRating: dto.rating }
      : { driverRating: dto.rating };

    return this.prisma.delivery.update({ where: { id: deliveryId }, data: updateData });
  }

  async getPendingDeliveries() {
    return this.prisma.delivery.findMany({
      where: { status: DeliveryStatus.PENDING },
      include: {
        sender: { select: { id: true, name: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
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
