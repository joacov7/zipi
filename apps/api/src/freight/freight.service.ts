import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { FreightStatus, FreightService, VehicleType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PRICING } from '@zipi/shared';
import {
  CreateFreightRequestDto,
  EstimateFreightDto,
  UpdateFreightStatusDto,
  RateFreightDto,
} from './dto/freight.dto';

@Injectable()
export class FreightService {
  constructor(private prisma: PrismaService) {}

  async estimatePrice(dto: EstimateFreightDto) {
    const distance = this.haversine(dto.pickupLat, dto.pickupLng, dto.dropoffLat, dto.dropoffLng);

    if (dto.serviceType === FreightService.FLETE) {
      const type = (dto.truckType as keyof typeof PRICING.FLETE) || 'SMALL_TRUCK';
      const config = PRICING.FLETE[type] ?? PRICING.FLETE.SMALL_TRUCK;
      const breakdown = {
        baseFare: config.BASE_FARE,
        distanceFare: Math.ceil(distance * config.PER_KM),
      };
      return {
        estimatedPrice: breakdown.baseFare + breakdown.distanceFare,
        distanceKm: Math.round(distance * 10) / 10,
        breakdown,
        notes: `Tarifa para ${this.truckTypeLabel(type)}`,
      };
    }

    // MACHINERY
    const type = (dto.machineryType as keyof typeof PRICING.MACHINERY) || 'EXCAVATOR';
    const config = PRICING.MACHINERY[type] ?? PRICING.MACHINERY.EXCAVATOR;
    const hours = dto.estimatedHours ?? 4;
    const breakdown = {
      baseFare: config.BASE_FARE,
      hourlyFare: Math.ceil(hours * config.PER_HOUR),
    };
    return {
      estimatedPrice: breakdown.baseFare + breakdown.hourlyFare,
      distanceKm: Math.round(distance * 10) / 10,
      estimatedHours: hours,
      breakdown,
      notes: `Tarifa para ${this.machineryLabel(type)} · ${hours}h estimadas`,
    };
  }

  async create(requesterId: string, dto: CreateFreightRequestDto) {
    const driver = await this.prisma.driver.findUnique({ where: { userId: requesterId } });
    if (driver) throw new ForbiddenException('Los conductores no pueden solicitar fletes');

    const distance = this.haversine(dto.pickupLat, dto.pickupLng, dto.dropoffLat, dto.dropoffLng);

    // Re-calculate price server-side using requester's data
    const estimate = await this.estimatePrice({
      pickupLat: dto.pickupLat,
      pickupLng: dto.pickupLng,
      dropoffLat: dto.dropoffLat,
      dropoffLng: dto.dropoffLng,
      serviceType: dto.serviceType,
    });

    return this.prisma.freightRequest.create({
      data: {
        requesterId,
        serviceType: dto.serviceType,
        pickupLat: dto.pickupLat,
        pickupLng: dto.pickupLng,
        pickupAddress: dto.pickupAddress,
        dropoffLat: dto.dropoffLat,
        dropoffLng: dto.dropoffLng,
        dropoffAddress: dto.dropoffAddress,
        cargoDescription: dto.cargoDescription,
        estimatedWeightTons: dto.estimatedWeightTons,
        estimatedHours: dto.estimatedHours,
        distanceKm: Math.round(distance * 10) / 10,
        requiresRefrigeration: dto.requiresRefrigeration ?? false,
        specialRequirements: dto.specialRequirements,
        estimatedPrice: estimate.estimatedPrice,
      },
      include: {
        requester: { select: { id: true, name: true, phone: true, avatarUrl: true } },
      },
    });
  }

  async findById(id: string) {
    const freight = await this.prisma.freightRequest.findUnique({
      where: { id },
      include: {
        requester: { select: { id: true, name: true, phone: true, avatarUrl: true } },
        driver: {
          include: { user: { select: { id: true, name: true, phone: true, avatarUrl: true } } },
        },
      },
    });
    if (!freight) throw new NotFoundException('Solicitud de flete no encontrada');
    return freight;
  }

  async accept(driverUserId: string, freightId: string) {
    const driver = await this.prisma.driver.findUnique({ where: { userId: driverUserId } });
    if (!driver) throw new NotFoundException('Conductor no encontrado');
    if (!driver.isVerified) throw new ForbiddenException('Tu cuenta no está verificada');
    if (!driver.isAvailable) throw new ForbiddenException('No estás disponible');
    if (![VehicleType.TRUCK, VehicleType.HEAVY_MACHINERY].includes(driver.vehicleType)) {
      throw new ForbiddenException('Solo conductores de camión/maquinaria pueden aceptar fletes');
    }

    const freight = await this.prisma.freightRequest.findUnique({ where: { id: freightId } });
    if (!freight) throw new NotFoundException('Solicitud no encontrada');
    if (freight.status !== FreightStatus.PENDING) {
      throw new BadRequestException('La solicitud ya no está disponible');
    }

    // Validate driver's vehicle matches service type
    if (
      freight.serviceType === FreightService.MACHINERY &&
      driver.vehicleType !== VehicleType.HEAVY_MACHINERY
    ) {
      throw new ForbiddenException('Esta solicitud es para maquinaria pesada');
    }
    if (
      freight.serviceType === FreightService.FLETE &&
      driver.vehicleType !== VehicleType.TRUCK
    ) {
      throw new ForbiddenException('Esta solicitud es para camiones de flete');
    }

    return this.prisma.freightRequest.update({
      where: { id: freightId },
      data: { driverId: driver.id, status: FreightStatus.ACCEPTED },
      include: {
        requester: { select: { id: true, name: true, phone: true, avatarUrl: true } },
        driver: { include: { user: { select: { id: true, name: true, phone: true, avatarUrl: true } } } },
      },
    });
  }

