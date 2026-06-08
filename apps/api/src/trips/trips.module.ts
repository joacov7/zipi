import { Module } from '@nestjs/common';
import { TripsService } from './trips.service';
import { TripsController } from './trips.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { ChatModule } from '../chat/chat.module';
import { ZonesModule } from '../zones/zones.module';
import { DiscountsModule } from '../discounts/discounts.module';
import { WalletModule } from '../wallet/wallet.module';
import { PrismaModule } from '../prisma/prisma.module';
import { PricingModule } from '../pricing/pricing.module';
import { DispatchModule } from '../dispatch/dispatch.module';

@Module({
  imports: [NotificationsModule, ChatModule, ZonesModule, DiscountsModule, WalletModule, PrismaModule, PricingModule, DispatchModule],
  providers: [TripsService],
  controllers: [TripsController],
  exports: [TripsService],
})
export class TripsModule {}
