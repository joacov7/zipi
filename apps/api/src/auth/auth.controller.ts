import { Controller, Post, Body, UseGuards, Req, HttpCode, HttpStatus, Patch } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, RefreshTokenDto } from './dto/auth.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Registro de nuevo usuario (pasajero)' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto, 'PASSENGER');
  }

  @Post('register/driver')
  @ApiOperation({ summary: 'Registro de nuevo conductor' })
  registerDriver(@Body() dto: RegisterDto) {
    return this.authService.register(dto, 'DRIVER');
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Iniciar sesión' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Renovar access token' })
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Patch('me/role/driver')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Promover cuenta a conductor' })
  promoteToDriver(@Req() req: any) {
    return this.authService.promoteToDriver(req.user.sub);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cerrar sesión' })
  logout(@Req() req: any) {
    return this.authService.logout(req.user.sub);
  }
}
