import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PublishDto } from './dto/n8n.request.dto';

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

  constructor(private readonly configService: ConfigService) {
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
}
