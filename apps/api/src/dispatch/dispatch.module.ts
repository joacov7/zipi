import { Module } from '@nestjs/common';
import { DispatchService } from './dispatch.service';
import { DispatchController } from './dispatch.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { GatewayModule } from '../gateway/gateway.module';

@Module({
  imports: [PrismaModule, GatewayModule],
  providers: [DispatchService],
  controllers: [DispatchController],
  exports: [DispatchService],
})
export class DispatchModule {}
