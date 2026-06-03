import { Controller, Post, Delete, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

class RegisterTokenDto {
  @IsString() token: string;
  @IsString() platform: string;
}

class RemoveTokenDto {
  @IsString() token: string;
}

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Post('token')
  register(@Req() req: any, @Body() dto: RegisterTokenDto) {
    return this.notificationsService.registerToken(req.user.sub, dto.token, dto.platform);
  }

  @Delete('token')
  remove(@Req() req: any, @Body() dto: RemoveTokenDto) {
    return this.notificationsService.removeToken(req.user.sub, dto.token);
  }
}
