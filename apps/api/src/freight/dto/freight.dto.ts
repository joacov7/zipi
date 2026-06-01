import {
  IsNumber,
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsInt,
  Min,
  Max,
  IsPositive,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FreightService, FreightStatus } from '@prisma/client';

export class EstimateFreightDto {
  @ApiProperty()
  @IsNumber()
  pickupLat: number;

  @ApiProperty()
  @IsNumber()
  pickupLng: number;

  @ApiProperty()
  @IsNumber()
  dropoffLat: number;

  @ApiProperty()
  @IsNumber()
  dropoffLng: number;

  @ApiProperty({ enum: FreightService })
  @IsEnum(FreightService)
  serviceType: FreightService;

  @ApiPropertyOptional({ description: 'Para FLETE: PICKUP|SMALL_TRUCK|LARGE_TRUCK|SEMI' })
  @IsString()
  @IsOptional()
  truckType?: string;

  @ApiPropertyOptional({ description: 'Para MACHINERY: EXCAVATOR|CRANE|BULLDOZER|FORKLIFT|CONCRETE_MIXER|COMPACTOR' })
  @IsString()
  @IsOptional()
  machineryType?: string;

  @ApiPropertyOptional({ description: 'Horas estimadas para maquinaria' })
  @IsNumber()
  @IsOptional()
  estimatedHours?: number;
}

export class CreateFreightRequestDto {
  @ApiProperty({ enum: FreightService })
  @IsEnum(FreightService)
  serviceType: FreightService;

  @ApiProperty()
  @IsNumber()
  pickupLat: number;

  @ApiProperty()
  @IsNumber()
  pickupLng: number;

  @ApiProperty()
  @IsString()
  pickupAddress: string;

  @ApiProperty()
  @IsNumber()
  dropoffLat: number;

  @ApiProperty()
  @IsNumber()
  dropoffLng: number;

  @ApiProperty()
  @IsString()
  dropoffAddress: string;

  @ApiProperty({ example: 'Mudanza de 3 ambientes' })
  @IsString()
  cargoDescription: string;

  @ApiPropertyOptional({ example: 2.5 })
  @IsNumber()
  @IsOptional()
  estimatedWeightTons?: number;

  @ApiPropertyOptional({ example: 4, description: 'Horas estimadas (maquinaria)' })
  @IsNumber()
  @IsOptional()
  estimatedHours?: number;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  requiresRefrigeration?: boolean;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  specialRequirements?: string;
}

export class UpdateFreightStatusDto {
  @ApiProperty({ enum: FreightStatus })
  @IsEnum(FreightStatus)
  status: FreightStatus;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  cancelReason?: string;

  @ApiPropertyOptional({ description: 'Precio final al completar' })
  @IsNumber()
  @IsOptional()
  finalPrice?: number;
}

export class RateFreightDto {
  @ApiProperty({ minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;
}
