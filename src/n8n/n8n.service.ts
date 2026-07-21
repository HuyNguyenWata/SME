import {
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/PrismaService/prisma.service';
import { RedisService } from '../redis/redis.service';
import {
  PublishDto,
  ContentDto,
  InstantSubmitDto,
  WebhookPostSuccessDto,
} from './dto/n8n.request.dto';
import { NotificationsService } from '../notifications/notifications.service';

type ApiResponse<T = unknown> = {
  statusCode: number;
  message: string;
  data: T;
};

type WorkflowStartData = {
  message: string;
};

@Injectable()
export class N8NService {
  private readonly logger = new Logger(N8NService.name);
  private readonly webhookUrl: string;
  private readonly webhooInstant: string;
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
    private readonly notificationsService: NotificationsService,
  ) {
    this.webhookUrl = this.configService.getOrThrow<string>(
      'N8N_WEBHOOK_CREATE_CONTENT_URL',
    );
    this.webhooInstant = this.configService.getOrThrow<string>(
      'N8N_WEBHOOK_URL_INSTANT',
    );
  }

  async publish(dto: PublishDto) {
    try {
      const res = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dto),
        signal: AbortSignal.timeout(30000),
      });

      const data = (await res.json()) as ApiResponse<WorkflowStartData>;
      if (!res.ok) {
        this.logger.error(
          `Publish n8n failed: ${res.status} ${res.statusText}`,
          JSON.stringify(data),
        );

        throw new InternalServerErrorException(data ?? 'Publish to n8n failed');
      }

      return data;
    } catch (error: any) {
      this.logger.error(`Publish n8n failed: ${error}`, JSON.stringify(error));

      throw new InternalServerErrorException(error ?? 'Publish to n8n failed');
    }
  }

  private async checkQuota(userId: number) {
    let limit = 5;

    try {
      const setting = await this.prisma.setting.findUnique({
        where: { key: 'AI_CREATE_LIMIT' },
      });
      if (setting) {
        limit = parseInt(setting.value, 10) || 5;
      }
    } catch (e) {
      this.logger.error('Failed to get AI_CREATE_LIMIT', e);
    }

    const monthStr = new Date().toISOString().slice(0, 7);
    const key = `ai_create_usage:${userId}:${monthStr}`;

    const currentUsage = await this.redisService.incrementWithExpire(
      key,
      2592000,
    );

    if (currentUsage > limit) {
      await this.redisService.getClient().decr(key);
      throw new HttpException(
        'Bạn đã vượt quá số lần tạo bài đăng bằng AI trong tháng này.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  async createContent({ productId, note }: ContentDto, userId: number) {
    const monthStr = new Date().toISOString().slice(0, 7);
    const key = `ai_create_usage:${userId}:${monthStr}`;
    try {
      await this.checkQuota(userId);

      const form = new FormData();

      form.append('product_id', String(productId));
      form.append('note', note ?? '');

      const res = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
        },
        body: form,
        signal: AbortSignal.timeout(30000),
      });

      const text = await res.text();

      if (!res.ok) {
        throw new Error(text);
      }

      return JSON.parse(text) as unknown;
    } catch (error) {
      if (!(error instanceof HttpException)) {
        await this.redisService.getClient().decr(key);
      }
      console.error('createContent error:', error);
      throw error;
    }
  }

  private async checkAIPostQuota(userId: number) {
    let limit = 50;

    try {
      const setting = await this.prisma.setting.findUnique({
        where: { key: 'AI_POST_LIMIT' },
      });
      if (setting) {
        limit = parseInt(setting.value, 10) || 50;
      }
    } catch (e) {
      this.logger.error('Failed to get AI_POST_LIMIT', e);
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    startOfMonth.setHours(0, 0, 0, 0);

    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const publishedCount = await this.prisma.socialPost.count({
      where: {
        status: 'PUBLISHED',
        productId: null,
        createdAt: {
          gte: startOfMonth,
          lt: endOfMonth,
        },
        generatedContent: {
          userId,
        },
      },
    });

    if (publishedCount >= limit) {
      throw new HttpException(
        'Bạn đã vượt quá số lượng bài đăng AI trong tháng này.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  async instantSubmit({ userId, configId, platformIds }: InstantSubmitDto) {
    await this.checkAIPostQuota(userId);

    try {
      const payload: {
        user_id: number;
        config_id: number;
        platforms?: { id: number; name: string }[];
      } = {
        user_id: userId,
        config_id: configId,
      };

      if (Array.isArray(platformIds) && platformIds.length > 0) {
        const platforms = await this.prisma.socialPlatform.findMany({
          where: {
            id: {
              in: platformIds,
            },
          },
          select: {
            id: true,
            name: true,
          },
        });

        if (platforms.length > 0) {
          payload.platforms = platforms;
        }
      }

      const res = await fetch(this.webhooInstant, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(30000),
      });

      const text = await res.text();

      if (!res.ok) {
        throw new Error(text);
      }

      return JSON.parse(text) as unknown;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('createContent error:', error);
      throw error;
    }
  }

  handlePostSuccessWebhook(dto: WebhookPostSuccessDto) {
    this.logger.log(
      `Received webhook from n8n for user ${dto.userId} with status ${dto.status}`,
    );
    this.notificationsService.sendToUser(dto.userId, {
      type: 'AI_POST_RESULT',
      data: {
        status: dto.status || 'success',
      },
    });

    return { success: true };
  }
}