  async updateStatus(userId: string, freightId: string, dto: UpdateFreightStatusDto) {
    const freight = await this.findById(freightId);
    const driver = await this.prisma.driver.findUnique({ where: { userId } });
    const isDriver = driver && freight.driver?.id === driver.id;
    const isRequester = freight.requester.id === userId;

    if (!isDriver && !isRequester) throw new ForbiddenException('No autorizado');

    const validTransitions: Record<FreightStatus, FreightStatus[]> = {
      [FreightStatus.PENDING]: [FreightStatus.CANCELLED],
      [FreightStatus.ACCEPTED]: [FreightStatus.IN_PROGRESS, FreightStatus.CANCELLED],
      [FreightStatus.IN_PROGRESS]: [FreightStatus.COMPLETED, FreightStatus.CANCELLED],
      [FreightStatus.COMPLETED]: [],
      [FreightStatus.CANCELLED]: [],
    };

    if (!validTransitions[freight.status].includes(dto.status)) {
      throw new BadRequestException(`Transición inválida: ${freight.status} → ${dto.status}`);
    }

    const updateData: any = { status: dto.status };
    if (dto.cancelReason) updateData.cancelReason = dto.cancelReason;

    if (dto.status === FreightStatus.COMPLETED) {
      updateData.finalPrice = dto.finalPrice ?? freight.estimatedPrice;
      await this.prisma.driver.update({
        where: { id: driver!.id },
        data: { totalTrips: { increment: 1 } },
      });
    }

    return this.prisma.freightRequest.update({ where: { id: freightId }, data: updateData });
  }

  async rate(userId: string, freightId: string, dto: RateFreightDto) {
    const freight = await this.findById(freightId);
    if (freight.status !== FreightStatus.COMPLETED) {
      throw new BadRequestException('Solo podés calificar solicitudes completadas');
    }

    const driver = await this.prisma.driver.findUnique({ where: { userId } });
    const isRequester = freight.requester.id === userId;
    const isDriver = driver && freight.driver?.id === driver.id;

    if (!isRequester && !isDriver) throw new ForbiddenException('No autorizado');

    const updateData: any = isRequester
      ? { requesterRating: dto.rating }
      : { driverRating: dto.rating };

    return this.prisma.freightRequest.update({ where: { id: freightId }, data: updateData });
  }

  async getPending(serviceType?: FreightService) {
    return this.prisma.freightRequest.findMany({
      where: {
        status: FreightStatus.PENDING,
        ...(serviceType ? { serviceType } : {}),
      },
      include: {
        requester: { select: { id: true, name: true, avatarUrl: true, phone: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getMyRequests(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await this.prisma.$transaction([
      this.prisma.freightRequest.findMany({
        where: { requesterId: userId },
        include: {
          driver: { include: { user: { select: { id: true, name: true, phone: true, avatarUrl: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.freightRequest.count({ where: { requesterId: userId } }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getDriverFreights(driverUserId: string, page = 1, limit = 20) {
    const driver = await this.prisma.driver.findUnique({ where: { userId: driverUserId } });
    if (!driver) throw new NotFoundException('Conductor no encontrado');

    const skip = (page - 1) * limit;
    const [data, total] = await this.prisma.$transaction([
      this.prisma.freightRequest.findMany({
        where: { driverId: driver.id },
        include: { requester: { select: { id: true, name: true, phone: true, avatarUrl: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.freightRequest.count({ where: { driverId: driver.id } }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  private truckTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      PICKUP: 'Pickup',
      SMALL_TRUCK: 'Camión pequeño',
      LARGE_TRUCK: 'Camión grande',
      SEMI: 'Semi-remolque',
    };
    return labels[type] ?? type;
  }

  private machineryLabel(type: string): string {
    const labels: Record<string, string> = {
      EXCAVATOR: 'Excavadora',
      CRANE: 'Grúa',
      BULLDOZER: 'Topadora',
      FORKLIFT: 'Autoelevador',
      CONCRETE_MIXER: 'Hormigonera',
      COMPACTOR: 'Compactadora',
    };
    return labels[type] ?? type;
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
