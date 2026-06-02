import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import {
  ServiceRequestStatus,
  QuoteStatus,
  JobStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateContractorProfileDto,
  CreateServiceRequestDto,
  CreateQuoteDto,
  RateJobDto,
  CancelJobDto,
  CreateCategoryDto,
  ToggleAvailabilityDto,
} from './dto/services.dto';

const PLATFORM_FEE_PERCENT = 0.15;

@Injectable()
export class ServicesService {
  constructor(private prisma: PrismaService) {}

  // ─── Categories ───────────────────────────────────────────────────────────

  async getCategories() {
    return this.prisma.serviceCategory.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async createCategory(dto: CreateCategoryDto) {
    return this.prisma.serviceCategory.create({ data: dto });
  }

  async toggleCategory(id: string, isActive: boolean) {
    return this.prisma.serviceCategory.update({ where: { id }, data: { isActive } });
  }

  // ─── Contractor profile ───────────────────────────────────────────────────

  async getContractorProfile(userId: string) {
    return this.prisma.contractorProfile.findUnique({
      where: { userId },
      include: {
        services: { include: { category: true } },
        user: { select: { id: true, name: true, email: true, phone: true, avatarUrl: true } },
      },
    });
  }

  async createContractorProfile(userId: string, dto: CreateContractorProfileDto) {
    const existing = await this.prisma.contractorProfile.findUnique({ where: { userId } });
    if (existing) throw new ConflictException('Ya tenés un perfil de contratista');

    const categories = await this.prisma.serviceCategory.findMany({
      where: { id: { in: dto.categoryIds }, isActive: true },
    });
    if (categories.length !== dto.categoryIds.length) {
      throw new BadRequestException('Una o más categorías no existen');
    }

    return this.prisma.contractorProfile.create({
      data: {
        userId,
        bio: dto.bio,
        cuit: dto.cuit,
        coverageKm: dto.coverageKm ?? 20,
        services: {
          create: dto.categoryIds.map((id) => ({ categoryId: id })),
        },
      },
      include: { services: { include: { category: true } } },
    });
  }

  async toggleContractorAvailability(userId: string, dto: ToggleAvailabilityDto) {
    const profile = await this.prisma.contractorProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Perfil de contratista no encontrado');
    if (!profile.isVerified && dto.isAvailable) {
      throw new ForbiddenException('Tu perfil no está verificado aún');
    }
    return this.prisma.contractorProfile.update({
      where: { userId },
      data: { isAvailable: dto.isAvailable },
    });
  }

  // ─── Service requests ──────────────────────────────────────────────────────

  async createRequest(clientId: string, dto: CreateServiceRequestDto) {
    const category = await this.prisma.serviceCategory.findUnique({ where: { id: dto.categoryId } });
    if (!category || !category.isActive) throw new NotFoundException('Categoría no encontrada');

    return this.prisma.serviceRequest.create({
      data: {
        clientId,
        categoryId: dto.categoryId,
        title: dto.title,
        description: dto.description,
        address: dto.address,
        lat: dto.lat,
        lng: dto.lng,
        urgency: dto.urgency,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
      include: { category: true },
    });
  }

  async getOpenRequests(categoryId?: string) {
    return this.prisma.serviceRequest.findMany({
      where: {
        status: ServiceRequestStatus.OPEN,
        ...(categoryId ? { categoryId } : {}),
      },
      include: {
        category: true,
        client: { select: { id: true, name: true, avatarUrl: true } },
        _count: { select: { quotes: true } },
      },
      orderBy: [
        { urgency: 'asc' },
        { createdAt: 'desc' },
      ],
    });
  }

  async getMyRequests(clientId: string) {
    return this.prisma.serviceRequest.findMany({
      where: { clientId },
      include: {
        category: true,
        quotes: {
          include: {
            contractor: {
              include: { user: { select: { id: true, name: true, avatarUrl: true } } },
            },
          },
          where: { status: { not: QuoteStatus.WITHDRAWN } },
          orderBy: { createdAt: 'asc' },
        },
        job: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async cancelRequest(clientId: string, requestId: string) {
    const req = await this.prisma.serviceRequest.findUnique({ where: { id: requestId } });
    if (!req) throw new NotFoundException('Solicitud no encontrada');
    if (req.clientId !== clientId) throw new ForbiddenException('No autorizado');
    if (req.status === ServiceRequestStatus.IN_PROGRESS || req.status === ServiceRequestStatus.COMPLETED) {
      throw new BadRequestException('No podés cancelar una solicitud en progreso o completada');
    }
    return this.prisma.serviceRequest.update({
      where: { id: requestId },
      data: { status: ServiceRequestStatus.CANCELLED },
    });
  }

  // ─── Quotes ────────────────────────────────────────────────────────────────

  async submitQuote(contractorUserId: string, requestId: string, dto: CreateQuoteDto) {
    const contractor = await this.prisma.contractorProfile.findUnique({
      where: { userId: contractorUserId },
      include: { services: true },
    });
    if (!contractor) throw new NotFoundException('Perfil de contratista no encontrado');
    if (!contractor.isVerified) throw new ForbiddenException('Tu perfil no está verificado');

    const request = await this.prisma.serviceRequest.findUnique({ where: { id: requestId } });
    if (!request) throw new NotFoundException('Solicitud no encontrada');
    if (request.status !== ServiceRequestStatus.OPEN && request.status !== ServiceRequestStatus.QUOTED) {
      throw new BadRequestException('Esta solicitud ya no acepta cotizaciones');
    }

    const servicesCategory = contractor.services.map((s) => s.categoryId);
    if (!servicesCategory.includes(request.categoryId)) {
      throw new ForbiddenException('No estás registrado en esta categoría');
    }

    const existing = await this.prisma.serviceQuote.findFirst({
      where: { requestId, contractorId: contractor.id, status: QuoteStatus.PENDING },
    });
    if (existing) throw new ConflictException('Ya enviaste una cotización para esta solicitud');

    const quote = await this.prisma.serviceQuote.create({
      data: {
        requestId,
        contractorId: contractor.id,
        price: dto.price,
        description: dto.description,
        estimatedHours: dto.estimatedHours,
      },
    });

    await this.prisma.serviceRequest.update({
      where: { id: requestId },
      data: { status: ServiceRequestStatus.QUOTED },
    });

    return quote;
  }

  async acceptQuote(clientId: string, quoteId: string) {
    const quote = await this.prisma.serviceQuote.findUnique({
      where: { id: quoteId },
      include: { request: true, contractor: true },
    });
    if (!quote) throw new NotFoundException('Cotización no encontrada');
    if (quote.request.clientId !== clientId) throw new ForbiddenException('No autorizado');
    if (quote.status !== QuoteStatus.PENDING) throw new BadRequestException('Cotización no disponible');

    const escrowAmount = quote.price;
    const platformFee = Math.ceil(escrowAmount * PLATFORM_FEE_PERCENT);
    const finalAmount = escrowAmount - platformFee;

    await this.prisma.$transaction([
      this.prisma.serviceQuote.update({ where: { id: quoteId }, data: { status: QuoteStatus.ACCEPTED } }),
      this.prisma.serviceQuote.updateMany({
        where: { requestId: quote.requestId, id: { not: quoteId } },
        data: { status: QuoteStatus.REJECTED },
      }),
      this.prisma.serviceRequest.update({
        where: { id: quote.requestId },
        data: { status: ServiceRequestStatus.ACCEPTED },
      }),
    ]);

    return this.prisma.serviceJob.create({
      data: {
        requestId: quote.requestId,
        quoteId,
        contractorId: quote.contractorId,
        clientId,
        escrowAmount,
        platformFee,
        finalAmount,
      },
      include: {
        contractor: { include: { user: { select: { id: true, name: true, phone: true, avatarUrl: true } } } },
        request: { include: { category: true } },
        quote: true,
      },
    });
  }

  async withdrawQuote(contractorUserId: string, quoteId: string) {
    const contractor = await this.prisma.contractorProfile.findUnique({ where: { userId: contractorUserId } });
    if (!contractor) throw new NotFoundException('Perfil no encontrado');

    const quote = await this.prisma.serviceQuote.findUnique({ where: { id: quoteId } });
    if (!quote || quote.contractorId !== contractor.id) throw new ForbiddenException('No autorizado');
    if (quote.status !== QuoteStatus.PENDING) throw new BadRequestException('No podés retirar esta cotización');

    return this.prisma.serviceQuote.update({ where: { id: quoteId }, data: { status: QuoteStatus.WITHDRAWN } });
  }

  // ─── Jobs ──────────────────────────────────────────────────────────────────

  async payJob(clientId: string, jobId: string) {
    const job = await this.prisma.serviceJob.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundException('Trabajo no encontrado');
    if (job.clientId !== clientId) throw new ForbiddenException('No autorizado');
    if (job.status !== JobStatus.PENDING_PAYMENT) throw new BadRequestException('Estado inválido');

    return this.prisma.serviceJob.update({
      where: { id: jobId },
      data: { status: JobStatus.PAID },
      include: {
        contractor: { include: { user: { select: { id: true, name: true, phone: true, avatarUrl: true } } } },
        request: { include: { category: true } },
      },
    });
  }

  async startJob(contractorUserId: string, jobId: string) {
    const contractor = await this.prisma.contractorProfile.findUnique({ where: { userId: contractorUserId } });
    if (!contractor) throw new NotFoundException('Perfil no encontrado');

    const job = await this.prisma.serviceJob.findUnique({ where: { id: jobId } });
    if (!job || job.contractorId !== contractor.id) throw new ForbiddenException('No autorizado');
    if (job.status !== JobStatus.PAID) throw new BadRequestException('El cliente aún no realizó el pago');

    await this.prisma.serviceRequest.update({
      where: { id: job.requestId },
      data: { status: ServiceRequestStatus.IN_PROGRESS },
    });

    return this.prisma.serviceJob.update({ where: { id: jobId }, data: { status: JobStatus.IN_PROGRESS } });
  }

  async completeJob(clientId: string, jobId: string) {
    const job = await this.prisma.serviceJob.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundException('Trabajo no encontrado');
    if (job.clientId !== clientId) throw new ForbiddenException('No autorizado');
    if (job.status !== JobStatus.IN_PROGRESS) throw new BadRequestException('El trabajo no está en progreso');

    await this.prisma.serviceRequest.update({
      where: { id: job.requestId },
      data: { status: ServiceRequestStatus.COMPLETED },
    });

    await this.prisma.contractorProfile.update({
      where: { id: job.contractorId },
      data: { totalJobs: { increment: 1 } },
    });

    return this.prisma.serviceJob.update({
      where: { id: jobId },
      data: { status: JobStatus.COMPLETED, completedAt: new Date() },
    });
  }

  async rateJob(userId: string, jobId: string, dto: RateJobDto) {
    const job = await this.prisma.serviceJob.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundException('Trabajo no encontrado');
    if (job.status !== JobStatus.COMPLETED) throw new BadRequestException('Solo podés calificar trabajos completados');

    const contractor = await this.prisma.contractorProfile.findUnique({ where: { userId } });
    const isClient = job.clientId === userId;
    const isContractor = contractor?.id === job.contractorId;

    if (!isClient && !isContractor) throw new ForbiddenException('No autorizado');

    const updateData = isClient ? { clientRating: dto.rating } : { contractorRating: dto.rating };
    return this.prisma.serviceJob.update({ where: { id: jobId }, data: updateData });
  }

  async cancelJob(userId: string, jobId: string, dto: CancelJobDto) {
    const job = await this.prisma.serviceJob.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundException('Trabajo no encontrado');

    const contractor = await this.prisma.contractorProfile.findUnique({ where: { userId } });
    const isClient = job.clientId === userId;
    const isContractor = contractor?.id === job.contractorId;

    if (!isClient && !isContractor) throw new ForbiddenException('No autorizado');
    if (job.status === JobStatus.COMPLETED || job.status === JobStatus.CANCELLED) {
      throw new BadRequestException('No se puede cancelar');
    }

    await this.prisma.serviceRequest.update({
      where: { id: job.requestId },
      data: { status: ServiceRequestStatus.CANCELLED },
    });

    return this.prisma.serviceJob.update({
      where: { id: jobId },
      data: { status: JobStatus.CANCELLED, cancelReason: dto.reason },
    });
  }

  async getMyJobs(userId: string) {
    const contractor = await this.prisma.contractorProfile.findUnique({ where: { userId } });
    const where = contractor
      ? { OR: [{ clientId: userId }, { contractorId: contractor.id }] }
      : { clientId: userId };

    return this.prisma.serviceJob.findMany({
      where,
      include: {
        request: { include: { category: true } },
        quote: true,
        contractor: { include: { user: { select: { id: true, name: true, avatarUrl: true, phone: true } } } },
        client: { select: { id: true, name: true, avatarUrl: true, phone: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getContractorOpenRequests(contractorUserId: string) {
    const contractor = await this.prisma.contractorProfile.findUnique({
      where: { userId: contractorUserId },
      include: { services: true },
    });
    if (!contractor) throw new NotFoundException('Perfil no encontrado');

    const categoryIds = contractor.services.map((s) => s.categoryId);

    return this.prisma.serviceRequest.findMany({
      where: {
        categoryId: { in: categoryIds },
        status: { in: [ServiceRequestStatus.OPEN, ServiceRequestStatus.QUOTED] },
      },
      include: {
        category: true,
        client: { select: { id: true, name: true, avatarUrl: true } },
        _count: { select: { quotes: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
