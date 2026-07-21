import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/PrismaService/prisma.service';
import { UpsertMetaAppConfigDto } from '../dto/upsert-meta-app-config.dto';

const APP_ID_KEY = 'META_APP_ID';
const APP_SECRET_KEY = 'META_APP_SECRET';
const GRAPH_VERSION_KEY = 'META_GRAPH_API_VERSION';

export interface MetaAppConfig {
  appId: string;
  appSecret: string;
  graphApiVersion: string;
}

/**
 * The single Meta (Facebook/Instagram) App shared by the whole platform.
 * Configured once by the platform owner via /auth/facebook-login-config,
 * and used both for storefront "Login with Facebook" and for admin
 * Facebook Page / Instagram connect.
 */
@Injectable()
export class MetaAppConfigService {
  constructor(private readonly prisma: PrismaService) {}

  async getConfig(): Promise<MetaAppConfig | null> {
    const rows = await this.prisma.setting.findMany({
      where: { key: { in: [APP_ID_KEY, APP_SECRET_KEY, GRAPH_VERSION_KEY] } },
    });
    const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    const appId = map[APP_ID_KEY];
    const appSecret = map[APP_SECRET_KEY];
    if (!appId || !appSecret) return null;

    return {
      appId,
      appSecret,
      graphApiVersion: map[GRAPH_VERSION_KEY] || 'v23.0',
    };
  }

  async getPublicConfig(): Promise<{
    appId: string;
    graphApiVersion: string;
  } | null> {
    const config = await this.getConfig();
    if (!config) return null;
    return { appId: config.appId, graphApiVersion: config.graphApiVersion };
  }

  async upsertConfig(dto: UpsertMetaAppConfigDto) {
    const existing = await this.getConfig();
    if (!existing && !dto.appSecret) {
      throw new BadRequestException(
        'appSecret is required when setting up the Meta App',
      );
    }

    await this.prisma.setting.upsert({
      where: { key: APP_ID_KEY },
      create: { key: APP_ID_KEY, value: dto.appId },
      update: { value: dto.appId },
    });

    if (dto.appSecret) {
      await this.prisma.setting.upsert({
        where: { key: APP_SECRET_KEY },
        create: { key: APP_SECRET_KEY, value: dto.appSecret },
        update: { value: dto.appSecret },
      });
    }

    await this.prisma.setting.upsert({
      where: { key: GRAPH_VERSION_KEY },
      create: { key: GRAPH_VERSION_KEY, value: dto.graphApiVersion || 'v23.0' },
      update: {
        value: dto.graphApiVersion || existing?.graphApiVersion || 'v23.0',
      },
    });

    return this.getPublicConfig();
  }

  async removeConfig() {
    await this.prisma.setting.deleteMany({
      where: { key: { in: [APP_ID_KEY, APP_SECRET_KEY, GRAPH_VERSION_KEY] } },
    });
    return { status: 'ok' };
  }
}
