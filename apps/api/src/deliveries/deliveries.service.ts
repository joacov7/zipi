import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { DeliveryStatus, WalletTransactionType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PricingService } from '../pricing/pricing.service';
import { DispatchService } from '../dispatch/dispatch.service';
import { WalletService } from '../wallet/wallet.service';
import {
  CreateDeliveryDto,
  UpdateDeliveryStatusDto,
  RateDeliveryDto,
  EstimateDeliveryPriceDto,
} from './dto/delivery.dto';

@Injectable()
export class DeliveriesService {
  constructor(
    private prisma: PrismaService,
    private pricing: PricingService,
    private dispatch: DispatchService,
    private wallet: WalletService,
  ) {}

  async estimatePrice(dto: EstimateDeliveryPriceDto) {
    const distance = this.haversine(dto.pickupLat, dto.pickupLng, dto.dropoffLat, dto.dropoffLng);
    const estimatedMinutes = Math.ceil((distance / 35) * 60);

    const fare = await this.pricing.getFareConfig('MOTO');
    if (!fare) throw new BadRequestException('Configuración de tarifas no disponible');

    const estimatedPrice = Math.ceil(this.pricing.calculateFare('MOTO', fare, distance, estimatedMinutes));

    return {
      estimatedPrice,
      estimatedMinutes,
      distanceKm: Math.round(distance * 10) / 10,
      breakdown: {
        baseFare: fare.baseFare,
        distanceFare: Math.ceil(distance * fare.perKm),
        timeFare: Math.ceil(estimatedMinutes * fare.perMinute),
      },
    };
  }

  async create(senderId: string, dto: CreateDeliveryDto) {
    const estimate = await this.estimatePrice({
      pickupLat: dto.pickupLat,
      pickupLng: dto.pickupLng,
      dropoffLat: dto.dropoffLat,
      dropoffLng: dto.dropoffLng,
    });

    const delivery = await this.prisma.delivery.create({
      data: {
        senderId,
        pickupLat: dto.pickupLat,
        pickupLng: dto.pickupLng,
        pickupAddress: dto.pickupAddress,
        dropoffLat: dto.dropoffLat,
        dropoffLng: dto.dropoffLng,
        dropoffAddress: dto.dropoffAddress,
        packageDescription: dto.packageDescription,
        recipientName: dto.recipientName,
        recipientPhone: dto.recipientPhone,
        estimatedPrice: estimate.estimatedPrice,
      },
      include: {
        sender: { select: { id: true, name: true, phone: true, avatarUrl: true } },
      },
    });

    // Fire-and-forget auto-dispatch
    this.dispatch.dispatchDelivery(delivery.id).catch(() => {});

    return delivery;
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
      const finalPrice = delivery.estimatedPrice;
      const commissionCfg = await this.pricing.getCommissionConfig('MOTO');
      const commissionPct = commissionCfg?.percentage ?? 12;
      const { commissionRate, commissionAmount, driverPayout } = this.pricing.calculateCommission(finalPrice, commissionPct);

      updateData.finalPrice = finalPrice;
      updateData.commissionRate = commissionRate;
      updateData.commissionAmount = commissionAmount;
      updateData.driverPayout = driverPayout;

      await this.prisma.driver.update({
        where: { id: driver!.id },
        data: { totalTrips: { increment: 1 }, isAvailable: true },
      });

      await this.wallet.credit(
        delivery.driver!.user.id,
        driverPayout,
        WalletTransactionType.DRIVER_PAYOUT,
        `Pago envío ${deliveryId.slice(-6).toUpperCase()}`,
        deliveryId,
      );
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

    const updateData: any = isSender ? { senderRating: dto.rating } : { driverRating: dto.rating };
    return this.prisma.delivery.update({ where: { id: deliveryId }, data: updateData });
  }

  async getPendingDeliveries() {
    return this.prisma.delivery.findMany({
      where: { status: DeliveryStatus.PENDING },
      include: { sender: { select: { id: true, name: true, avatarUrl: true } } },
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
