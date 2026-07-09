import { Module } from '@nestjs/common';
import { AiConfigController } from './ai-config.controller';
import { AiConfigService } from './ai-config.service';

@Module({
  controllers: [AiConfigController],
  providers: [AiConfigService],
})
export class AiConfigModule {}
