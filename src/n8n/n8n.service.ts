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
} from './dto/n8n.request.dto';

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

    const today = new Date().toISOString().split('T')[0];
    const key = `ai_create_usage:${userId}:${today}`;

    const currentUsage = await this.redisService.incrementWithExpire(
      key,
      86400,
    );

    if (currentUsage > limit) {
      await this.redisService.getClient().decr(key);
      throw new HttpException(
        'Bạn đã vượt quá số lần tạo bài đăng bằng AI trong hôm nay.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  async createContent({ productId, note }: ContentDto, userId: number) {
    const today = new Date().toISOString().split('T')[0];
    const key = `ai_create_usage:${userId}:${today}`;
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

  async instantSubmit({ userId }: InstantSubmitDto) {
    try {
      const form = new FormData();

      form.append('user_id', String(userId));

      const res = await fetch(this.webhooInstant, {
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
      console.error('createContent error:', error);
      throw error;
    }
  }
}
