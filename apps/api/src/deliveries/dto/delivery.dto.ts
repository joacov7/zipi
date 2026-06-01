import { IsNumber, IsString, IsOptional, IsEnum, IsInt, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DeliveryStatus } from '@prisma/client';

export class CreateDeliveryDto {
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

  @ApiProperty({ example: 'Documentos importantes' })
  @IsString()
  packageDescription: string;

  @ApiProperty({ example: 'María García' })
  @IsString()
  recipientName: string;

  @ApiProperty({ example: '+541144444444' })
  @IsString()
  recipientPhone: string;
}

export class UpdateDeliveryStatusDto {
  @ApiProperty({ enum: DeliveryStatus })
  @IsEnum(DeliveryStatus)
  status: DeliveryStatus;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  cancelReason?: string;
}

export class RateDeliveryDto {
  @ApiProperty({ minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;
}

export class EstimateDeliveryPriceDto {
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
}
