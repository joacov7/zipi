import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateDriverProfileDto,
  UpdateLocationDto,
  ToggleAvailabilityDto,
  NearbyDriversDto,
} from './dto/driver.dto';

@Injectable()
export class DriversService {
  constructor(private prisma: PrismaService) {}

  async createProfile(userId: string, dto: CreateDriverProfileDto) {
    const existing = await this.prisma.driver.findUnique({ where: { userId } });
    if (existing) throw new ConflictException('Ya tenés un perfil de conductor');

    return this.prisma.driver.create({
      data: { userId, ...dto },
      include: { user: { select: { id: true, name: true, email: true, phone: true } } },
    });
  }

  async getMyProfile(userId: string) {
    const driver = await this.prisma.driver.findUnique({
      where: { userId },
      include: { user: { select: { id: true, name: true, email: true, phone: true, avatarUrl: true } } },
    });
    if (!driver) throw new NotFoundException('Perfil de conductor no encontrado');
    return driver;
  }

  async updateLocation(userId: string, dto: UpdateLocationDto) {
    const driver = await this.prisma.driver.findUnique({ where: { userId } });
    if (!driver) throw new NotFoundException('Conductor no encontrado');

    return this.prisma.driver.update({
      where: { userId },
      data: { currentLat: dto.lat, currentLng: dto.lng, currentHeading: dto.heading },
    });
  }

  async toggleAvailability(userId: string, dto: ToggleAvailabilityDto) {
    const driver = await this.prisma.driver.findUnique({ where: { userId } });
    if (!driver) throw new NotFoundException('Conductor no encontrado');
    if (!driver.isVerified) throw new ForbiddenException('Tu cuenta no está verificada aún');

    return this.prisma.driver.update({
      where: { userId },
      data: { isAvailable: dto.isAvailable },
    });
  }

  async findNearby(dto: NearbyDriversDto) {
    const radius = dto.radiusKm ?? 5;
    // Haversine approximation: 1 degree lat ≈ 111km
    const latDelta = radius / 111;
    const lngDelta = radius / (111 * Math.cos((dto.lat * Math.PI) / 180));

    const drivers = await this.prisma.driver.findMany({
      where: {
        isAvailable: true,
        isVerified: true,
        currentLat: { gte: dto.lat - latDelta, lte: dto.lat + latDelta },
        currentLng: { gte: dto.lng - lngDelta, lte: dto.lng + lngDelta },
        ...(dto.vehicleType ? { vehicleType: dto.vehicleType } : {}),
      },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true, phone: true } },
      },
    });

    return drivers.map((d) => ({
      ...d,
      distanceKm: this.haversine(dto.lat, dto.lng, d.currentLat!, d.currentLng!),
    })).sort((a, b) => a.distanceKm - b.distanceKm);
  }

  async getDriverTrips(userId: string, page = 1, limit = 20) {
    const driver = await this.prisma.driver.findUnique({ where: { userId } });
    if (!driver) throw new NotFoundException('Conductor no encontrado');

    const skip = (page - 1) * limit;
    const [trips, total] = await this.prisma.$transaction([
      this.prisma.trip.findMany({
        where: { driverId: driver.id },
        include: { passenger: { select: { id: true, name: true, phone: true, avatarUrl: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.trip.count({ where: { driverId: driver.id } }),
    ]);

    return { data: trips, total, page, limit, totalPages: Math.ceil(total / limit) };
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
