import { Controller, Post, Get, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { FreightService as FreightServiceEnum } from '@prisma/client';
import { FreightService } from './freight.service';
import {
  CreateFreightRequestDto,
  EstimateFreightDto,
  UpdateFreightStatusDto,
  RateFreightDto,
} from './dto/freight.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('freight')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('freight')
export class FreightController {
  constructor(private freightService: FreightService) {}

  @Post('estimate')
  @ApiOperation({ summary: 'Estimar precio de flete o maquinaria' })
  estimate(@Body() dto: EstimateFreightDto) {
    return this.freightService.estimatePrice(dto);
  }

  @Post()
  @ApiOperation({ summary: 'Solicitar un flete o maquinaria' })
  create(@CurrentUser('sub') userId: string, @Body() dto: CreateFreightRequestDto) {
    return this.freightService.create(userId, dto);
  }

  @Get('pending')
  @ApiOperation({ summary: 'Ver solicitudes pendientes (para conductores)' })
  getPending(@Query('serviceType') serviceType?: FreightServiceEnum) {
    return this.freightService.getPending(serviceType);
  }

  @Get('me/history')
  @ApiOperation({ summary: 'Historial de mis solicitudes' })
  getMyRequests(
    @CurrentUser('sub') userId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.freightService.getMyRequests(userId, +page, +limit);
  }

  @Get('me/driver-history')
  @ApiOperation({ summary: 'Historial de fletes como conductor' })
  getDriverFreights(
    @CurrentUser('sub') userId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.freightService.getDriverFreights(userId, +page, +limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Ver detalle de una solicitud' })
  findOne(@Param('id') id: string) {
    return this.freightService.findById(id);
  }

  @Post(':id/accept')
  @ApiOperation({ summary: 'Aceptar una solicitud (conductor)' })
  accept(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.freightService.accept(userId, id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Actualizar estado de la solicitud' })
  updateStatus(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateFreightStatusDto,
  ) {
    return this.freightService.updateStatus(userId, id, dto);
  }

  @Post(':id/rate')
  @ApiOperation({ summary: 'Calificar el servicio' })
  rate(@CurrentUser('sub') userId: string, @Param('id') id: string, @Body() dto: RateFreightDto) {
    return this.freightService.rate(userId, id, dto);
  }
}
