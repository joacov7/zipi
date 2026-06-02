import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async saveMessage(tripId: string, senderId: string, senderName: string, content: string) {
    return this.prisma.tripMessage.create({
      data: { tripId, senderId, senderName, content },
    });
  }

  async getMessages(tripId: string) {
    return this.prisma.tripMessage.findMany({
      where: { tripId },
      orderBy: { createdAt: 'asc' },
    });
  }
}
