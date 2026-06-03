import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'Juan Pérez' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'juan@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '+541111111111' })
  @IsString()
  phone: string;

  @ApiProperty({ example: 'Password123!' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  referralCode?: string;
}

export class LoginDto {
  @ApiProperty({ example: 'juan@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Password123!' })
  @IsString()
  password: string;
}

export class RefreshTokenDto {
  @ApiProperty()
  @IsString()
  refreshToken: string;
}
