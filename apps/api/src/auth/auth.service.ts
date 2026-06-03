import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'crypto';
import { WalletTransactionType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService, REFERRAL_BONUS } from '../wallet/wallet.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';

function generateReferralCode(name: string): string {
  const prefix = name.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 4).padEnd(4, 'X');
  const suffix = randomBytes(3).toString('hex').toUpperCase().slice(0, 4);
  return `${prefix}${suffix}`;
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
    private wallet: WalletService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findFirst({
      where: { OR: [{ email: dto.email }, { phone: dto.phone }] },
    });
    if (existing) throw new ConflictException('Email o teléfono ya registrado');

    // Validate referral code if provided
    let referrerId: string | undefined;
    if (dto.referralCode) {
      const referrer = await this.prisma.user.findUnique({
        where: { referralCode: dto.referralCode.toUpperCase() },
      });
      if (referrer) referrerId = referrer.id;
    }

    // Generate unique referral code for new user
    let referralCode: string;
    do {
      referralCode = generateReferralCode(dto.name);
    } while (await this.prisma.user.findUnique({ where: { referralCode } }));

    const password = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        password,
        role: 'PASSENGER',
        referralCode,
        referredBy: referrerId,
      },
    });

    // Award referral bonus to referrer
    if (referrerId) {
      await this.wallet.credit(
        referrerId,
        REFERRAL_BONUS,
        WalletTransactionType.REFERRAL_BONUS,
        `Bono por referir a ${user.name}`,
      );
    }

    return this.generateTokens(user);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    if (!user.isActive) throw new UnauthorizedException('Cuenta deshabilitada');

    return this.generateTokens(user);
  }

  async refresh(refreshToken: string) {
    const tokenHash = hashToken(refreshToken);
    const stored = await this.prisma.refreshToken.findUnique({
      where: { token: tokenHash },
      include: { user: true },
    });

    if (!stored || stored.expiresAt < new Date()) {
      await this.prisma.refreshToken.deleteMany({ where: { token: tokenHash } });
      throw new UnauthorizedException('Refresh token inválido o expirado');
    }

    await this.prisma.refreshToken.delete({ where: { token: tokenHash } });
    return this.generateTokens(stored.user);
  }

  async logout(userId: string) {
    await this.prisma.refreshToken.deleteMany({ where: { userId } });
    return { message: 'Sesión cerrada' };
  }

  private async generateTokens(user: { id: string; email: string; role: string }) {
    const payload = { sub: user.id, email: user.email, role: user.role };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.config.get('JWT_SECRET'),
      expiresIn: '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.config.get('JWT_REFRESH_SECRET'),
      expiresIn: '7d',
    });

    await this.prisma.refreshToken.create({
      data: {
        token: hashToken(refreshToken),
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const fullUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true, name: true, email: true, phone: true, role: true,
        avatarUrl: true, referralCode: true, walletBalance: true, createdAt: true,
      },
    });

    return { accessToken, refreshToken, user: fullUser };
  }
}
