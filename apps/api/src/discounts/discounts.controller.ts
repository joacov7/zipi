import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsInt, Min, Max, IsDateString } from 'class-validator';
import { DiscountsService } from './discounts.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

class CreateDiscountDto {
  @IsString() code: string;
  @IsOptional() @IsString() description?: string;
  @IsInt() @Min(1) @Max(100) discountPercent: number;
  @IsOptional() @IsInt() @Min(1) maxUses?: number;
  @IsOptional() @IsNumber() minOrderAmount?: number;
  @IsOptional() @IsDateString() expiresAt?: string;
}

class ValidateDiscountDto {
  @IsString() code: string;
  @IsNumber() orderAmount: number;
}

class UpdateDiscountDto {
  @IsOptional() isActive?: boolean;
  @IsOptional() @IsInt() maxUses?: number;
}

@ApiTags('discounts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('discounts')
export class DiscountsController {
  constructor(private discountsService: DiscountsService) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  findAll() { return this.discountsService.findAll(); }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  create(@Body() dto: CreateDiscountDto) {
    return this.discountsService.create({
      ...dto,
      code: dto.code.toUpperCase(),
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
    });
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  update(@Param('id') id: string, @Body() dto: UpdateDiscountDto) {
    return this.discountsService.update(id, dto);
  }

  @Post('validate')
  validate(@Body() dto: ValidateDiscountDto) {
    return this.discountsService.validate(dto.code, dto.orderAmount);
  }
}
