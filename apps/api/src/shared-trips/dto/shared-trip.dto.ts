import { IsString, IsNumber, IsInt, IsOptional, IsDateString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSharedTripDto {
  @ApiProperty()
  @IsString()
  originAddress: string;

  @ApiProperty()
  @IsNumber()
  originLat: number;

  @ApiProperty()
  @IsNumber()
  originLng: number;

  @ApiProperty()
  @IsString()
  destAddress: string;

  @ApiProperty()
  @IsNumber()
  destLat: number;

  @ApiProperty()
  @IsNumber()
  destLng: number;

  @ApiProperty()
  @IsDateString()
  departureTime: string;

  @ApiProperty()
  @IsInt()
  @Min(1)
  totalSeats: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  totalCost: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;
}
