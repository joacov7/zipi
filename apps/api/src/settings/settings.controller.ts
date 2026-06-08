import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('settings')
@Controller('settings')
export class SettingsController {
  constructor(private settingsService: SettingsService) {}

  @Get('modules')
  @ApiOperation({ summary: 'Estado de los módulos (público)' })
  getModules() {
    return this.settingsService.getModules();
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch('modules/:key')
  @ApiOperation({ summary: 'Activar/desactivar módulo (admin)' })
  setModule(@Param('key') key: string, @Body() body: { enabled: boolean }) {
    return this.settingsService.setModule(key, body.enabled);
  }
}
