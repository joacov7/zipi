import { Module } from '@nestjs/common';
import { ServicesService } from './services.service';
import { ServicesController } from './services.controller';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [WalletModule],
  providers: [ServicesService],
  controllers: [ServicesController],
  exports: [ServicesService],
})
export class ServicesModule {}
