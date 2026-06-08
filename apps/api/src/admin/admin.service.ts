import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PricingService } from '../pricing/pricing.service';
import { TripStatus, DeliveryStatus } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private pricing: PricingService,
  ) {}

  async getDashboardStats() {
    const [
      totalUsers,
      totalDrivers,
      activeDrivers,
      totalTrips,
      activeTrips,
      totalDeliveries,
      activeDeliveries,
    ] = await this.prisma.$transaction([
      this.prisma.user.count({ where: { role: 'PASSENGER' } }),
      this.prisma.driver.count(),
      this.prisma.driver.count({ where: { isAvailable: true } }),
      this.prisma.trip.count(),
      this.prisma.trip.count({
        where: { status: { in: [TripStatus.PENDING, TripStatus.ACCEPTED, TripStatus.IN_PROGRESS] } },
      }),
      this.prisma.delivery.count(),
      this.prisma.delivery.count({
        where: {
          status: {
            in: [DeliveryStatus.PENDING, DeliveryStatus.ACCEPTED, DeliveryStatus.PICKED_UP, DeliveryStatus.IN_TRANSIT],
          },
        },
      }),
    ]);

    const [tripRevenue, deliveryRevenue, tripCommission, deliveryCommission] = await this.prisma.$transaction([
      this.prisma.trip.aggregate({ _sum: { finalPrice: true }, where: { status: TripStatus.COMPLETED } }),
      this.prisma.delivery.aggregate({ _sum: { finalPrice: true }, where: { status: DeliveryStatus.DELIVERED } }),
      this.prisma.trip.aggregate({ _sum: { commissionAmount: true }, where: { status: TripStatus.COMPLETED } }),
      this.prisma.delivery.aggregate({ _sum: { commissionAmount: true }, where: { status: DeliveryStatus.DELIVERED } }),
    ]);

    const totalRevenue = (tripRevenue._sum.finalPrice ?? 0) + (deliveryRevenue._sum.finalPrice ?? 0);
    const totalCommission = (tripCommission._sum.commissionAmount ?? 0) + (deliveryCommission._sum.commissionAmount ?? 0);

    return {
      users: { total: totalUsers },
      drivers: { total: totalDrivers, active: activeDrivers },
      trips: { total: totalTrips, active: activeTrips },
      deliveries: { total: totalDeliveries, active: activeDeliveries },
      revenue: {
        trips: tripRevenue._sum.finalPrice ?? 0,
        deliveries: deliveryRevenue._sum.finalPrice ?? 0,
        total: totalRevenue,
        commission: totalCommission,
      },
      chart: await this.getLast7DaysChart(),
    };
  }

  private async getLast7DaysChart() {
    const days: { date: string; trips: number; revenue: number; commission: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const start = new Date();
      start.setDate(start.getDate() - i);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setHours(23, 59, 59, 999);

      const [count, rev] = await Promise.all([
        this.prisma.trip.count({ where: { createdAt: { gte: start, lte: end } } }),
        this.prisma.trip.aggregate({
          _sum: { finalPrice: true, commissionAmount: true },
          where: { status: TripStatus.COMPLETED, createdAt: { gte: start, lte: end } },
        }),
      ]);

      days.push({
        date: start.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' }),
        trips: count,
        revenue: rev._sum.finalPrice ?? 0,
        commission: rev._sum.commissionAmount ?? 0,
      });
    }
    return days;
  }

  async listUsers(page = 1, limit = 20, search?: string) {
    const skip = (page - 1) * limit;
    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
            { phone: { contains: search } },
          ],
        }
      : {};

    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          isActive: true,
          createdAt: true,
          driver: { select: { id: true, isVerified: true, vehicleType: true, rating: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return { data: users, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async toggleUserStatus(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return this.prisma.user.update({
      where: { id: userId },
      data: { isActive: !user.isActive },
      select: { id: true, name: true, isActive: true },
    });
  }

  async verifyDriver(driverId: string) {
    const driver = await this.prisma.driver.findUnique({ where: { id: driverId } });
    if (!driver) throw new NotFoundException('Conductor no encontrado');
    return this.prisma.driver.update({
      where: { id: driverId },
      data: { isVerified: true },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
  }

  async listDrivers(page = 1, limit = 20, verified?: boolean) {
    const skip = (page - 1) * limit;
    const where = verified !== undefined ? { isVerified: verified } : {};
    const [drivers, total] = await this.prisma.$transaction([
      this.prisma.driver.findMany({
        where,
        include: { user: { select: { id: true, name: true, email: true, phone: true, isActive: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.driver.count({ where }),
    ]);
    return { data: drivers, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async listTrips(page = 1, limit = 20, status?: TripStatus) {
    const skip = (page - 1) * limit;
    const where = status ? { status } : {};
    const [trips, total] = await this.prisma.$transaction([
      this.prisma.trip.findMany({
        where,
        include: {
          passenger: { select: { id: true, name: true, phone: true } },
          driver: { include: { user: { select: { id: true, name: true, phone: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.trip.count({ where }),
    ]);
    return { data: trips, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async listDeliveries(page = 1, limit = 20, status?: DeliveryStatus) {
    const skip = (page - 1) * limit;
    const where = status ? { status } : {};
    const [deliveries, total] = await this.prisma.$transaction([
      this.prisma.delivery.findMany({
        where,
        include: {
          sender: { select: { id: true, name: true, phone: true } },
          driver: { include: { user: { select: { id: true, name: true, phone: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.delivery.count({ where }),
    ]);
    return { data: deliveries, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // Pricing config methods
  getFareConfigs() { return this.pricing.getAllFareConfigs(); }
  getCommissionConfigs() { return this.pricing.getAllCommissionConfigs(); }
  updateFare(serviceType: string, data: any, adminId: string) { return this.pricing.updateFareConfig(serviceType, data, adminId); }
  updateCommission(serviceType: string, data: any, adminId: string) { return this.pricing.updateCommissionConfig(serviceType, data, adminId); }
}
