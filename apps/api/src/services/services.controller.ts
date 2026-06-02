import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query,
  UseGuards, Req, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ServicesService } from './services.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import {
  CreateContractorProfileDto,
  CreateServiceRequestDto,
  CreateQuoteDto,
  RateJobDto,
  CancelJobDto,
  ToggleAvailabilityDto,
  CreateCategoryDto,
} from './dto/services.dto';

@ApiTags('services')
@Controller('services')
export class ServicesController {
  constructor(private servicesService: ServicesService) {}

  // ─── Public / Categories ──────────────────────────────────────────────────

  @Get('categories')
  @ApiOperation({ summary: 'List active service categories' })
  getCategories() {
    return this.servicesService.getCategories();
  }

  // ─── Admin ────────────────────────────────────────────────────────────────

  @Post('categories')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create service category (admin)' })
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.servicesService.createCategory(dto);
  }

  @Patch('categories/:id/toggle')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  toggleCategory(@Param('id') id: string, @Body() body: { isActive: boolean }) {
    return this.servicesService.toggleCategory(id, body.isActive);
  }

  // ─── Contractor profile ───────────────────────────────────────────────────

  @Get('contractor/me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  getContractorProfile(@Req() req: any) {
    return this.servicesService.getContractorProfile(req.user.sub);
  }

  @Post('contractor/profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create contractor profile' })
  createContractorProfile(@Req() req: any, @Body() dto: CreateContractorProfileDto) {
    return this.servicesService.createContractorProfile(req.user.sub, dto);
  }

  @Patch('contractor/availability')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  toggleAvailability(@Req() req: any, @Body() dto: ToggleAvailabilityDto) {
    return this.servicesService.toggleContractorAvailability(req.user.sub, dto);
  }

  // ─── Service requests ──────────────────────────────────────────────────────

  @Post('requests')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Client creates a service request' })
  createRequest(@Req() req: any, @Body() dto: CreateServiceRequestDto) {
    return this.servicesService.createRequest(req.user.sub, dto);
  }

  @Get('requests')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Open requests (for contractors)' })
  getOpenRequests(@Query('categoryId') categoryId?: string) {
    return this.servicesService.getOpenRequests(categoryId);
  }

  @Get('requests/me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Client's own requests" })
  getMyRequests(@Req() req: any) {
    return this.servicesService.getMyRequests(req.user.sub);
  }

  @Get('requests/contractor')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Open requests matching contractor categories' })
  getContractorRequests(@Req() req: any) {
    return this.servicesService.getContractorOpenRequests(req.user.sub);
  }

  @Delete('requests/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  cancelRequest(@Req() req: any, @Param('id') id: string) {
    return this.servicesService.cancelRequest(req.user.sub, id);
  }

  // ─── Quotes ────────────────────────────────────────────────────────────────

  @Post('requests/:id/quotes')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Contractor submits a quote' })
  submitQuote(@Req() req: any, @Param('id') id: string, @Body() dto: CreateQuoteDto) {
    return this.servicesService.submitQuote(req.user.sub, id, dto);
  }

  @Post('quotes/:id/accept')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Client accepts a quote → creates job' })
  acceptQuote(@Req() req: any, @Param('id') id: string) {
    return this.servicesService.acceptQuote(req.user.sub, id);
  }

  @Delete('quotes/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  withdrawQuote(@Req() req: any, @Param('id') id: string) {
    return this.servicesService.withdrawQuote(req.user.sub, id);
  }

  // ─── Jobs ──────────────────────────────────────────────────────────────────

  @Get('jobs/me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  getMyJobs(@Req() req: any) {
    return this.servicesService.getMyJobs(req.user.sub);
  }

  @Post('jobs/:id/pay')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Client confirms escrow payment' })
  payJob(@Req() req: any, @Param('id') id: string) {
    return this.servicesService.payJob(req.user.sub, id);
  }

  @Patch('jobs/:id/start')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Contractor starts the job' })
  startJob(@Req() req: any, @Param('id') id: string) {
    return this.servicesService.startJob(req.user.sub, id);
  }

  @Post('jobs/:id/complete')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Client confirms job completion → releases payment' })
  completeJob(@Req() req: any, @Param('id') id: string) {
    return this.servicesService.completeJob(req.user.sub, id);
  }

  @Post('jobs/:id/rate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  rateJob(@Req() req: any, @Param('id') id: string, @Body() dto: RateJobDto) {
    return this.servicesService.rateJob(req.user.sub, id, dto);
  }

  @Post('jobs/:id/cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  cancelJob(@Req() req: any, @Param('id') id: string, @Body() dto: CancelJobDto) {
    return this.servicesService.cancelJob(req.user.sub, id, dto);
  }
}
