import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { IsString, IsNumber, IsBoolean, IsOptional } from 'class-validator';
import { ZonesService } from './zones.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

class CreateZoneDto {
  @IsString() name: string;
  @IsNumber() centerLat: number;
  @IsNumber() centerLng: number;
  @IsNumber() radiusKm: number;
}

class UpdateZoneDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsNumber() centerLat?: number;
  @IsOptional() @IsNumber() centerLng?: number;
  @IsOptional() @IsNumber() radiusKm?: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

@ApiTags('zones')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('zones')
export class ZonesController {
  constructor(private zonesService: ZonesService) {}

  @Get()
  findAll() { return this.zonesService.findAll(); }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  create(@Body() dto: CreateZoneDto) { return this.zonesService.create(dto); }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  update(@Param('id') id: string, @Body() dto: UpdateZoneDto) { return this.zonesService.update(id, dto); }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  remove(@Param('id') id: string) { return this.zonesService.remove(id); }
}
