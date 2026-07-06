import { Module } from '@nestjs/common';
import { AiJobController } from './ai-job.controller';
import { AiJobService } from './ai-job.service';

@Module({
  controllers: [AiJobController],
  providers: [AiJobService],
})
export class AiJobModule {}
