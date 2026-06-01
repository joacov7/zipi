import { Controller, Post, Get, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { DeliveriesService } from './deliveries.service';
import {
  CreateDeliveryDto,
  UpdateDeliveryStatusDto,
  RateDeliveryDto,
  EstimateDeliveryPriceDto,
} from './dto/delivery.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('deliveries')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('deliveries')
export class DeliveriesController {
  constructor(private deliveriesService: DeliveriesService) {}

  @Post('estimate')
  @ApiOperation({ summary: 'Estimar precio de envío' })
  estimate(@Body() dto: EstimateDeliveryPriceDto) {
    return this.deliveriesService.estimatePrice(dto);
  }

  @Post()
  @ApiOperation({ summary: 'Solicitar un envío' })
  create(@CurrentUser('sub') userId: string, @Body() dto: CreateDeliveryDto) {
    return this.deliveriesService.create(userId, dto);
  }

  @Get('pending')
  @ApiOperation({ summary: 'Ver envíos pendientes (para motociclistas)' })
  getPending() {
    return this.deliveriesService.getPendingDeliveries();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Ver detalle de un envío' })
  findOne(@Param('id') id: string) {
    return this.deliveriesService.findById(id);
  }

  @Post(':id/accept')
  @ApiOperation({ summary: 'Aceptar un envío (conductor)' })
  accept(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.deliveriesService.acceptDelivery(userId, id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Actualizar estado del envío' })
  updateStatus(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateDeliveryStatusDto,
  ) {
    return this.deliveriesService.updateStatus(userId, id, dto);
  }

  @Post(':id/rate')
  @ApiOperation({ summary: 'Calificar el envío' })
  rate(@CurrentUser('sub') userId: string, @Param('id') id: string, @Body() dto: RateDeliveryDto) {
    return this.deliveriesService.rateDelivery(userId, id, dto);
  }
}
