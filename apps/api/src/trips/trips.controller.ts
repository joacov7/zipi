import { Controller, Post, Get, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { TripsService } from './trips.service';
import { ChatService } from '../chat/chat.service';
import { DiscountsService } from '../discounts/discounts.service';
import { CreateTripDto, UpdateTripStatusDto, RateTripDto, EstimatePriceDto } from './dto/trip.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('trips')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('trips')
export class TripsController {
  constructor(
    private tripsService: TripsService,
    private chatService: ChatService,
    private discountsService: DiscountsService,
  ) {}

  @Post('estimate')
  @ApiOperation({ summary: 'Estimar precio de viaje' })
  estimate(@Body() dto: EstimatePriceDto) {
    return this.tripsService.estimatePrice(dto);
  }

  @Post()
  @ApiOperation({ summary: 'Solicitar un viaje' })
  create(@CurrentUser('sub') userId: string, @Body() dto: CreateTripDto) {
    return this.tripsService.create(userId, dto);
  }

  @Get('my-active')
  @ApiOperation({ summary: 'Viaje activo del conductor (ACCEPTED o IN_PROGRESS)' })
  getActiveTrip(@CurrentUser('sub') userId: string) {
    return this.tripsService.getActiveTrip(userId);
  }

  @Get('pending')
  @ApiOperation({ summary: 'Ver viajes pendientes (para conductores)' })
  getPending() {
    return this.tripsService.getPendingTrips();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Ver detalle de un viaje' })
  findOne(@Param('id') id: string) {
    return this.tripsService.findById(id);
  }

  @Post(':id/accept')
  @ApiOperation({ summary: 'Aceptar un viaje (conductor)' })
  accept(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.tripsService.acceptTrip(userId, id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Actualizar estado del viaje' })
  updateStatus(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateTripStatusDto,
  ) {
    return this.tripsService.updateStatus(userId, id, dto);
  }

  @Post(':id/rate')
  @ApiOperation({ summary: 'Calificar el viaje' })
  rate(@CurrentUser('sub') userId: string, @Param('id') id: string, @Body() dto: RateTripDto) {
    return this.tripsService.rateTrip(userId, id, dto);
  }

  @Get(':id/messages')
  @ApiOperation({ summary: 'Historial de chat del viaje' })
  getMessages(@Param('id') id: string) {
    return this.chatService.getMessages(id);
  }

  @Get('surge')
  @ApiOperation({ summary: 'Multiplicador de tarifa dinámica actual' })
  getSurge() {
    return this.tripsService.getSurgeMultiplier();
  }
}
