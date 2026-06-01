import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  avatarUrl: true,
  isActive: true,
  createdAt: true,
} as const;

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: USER_SELECT,
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  async updateProfile(id: string, dto: UpdateUserDto) {
    return this.prisma.user.update({
      where: { id },
      data: dto,
      select: USER_SELECT,
    });
  }

  async getMyTrips(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [trips, total] = await this.prisma.$transaction([
      this.prisma.trip.findMany({
        where: { passengerId: userId },
        include: { driver: { include: { user: { select: USER_SELECT } } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.trip.count({ where: { passengerId: userId } }),
    ]);
    return { data: trips, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getMyDeliveries(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [deliveries, total] = await this.prisma.$transaction([
      this.prisma.delivery.findMany({
        where: { senderId: userId },
        include: { driver: { include: { user: { select: USER_SELECT } } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.delivery.count({ where: { senderId: userId } }),
    ]);
    return { data: deliveries, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}
