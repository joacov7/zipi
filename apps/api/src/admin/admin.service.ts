import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TripStatus, DeliveryStatus, FreightStatus } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats() {
    const [
      totalUsers,
      totalDrivers,
      activeDrivers,
      truckDrivers,
      machineryDrivers,
      totalTrips,
      activeTrips,
      totalDeliveries,
      activeDeliveries,
      totalFreights,
      activeFreights,
    ] = await this.prisma.$transaction([
      this.prisma.user.count({ where: { role: 'PASSENGER' } }),
      this.prisma.driver.count(),
      this.prisma.driver.count({ where: { isAvailable: true } }),
      this.prisma.driver.count({ where: { vehicleType: 'TRUCK' } }),
      this.prisma.driver.count({ where: { vehicleType: 'HEAVY_MACHINERY' } }),
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
      this.prisma.freightRequest.count(),
      this.prisma.freightRequest.count({
        where: { status: { in: [FreightStatus.PENDING, FreightStatus.ACCEPTED, FreightStatus.IN_PROGRESS] } },
      }),
    ]);

    const [tripRevenue, deliveryRevenue, freightRevenue] = await this.prisma.$transaction([
      this.prisma.trip.aggregate({ _sum: { finalPrice: true }, where: { status: TripStatus.COMPLETED } }),
      this.prisma.delivery.aggregate({ _sum: { finalPrice: true }, where: { status: DeliveryStatus.DELIVERED } }),
      this.prisma.freightRequest.aggregate({ _sum: { finalPrice: true }, where: { status: FreightStatus.COMPLETED } }),
    ]);

    return {
      users: { total: totalUsers },
      drivers: {
        total: totalDrivers,
        active: activeDrivers,
        trucks: truckDrivers,
        machinery: machineryDrivers,
      },
      trips: { total: totalTrips, active: activeTrips },
      deliveries: { total: totalDeliveries, active: activeDeliveries },
      freights: { total: totalFreights, active: activeFreights },
      revenue: {
        trips: tripRevenue._sum.finalPrice ?? 0,
        deliveries: deliveryRevenue._sum.finalPrice ?? 0,
        freights: freightRevenue._sum.finalPrice ?? 0,
        total:
          (tripRevenue._sum.finalPrice ?? 0) +
          (deliveryRevenue._sum.finalPrice ?? 0) +
          (freightRevenue._sum.finalPrice ?? 0),
      },
    };
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
        include: {
          user: { select: { id: true, name: true, email: true, phone: true, isActive: true } },
        },
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

  async listFreights(page = 1, limit = 20, status?: FreightStatus) {
    const skip = (page - 1) * limit;
    const where = status ? { status } : {};

    const [freights, total] = await this.prisma.$transaction([
      this.prisma.freightRequest.findMany({
        where,
        include: {
          requester: { select: { id: true, name: true, phone: true } },
          driver: { include: { user: { select: { id: true, name: true, phone: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.freightRequest.count({ where }),
    ]);

    return { data: freights, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}
