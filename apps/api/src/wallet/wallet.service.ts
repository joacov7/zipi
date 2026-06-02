import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WalletTransactionType } from '@prisma/client';

export const REFERRAL_BONUS = 500; // ARS awarded to referrer

@Injectable()
export class WalletService {
  constructor(private prisma: PrismaService) {}

  async getBalance(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { walletBalance: true },
    });
    return { balance: user?.walletBalance ?? 0 };
  }

  async getTransactions(userId: string) {
    return this.prisma.walletTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async credit(userId: string, amount: number, type: WalletTransactionType, description: string, tripId?: string) {
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { walletBalance: { increment: amount } },
      }),
      this.prisma.walletTransaction.create({
        data: { userId, amount, type, description, tripId },
      }),
    ]);
  }

  async debit(userId: string, amount: number, description: string, tripId?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { walletBalance: true } });
    if (!user || user.walletBalance < amount) {
      throw new BadRequestException('Saldo insuficiente en la billetera');
    }
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { walletBalance: { decrement: amount } },
      }),
      this.prisma.walletTransaction.create({
        data: { userId, amount: -amount, type: WalletTransactionType.DEBIT, description, tripId },
      }),
    ]);
  }

  async adminAdjust(userId: string, amount: number, description: string) {
    if (amount >= 0) {
      await this.credit(userId, amount, WalletTransactionType.ADMIN_ADJUSTMENT, description);
    } else {
      await this.debit(userId, Math.abs(amount), description);
    }
    return this.getBalance(userId);
  }
}
