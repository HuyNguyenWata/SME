import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/PrismaModule/prisma.module';
import { N8NController } from './n8n.controller';
import { N8NService } from './n8n.service';

@Module({
  imports: [PrismaModule],
  controllers: [N8NController],
  providers: [N8NService],
})
export class N8NModule {}
