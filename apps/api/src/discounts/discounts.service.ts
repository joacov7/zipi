import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DiscountsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.discountCode.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async create(data: {
    code: string;
    description?: string;
    discountPercent: number;
    maxUses?: number;
    minOrderAmount?: number;
    expiresAt?: Date;
  }) {
    return this.prisma.discountCode.create({ data });
  }

  async update(id: string, data: Partial<{ isActive: boolean; maxUses: number; expiresAt: Date }>) {
    return this.prisma.discountCode.update({ where: { id }, data });
  }

  async validate(code: string, orderAmount: number): Promise<{ discountPercent: number; discountAmount: number }> {
    const discount = await this.prisma.discountCode.findUnique({ where: { code: code.toUpperCase() } });

    if (!discount) throw new NotFoundException('Código de descuento inválido');
    if (!discount.isActive) throw new BadRequestException('El código ya no está activo');
    if (discount.maxUses > 0 && discount.usedCount >= discount.maxUses) {
      throw new BadRequestException('El código ya alcanzó su límite de usos');
    }
    if (discount.expiresAt && discount.expiresAt < new Date()) {
      throw new BadRequestException('El código está vencido');
    }
    if (discount.minOrderAmount && orderAmount < discount.minOrderAmount) {
      throw new BadRequestException(
        `El monto mínimo para este código es $${discount.minOrderAmount.toLocaleString('es-AR')}`,
      );
    }

    const discountAmount = Math.round(orderAmount * (discount.discountPercent / 100));
    return { discountPercent: discount.discountPercent, discountAmount };
  }

  async redeem(code: string) {
    const result = await this.prisma.$executeRaw`
      UPDATE discount_codes
      SET used_count = used_count + 1
      WHERE code = ${code.toUpperCase()}
        AND is_active = true
        AND (max_uses = 0 OR used_count < max_uses)
        AND (expires_at IS NULL OR expires_at > NOW())
    `;
    if (result === 0) {
      throw new BadRequestException('El código de descuento ya no es válido');
    }
  }
}
