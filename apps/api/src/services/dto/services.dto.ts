import { IsString, IsEnum, IsOptional, IsNumber, IsBoolean, IsArray, Min, Max, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ServiceUrgency } from '@zipi/shared';

export class CreateContractorProfileDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  bio?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  cuit?: string;

  @ApiProperty({ description: 'Array of category IDs' })
  @IsArray()
  @IsString({ each: true })
  categoryIds: string[];

  @ApiPropertyOptional({ default: 20 })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(200)
  coverageKm?: number;
}

export class CreateServiceRequestDto {
  @ApiProperty()
  @IsString()
  categoryId: string;

  @ApiProperty()
  @IsString()
  @MinLength(5)
  title: string;

  @ApiProperty()
  @IsString()
  @MinLength(10)
  description: string;

  @ApiProperty()
  @IsString()
  address: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  lat?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  lng?: number;

  @ApiPropertyOptional({ enum: ServiceUrgency, default: ServiceUrgency.NORMAL })
  @IsEnum(ServiceUrgency)
  @IsOptional()
  urgency?: ServiceUrgency;
}

export class CreateQuoteDto {
  @ApiProperty()
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty()
  @IsString()
  @MinLength(10)
  description: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  @Min(1)
  estimatedHours?: number;
}

export class RateJobDto {
  @ApiProperty({ minimum: 1, maximum: 5 })
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;
}

export class CancelJobDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  reason?: string;
}

export class ToggleAvailabilityDto {
  @ApiProperty()
  @IsBoolean()
  isAvailable: boolean;
}

export class CreateCategoryDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ description: 'Emoji or icon name' })
  @IsString()
  icon: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;
}
