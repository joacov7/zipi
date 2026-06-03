import { IsString, IsEnum, IsInt, Min, Max, IsNumber, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MachineryType, TruckType, VehicleType } from '@prisma/client';

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
  @Min(1990)
  @Max(2030)
  vehicleYear: number;

  @ApiProperty({ example: 'Blanco' })
  @IsString()
  vehicleColor: string;

  @ApiProperty({ example: 'LIC-001' })
  @IsString()
  licenseNumber: string;

  // Campos extra para camiones
  @ApiPropertyOptional({ enum: TruckType, description: 'Requerido si vehicleType = TRUCK' })
  @IsEnum(TruckType)
  @IsOptional()
  truckType?: TruckType;

  @ApiPropertyOptional({ description: 'Capacidad en toneladas (camiones)' })
  @IsNumber()
  @IsOptional()
  capacityTons?: number;

  @ApiPropertyOptional({ description: '¿Tiene refrigeración?' })
  @IsBoolean()
  @IsOptional()
  hasRefrigeration?: boolean;

  // Campos extra para maquinaria
  @ApiPropertyOptional({ enum: MachineryType, description: 'Requerido si vehicleType = HEAVY_MACHINERY' })
  @IsEnum(MachineryType)
  @IsOptional()
  machineryType?: MachineryType;
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

  @ApiPropertyOptional({ default: 5, maximum: 50 })
  @IsNumber()
  @Max(50)
  @IsOptional()
  radiusKm?: number;
}
