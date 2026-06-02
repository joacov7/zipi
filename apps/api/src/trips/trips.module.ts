import { Module } from '@nestjs/common';
import { TripsService } from './trips.service';
import { TripsController } from './trips.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { ChatModule } from '../chat/chat.module';
import { ZonesModule } from '../zones/zones.module';
import { DiscountsModule } from '../discounts/discounts.module';

@Module({
  imports: [NotificationsModule, ChatModule, ZonesModule, DiscountsModule],
  providers: [TripsService],
  controllers: [TripsController],
  exports: [TripsService],
})
export class TripsModule {}
