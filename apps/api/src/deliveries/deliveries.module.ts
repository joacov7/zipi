import { Module } from '@nestjs/common';
import { DeliveriesService } from './deliveries.service';
import { DeliveriesController } from './deliveries.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { PricingModule } from '../pricing/pricing.module';
import { DispatchModule } from '../dispatch/dispatch.module';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [PrismaModule, PricingModule, DispatchModule, WalletModule],
  providers: [DeliveriesService],
  controllers: [DeliveriesController],
  exports: [DeliveriesService],
})
export class DeliveriesModule {}
