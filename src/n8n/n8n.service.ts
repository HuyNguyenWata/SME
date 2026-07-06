import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PublishDto } from './dto/n8n.request.dto';

@Injectable()
export class N8NService {
  private readonly logger = new Logger(N8NService.name);

  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly webhookUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = this.configService.getOrThrow<string>('N8N_URL');
    this.apiKey = this.configService.getOrThrow<string>('N8N_API_KEY');
    this.webhookUrl = this.configService.getOrThrow<string>('N8N_WEBHOOK_URL');
  }
  async publish(dto: PublishDto) {
    try {
      console.log('webhookUrlwebhookUrlwebhookUrlwebhookUrl', this.webhookUrl);

      const res = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dto),
        signal: AbortSignal.timeout(30000),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        this.logger.error(
          `Publish n8n failed: ${res.status} ${res.statusText}`,
          JSON.stringify(data),
        );

        throw new InternalServerErrorException(data ?? 'Publish to n8n failed');
      }

      return data;
    } catch (error: any) {
      this.logger.error(
        `Publish n8n failed: ${error.message}`,
        JSON.stringify(error),
      );

      throw new InternalServerErrorException(
        error?.message ?? 'Publish to n8n failed',
      );
    }
  }
}
