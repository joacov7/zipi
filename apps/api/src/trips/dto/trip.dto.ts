import { IsNumber, IsString, IsOptional, IsEnum, IsInt, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TripStatus } from '@prisma/client';

export class CreateTripDto {
  @ApiProperty()
  @IsNumber()
  originLat: number;

  @ApiProperty()
  @IsNumber()
  originLng: number;

  @ApiProperty()
  @IsString()
  originAddress: string;

  @ApiProperty()
  @IsNumber()
  destLat: number;

  @ApiProperty()
  @IsNumber()
  destLng: number;

  @ApiProperty()
  @IsString()
  destAddress: string;
}

export class UpdateTripStatusDto {
  @ApiProperty({ enum: TripStatus })
  @IsEnum(TripStatus)
  status: TripStatus;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  cancelReason?: string;
}

export class RateTripDto {
  @ApiProperty({ minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;
}

export class EstimatePriceDto {
  @ApiProperty()
  @IsNumber()
  originLat: number;

  @ApiProperty()
  @IsNumber()
  originLng: number;

  @ApiProperty()
  @IsNumber()
  destLat: number;

  @ApiProperty()
  @IsNumber()
  destLng: number;
}
