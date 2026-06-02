import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ZonesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.serviceZone.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async create(data: { name: string; centerLat: number; centerLng: number; radiusKm: number }) {
    return this.prisma.serviceZone.create({ data });
  }

  async update(id: string, data: Partial<{ name: string; centerLat: number; centerLng: number; radiusKm: number; isActive: boolean }>) {
    await this.prisma.serviceZone.findUniqueOrThrow({ where: { id } });
    return this.prisma.serviceZone.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.prisma.serviceZone.delete({ where: { id } });
  }

  async isWithinCoverage(lat: number, lng: number): Promise<boolean> {
    const zones = await this.prisma.serviceZone.findMany({ where: { isActive: true } });
    if (zones.length === 0) return true; // No zones configured = open coverage
    return zones.some((z) => this.haversine(lat, lng, z.centerLat, z.centerLng) <= z.radiusKm);
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
