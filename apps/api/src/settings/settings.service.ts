import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AppModule } from '@zipi/shared';

const ALL_MODULES = Object.values(AppModule);

@Injectable()
export class SettingsService implements OnModuleInit {
  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    for (const key of ALL_MODULES) {
      await this.prisma.appSetting.upsert({
        where: { key },
        create: { key, value: 'true' },
        update: {},
      });
    }
  }

  async getModules(): Promise<Record<string, boolean>> {
    const settings = await this.prisma.appSetting.findMany({
      where: { key: { in: ALL_MODULES } },
    });
    const result: Record<string, boolean> = {};
    for (const key of ALL_MODULES) {
      const found = settings.find((s) => s.key === key);
      result[key] = found ? found.value === 'true' : true;
    }
    return result;
  }

  async setModule(key: string, enabled: boolean): Promise<Record<string, boolean>> {
    await this.prisma.appSetting.upsert({
      where: { key },
      create: { key, value: String(enabled) },
      update: { value: String(enabled) },
    });
    return this.getModules();
  }
}
