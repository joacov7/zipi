import { IsString, IsEnum, IsInt, Min, Max, IsNumber, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VehicleType } from '@prisma/client';

export class CreateDriverProfileDto {
  @ApiProperty({ enum: VehicleType })
  @IsEnum(VehicleType)
  vehicleType: VehicleType;

  @ApiProperty({ example: 'AB123CD' })
  @IsString()
  vehiclePlate: string;

  @ApiProperty({ example: 'Toyota Corolla' })
  @IsString()
  vehicleModel: string;

  @ApiProperty({ example: 2022 })
  @IsInt()
  @Min(2000)
  @Max(2030)
  vehicleYear: number;

  @ApiProperty({ example: 'Blanco' })
  @IsString()
  vehicleColor: string;

  @ApiProperty({ example: 'LIC-001' })
  @IsString()
  licenseNumber: string;
}

export class UpdateLocationDto {
  @ApiProperty()
  @IsNumber()
  lat: number;

  @ApiProperty()
  @IsNumber()
  lng: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  heading?: number;
}

export class ToggleAvailabilityDto {
  @ApiProperty()
  @IsBoolean()
  isAvailable: boolean;
}

export class NearbyDriversDto {
  @ApiProperty({ description: 'Latitud del usuario' })
  @IsNumber()
  lat: number;

  @ApiProperty({ description: 'Longitud del usuario' })
  @IsNumber()
  lng: number;

  @ApiPropertyOptional({ enum: VehicleType })
  @IsEnum(VehicleType)
  @IsOptional()
  vehicleType?: VehicleType;

  @ApiPropertyOptional({ default: 5 })
  @IsNumber()
  @IsOptional()
  radiusKm?: number;
}
