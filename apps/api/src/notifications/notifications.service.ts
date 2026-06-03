import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import Expo, { ExpoPushMessage } from 'expo-server-sdk';

const expo = new Expo();

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private prisma: PrismaService) {}

  async registerToken(userId: string, token: string, platform: string) {
    return this.prisma.pushToken.upsert({
      where: { token },
      update: { userId, platform },
      create: { userId, token, platform },
    });
  }

  async removeToken(userId: string, token: string) {
    await this.prisma.pushToken.deleteMany({ where: { token, userId } });
  }

  async sendToUser(userId: string, title: string, body: string, data?: Record<string, any>) {
    const tokens = await this.prisma.pushToken.findMany({ where: { userId } });
    if (!tokens.length) return;

    const expoTokens = tokens.filter((t) => t.platform === 'expo' && Expo.isExpoPushToken(t.token));

    if (expoTokens.length) {
      const messages: ExpoPushMessage[] = expoTokens.map((t) => ({
        to: t.token,
        title,
        body,
        data: data ?? {},
        sound: 'default',
      }));

      try {
        const chunks = expo.chunkPushNotifications(messages);
        for (const chunk of chunks) {
          const receipts = await expo.sendPushNotificationsAsync(chunk);
          for (const receipt of receipts) {
            if (receipt.status === 'error') {
              this.logger.warn(`Push error: ${receipt.message}`);
              if (receipt.details?.error === 'DeviceNotRegistered') {
                const failedToken = expoTokens.find((t) =>
                  messages.some((m) => m.to === t.token)
                );
                if (failedToken) await this.removeToken(failedToken.userId, failedToken.token);
              }
            }
          }
        }
      } catch (err) {
        this.logger.error('Failed to send push notifications', err);
      }
    }
  }

  async sendToUsers(userIds: string[], title: string, body: string, data?: Record<string, any>) {
    await Promise.all(userIds.map((id) => this.sendToUser(id, title, body, data)));
  }
}
