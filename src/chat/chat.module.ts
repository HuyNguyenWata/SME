import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/PrismaModule/prisma.module';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { AiCoreClientService } from '../common/services/ai-core-client.service';

@Module({
  imports: [PrismaModule],
  controllers: [ChatController],
  providers: [ChatService, AiCoreClientService],
})
export class ChatModule {}
