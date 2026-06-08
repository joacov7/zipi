import { Controller, Post, Param, Req, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { DispatchService } from './dispatch.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('dispatch')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dispatch')
export class DispatchController {
  constructor(private dispatchService: DispatchService) {}

  @Post('offer/:offerId/accept')
  @HttpCode(HttpStatus.OK)
  acceptOffer(@Param('offerId') offerId: string, @Req() req: any) {
    return this.dispatchService.acceptOffer(offerId, req.user.sub);
  }

  @Post('offer/:offerId/reject')
  @HttpCode(HttpStatus.OK)
  rejectOffer(@Param('offerId') offerId: string, @Req() req: any) {
    return this.dispatchService.rejectOffer(offerId, req.user.sub);
  }
}
