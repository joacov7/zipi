import { Module } from '@nestjs/common';
import { SharedTripsService } from './shared-trips.service';
import { SharedTripsController } from './shared-trips.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule, NotificationsModule],
  providers: [SharedTripsService],
  controllers: [SharedTripsController],
  exports: [SharedTripsService],
})
export class SharedTripsModule {}
