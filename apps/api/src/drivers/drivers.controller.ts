import { Controller, Post, Get, Patch, Body, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { DriversService } from './drivers.service';
import {
  CreateDriverProfileDto,
  UpdateLocationDto,
  ToggleAvailabilityDto,
  NearbyDriversDto,
} from './dto/driver.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('drivers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('drivers')
export class DriversController {
  constructor(private driversService: DriversService) {}

  @Post('profile')
  @ApiOperation({ summary: 'Crear perfil de conductor' })
  createProfile(@CurrentUser('sub') userId: string, @Body() dto: CreateDriverProfileDto) {
    return this.driversService.createProfile(userId, dto);
  }

  @Get('me')
  @ApiOperation({ summary: 'Obtener mi perfil de conductor' })
  getMyProfile(@CurrentUser('sub') userId: string) {
    return this.driversService.getMyProfile(userId);
  }

  @Patch('location')
  @ApiOperation({ summary: 'Actualizar ubicación del conductor' })
  updateLocation(@CurrentUser('sub') userId: string, @Body() dto: UpdateLocationDto) {
    return this.driversService.updateLocation(userId, dto);
  }

  @Patch('availability')
  @ApiOperation({ summary: 'Cambiar disponibilidad' })
  toggleAvailability(@CurrentUser('sub') userId: string, @Body() dto: ToggleAvailabilityDto) {
    return this.driversService.toggleAvailability(userId, dto);
  }

  @Get('nearby')
  @ApiOperation({ summary: 'Buscar conductores cercanos' })
  findNearby(@Query() query: NearbyDriversDto) {
    return this.driversService.findNearby(query);
  }

  @Get('me/trips')
  @ApiOperation({ summary: 'Historial de viajes del conductor' })
  getDriverTrips(
    @CurrentUser('sub') userId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.driversService.getDriverTrips(userId, +page, +limit);
  }
}
