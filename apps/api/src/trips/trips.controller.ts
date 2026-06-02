import { Controller, Post, Get, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { TripsService } from './trips.service';
import { ChatService } from '../chat/chat.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
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
    private notifications: NotificationsService,
    private prisma: PrismaService,
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

  @Get('surge')
  @ApiOperation({ summary: 'Multiplicador de tarifa dinámica actual' })
  getSurge() {
    return this.tripsService.getSurgeMultiplier();
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

  @Post(':id/sos')
  @ApiOperation({ summary: 'Activar SOS durante el viaje' })
  async sos(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    const trip = await this.tripsService.findById(id);

    // Notify all admins
    const admins = await this.prisma.user.findMany({ where: { role: 'ADMIN' } });
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { name: true } });

    await this.notifications.sendToUsers(
      admins.map((a) => a.id),
      '🆘 ALERTA SOS',
      `${user?.name} activó SOS en el viaje ${id.slice(0, 8)}`,
      { tripId: id, type: 'sos' },
    );

    return {
      message: 'SOS activado. Alerta enviada.',
      trip: { id: trip.id, originAddress: trip.originAddress, destAddress: trip.destAddress },
      emergencyContacts: [
        { label: 'Policía', phone: '911' },
        { label: 'Bomberos', phone: '100' },
        { label: 'Ambulancia', phone: '107' },
        { label: 'Emergencias', phone: '911' },
      ],
    };
  }

  @Get(':id/invoice')
  @ApiOperation({ summary: 'Datos para factura/recibo del viaje' })
  async getInvoice(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    const trip = await this.tripsService.findById(id);
    const passenger = await this.prisma.user.findUnique({
      where: { id: trip.passenger.id },
      select: { name: true, email: true, cuit: true },
    });

    const invoiceNumber = `ZIPI-${trip.createdAt.getFullYear()}-${String(trip.id).slice(-6).toUpperCase()}`;
    const finalAmount = trip.finalPrice ?? trip.estimatedPrice;
    const iva = Math.round(finalAmount * 0.21);

    return {
      invoiceNumber,
      date: trip.createdAt,
      provider: { name: 'Zipi S.R.L.', cuit: '30-00000000-0', address: 'Buenos Aires, Argentina' },
      client: { name: passenger?.name, email: passenger?.email, cuit: passenger?.cuit },
      trip: {
        from: trip.originAddress,
        to: trip.destAddress,
        date: trip.createdAt,
        distanceKm: trip.distanceKm,
        driverName: trip.driver?.user?.name,
      },
      pricing: {
        subtotal: Math.round(finalAmount / 1.21),
        iva,
        total: finalAmount,
        discountCode: trip.discountCode,
        discountAmount: trip.discountAmount,
        surgeMultiplier: trip.surgeMultiplier,
      },
    };
  }
}
