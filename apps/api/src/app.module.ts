import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { DriversModule } from './drivers/drivers.module';
import { TripsModule } from './trips/trips.module';
import { DeliveriesModule } from './deliveries/deliveries.module';
import { AdminModule } from './admin/admin.module';
import { GatewayModule } from './gateway/gateway.module';
import { FreightModule } from './freight/freight.module';
import { ServicesModule } from './services/services.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ZonesModule } from './zones/zones.module';
import { DiscountsModule } from './discounts/discounts.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    PrismaModule,
    AuthModule,
    UsersModule,
    DriversModule,
    TripsModule,
    DeliveriesModule,
    AdminModule,
    GatewayModule,
    FreightModule,
    ServicesModule,
    NotificationsModule,
    ZonesModule,
    DiscountsModule,
  ],
})
export class AppModule {}
