import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { PricingModule } from '../pricing/pricing.module';

@Module({
  imports: [PrismaModule, PricingModule],
  providers: [AdminService],
  controllers: [AdminController],
})
export class AdminModule {}
