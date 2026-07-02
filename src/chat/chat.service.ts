import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/PrismaService/prisma.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  conversations(userId?: number) {
    return this.prisma.conversation.findMany({
      where: userId ? { userId } : undefined,
      include: { chats: { orderBy: { createdAt: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  createConversation(dto: CreateConversationDto) {
    return this.prisma.conversation.create({ data: dto });
  }

  async send(conversationId: number, dto: SendMessageDto) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });
    if (!conversation) throw new NotFoundException('Conversation not found');

    const related = await this.prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: dto.message, mode: 'insensitive' } },
          { description: { contains: dto.message, mode: 'insensitive' } },
          { sku: { contains: dto.message, mode: 'insensitive' } },
        ],
      },
      take: 4,
    });
    const answer =
      related.length > 0
        ? `I found ${related.length} matching product(s): ${related
            .map((product) => product.name)
            .join(', ')}.`
        : 'I could not find a direct product match. Try a product name, SKU, or inventory keyword.';

    const [, assistant] = await this.prisma.$transaction([
      this.prisma.chat.create({
        data: {
          conversationId,
          role: 'USER',
          message: dto.message,
          metadata: {},
        },
      }),
      this.prisma.chat.create({
        data: {
          conversationId,
          role: 'ASSISTANT',
          message: answer,
          metadata: { productIds: related.map((product) => product.id) },
        },
      }),
    ]);

    return { assistant, relatedProducts: related };
  }

  async removeConversation(id: number) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id },
    });
    if (!conversation) throw new NotFoundException('Conversation not found');
    await this.prisma.conversation.delete({ where: { id } });
    return { id };
  }
}
