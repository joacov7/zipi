import { Module } from '@nestjs/common';
import { FreightService } from './freight.service';
import { FreightController } from './freight.controller';

@Module({
  providers: [FreightService],
  controllers: [FreightController],
  exports: [FreightService],
})
export class FreightModule {}
