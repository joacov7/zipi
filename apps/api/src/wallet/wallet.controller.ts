import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

class AdminAdjustDto {
  @IsString() userId: string;
  @IsNumber() amount: number;
  @IsString() description: string;
}

@ApiTags('wallet')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('wallet')
export class WalletController {
  constructor(private walletService: WalletService) {}

  @Get()
  getBalance(@CurrentUser('sub') userId: string) {
    return this.walletService.getBalance(userId);
  }

  @Get('transactions')
  getTransactions(@CurrentUser('sub') userId: string) {
    return this.walletService.getTransactions(userId);
  }

  @Post('admin/adjust')
  adminAdjust(@Body() dto: AdminAdjustDto) {
    return this.walletService.adminAdjust(dto.userId, dto.amount, dto.description);
  }
}
