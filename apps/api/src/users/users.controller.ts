import { Controller, Get, Patch, Body, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Obtener perfil del usuario autenticado' })
  getMe(@CurrentUser('sub') userId: string) {
    return this.usersService.findById(userId);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Actualizar perfil' })
  updateProfile(@CurrentUser('sub') userId: string, @Body() dto: UpdateUserDto) {
    return this.usersService.updateProfile(userId, dto);
  }

  @Get('me/trips')
  @ApiOperation({ summary: 'Historial de viajes del usuario' })
  getMyTrips(
    @CurrentUser('sub') userId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.usersService.getMyTrips(userId, +page, Math.min(100, +limit));
  }

  @Get('me/deliveries')
  @ApiOperation({ summary: 'Historial de envíos del usuario' })
  getMyDeliveries(
    @CurrentUser('sub') userId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.usersService.getMyDeliveries(userId, +page, Math.min(100, +limit));
  }
}
