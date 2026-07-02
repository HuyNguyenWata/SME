import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/PrismaModule/prisma.module';
import { PromptsController } from './prompts.controller';
import { PromptsService } from './prompts.service';

@Module({
  imports: [PrismaModule],
  controllers: [PromptsController],
  providers: [PromptsService],
})
export class PromptsModule {}
