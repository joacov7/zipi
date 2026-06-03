import { Controller, Get, Post, Delete, Param, Body, UseGuards, Patch, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SharedTripsService } from './shared-trips.service';
import { CreateSharedTripDto } from './dto/shared-trip.dto';

@ApiTags('shared-trips')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('shared-trips')
export class SharedTripsController {
  constructor(private readonly service: SharedTripsService) {}

  @Post()
  @ApiOperation({ summary: 'Publicar un viaje compartido' })
  create(@CurrentUser('sub') userId: string, @Body() dto: CreateSharedTripDto) {
    return this.service.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar viajes disponibles' })
  findAll() {
    return this.service.findAll();
  }

  @Get('mine')
  @ApiOperation({ summary: 'Mis viajes (publicados + en los que participo)' })
  findMine(@CurrentUser('sub') userId: string) {
    return this.service.findMine(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle de un viaje' })
  findById(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Post(':id/join')
  @ApiOperation({ summary: 'Solicitar unirse a un viaje' })
  join(@Param('id') tripId: string, @CurrentUser('sub') userId: string) {
    return this.service.join(tripId, userId);
  }

  @Patch(':id/participants/:userId/accept')
  @ApiOperation({ summary: 'Aceptar participante' })
  accept(
    @Param('id') tripId: string,
    @Param('userId') participantUserId: string,
    @CurrentUser('sub') publisherId: string,
  ) {
    return this.service.respondToParticipant(tripId, publisherId, participantUserId, true);
  }

  @Patch(':id/participants/:userId/reject')
  @ApiOperation({ summary: 'Rechazar participante' })
  reject(
    @Param('id') tripId: string,
    @Param('userId') participantUserId: string,
    @CurrentUser('sub') publisherId: string,
  ) {
    return this.service.respondToParticipant(tripId, publisherId, participantUserId, false);
  }

  @Delete(':id/leave')
  @ApiOperation({ summary: 'Abandonar un viaje' })
  leave(@Param('id') tripId: string, @CurrentUser('sub') userId: string) {
    return this.service.leave(tripId, userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Cancelar un viaje (solo el publicador)' })
  cancel(@Param('id') tripId: string, @CurrentUser('sub') userId: string) {
    return this.service.cancel(tripId, userId);
  }
}
