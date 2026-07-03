import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/PrismaService/prisma.service';
import { SendMessageDto } from './dto/send-message.dto';
import { CreateConversationDto } from './dto/create-conversation.dto';

type SendMessageInput = SendMessageDto & {
  userId: number;
};

type CreateConversationInput = CreateConversationDto & {
  userId: number;
};

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  conversations(userId?: number) {
    return this.prisma.conversation.findMany({
      where: userId ? { userId } : undefined,
      include: {
        chats: {
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createConversation(dto: CreateConversationInput) {
    return this.prisma.conversation.create({
      data: {
        title: dto.title ?? 'New Chat',
        userId: dto.userId,
      },
      include: {
        chats: true,
      },
    });
  }

  async send(conversationId: number, dto: SendMessageInput) {
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
        ? `I found ${related.length} product(s): ${related
            .map((p) => p.name)
            .join(', ')}.`
        : `I couldn't find matching products.`;

    const [userMsg, assistantMsg] = await this.prisma.$transaction([
      this.prisma.chat.create({
        data: {
          conversationId,
          role: 'user', // ✅ FIX lowercase
          message: dto.message,
          metadata: {},
        },
      }),
      this.prisma.chat.create({
        data: {
          conversationId,
          role: 'assistant', // ✅ FIX lowercase
          message: answer,
          metadata: {
            products: related, // ✅ FE cần object luôn
          },
        },
      }),
    ]);

    return {
      conversationId,
      message: {
        id: assistantMsg.id,
        role: assistantMsg.role,
        content: assistantMsg.message,
        products: related,
      },
    };
  }

  async removeConversation(id: number) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id },
    });
    if (!conversation) throw new NotFoundException('Conversation not found');
    await this.prisma.conversation.delete({ where: { id } });
    return { id };
  }

  async conversation(id: number, userId: number) {
    return this.prisma.conversation.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        chats: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });
  }
}
