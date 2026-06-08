import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const FARE_DEFAULTS = {
  REMIS: { baseFare: 500, perKm: 120, perMinute: 15, minimumFare: 800, nightMultiplier: 1.3 },
  MOTO: { baseFare: 300, perKm: 80, perMinute: 10, minimumFare: 500, nightMultiplier: 1.2 },
};

const COMMISSION_DEFAULTS = {
  REMIS: { percentage: 15 },
  MOTO: { percentage: 12 },
};

@Injectable()
export class PricingService implements OnModuleInit {
  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    for (const [type, fare] of Object.entries(FARE_DEFAULTS)) {
      await this.prisma.fareConfig.upsert({
        where: { serviceType: type },
        create: { serviceType: type, ...fare },
        update: {},
      });
    }
    for (const [type, commission] of Object.entries(COMMISSION_DEFAULTS)) {
      await this.prisma.commissionConfig.upsert({
        where: { serviceType: type },
        create: { serviceType: type, ...commission },
        update: {},
      });
    }
  }

  async getFareConfig(serviceType: string) {
    return this.prisma.fareConfig.findUnique({ where: { serviceType } });
  }

  async getCommissionConfig(serviceType: string) {
    return this.prisma.commissionConfig.findUnique({ where: { serviceType } });
  }

  async getAllFareConfigs() {
    return this.prisma.fareConfig.findMany();
  }

  async getAllCommissionConfigs() {
    return this.prisma.commissionConfig.findMany();
  }

  async updateFareConfig(serviceType: string, data: Partial<{ baseFare: number; perKm: number; perMinute: number; minimumFare: number; nightMultiplier: number; isActive: boolean }>, updatedBy: string) {
    return this.prisma.fareConfig.update({
      where: { serviceType },
      data: { ...data, updatedBy },
    });
  }

  async updateCommissionConfig(serviceType: string, data: Partial<{ percentage: number; isActive: boolean }>, updatedBy: string) {
    return this.prisma.commissionConfig.update({
      where: { serviceType },
      data: { ...data, updatedBy },
    });
  }

  calculateFare(serviceType: string, fare: { baseFare: number; perKm: number; perMinute: number; minimumFare: number; nightMultiplier: number }, distanceKm: number, durationMin: number, surgeMultiplier = 1.0) {
    const hour = new Date().getHours();
    const isNight = hour >= 22 || hour < 6;
    const nightFactor = isNight ? fare.nightMultiplier : 1.0;
    const price = (fare.baseFare + fare.perKm * distanceKm + fare.perMinute * durationMin) * surgeMultiplier * nightFactor;
    return Math.max(price, fare.minimumFare);
  }

  calculateCommission(price: number, commissionPct: number) {
    const commission = (price * commissionPct) / 100;
    const payout = price - commission;
    return { commissionRate: commissionPct, commissionAmount: commission, driverPayout: payout };
  }
}
