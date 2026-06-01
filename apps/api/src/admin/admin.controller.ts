import { Controller, Get, Post, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { TripStatus, DeliveryStatus } from '@prisma/client';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Estadísticas del dashboard' })
  getStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('users')
  @ApiOperation({ summary: 'Listar usuarios' })
  listUsers(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('search') search?: string,
  ) {
    return this.adminService.listUsers(+page, +limit, search);
  }

  @Patch('users/:id/toggle-status')
  @ApiOperation({ summary: 'Activar/desactivar usuario' })
  toggleUserStatus(@Param('id') id: string) {
    return this.adminService.toggleUserStatus(id);
  }

  @Get('drivers')
  @ApiOperation({ summary: 'Listar conductores' })
  listDrivers(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('verified') verified?: string,
  ) {
    const verifiedBool = verified !== undefined ? verified === 'true' : undefined;
    return this.adminService.listDrivers(+page, +limit, verifiedBool);
  }

  @Post('drivers/:id/verify')
  @ApiOperation({ summary: 'Verificar conductor' })
  verifyDriver(@Param('id') id: string) {
    return this.adminService.verifyDriver(id);
  }

  @Get('trips')
  @ApiOperation({ summary: 'Listar viajes' })
  listTrips(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('status') status?: TripStatus,
  ) {
    return this.adminService.listTrips(+page, +limit, status);
  }

  @Get('deliveries')
  @ApiOperation({ summary: 'Listar envíos' })
  listDeliveries(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('status') status?: DeliveryStatus,
  ) {
    return this.adminService.listDeliveries(+page, +limit, status);
  }
}
