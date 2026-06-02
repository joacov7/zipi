import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { EventsGateway } from './events.gateway';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [JwtModule.register({}), ChatModule],
  providers: [EventsGateway],
  exports: [EventsGateway],
})
export class GatewayModule {}
