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

  async chatAnalytics(days: number) {
    const start = new Date();
    start.setDate(start.getDate() - days + 1);

    const [conversationCount, messageCount, chats] = await Promise.all([
      this.prisma.conversation.count(),
      this.prisma.chat.count(),
      this.prisma.chat.findMany({
        where: {
          role: 'user',
          createdAt: {
            gte: start,
          },
        },
        select: {
          createdAt: true,
        },
      }),
    ]);

    const map = new Map<string, number>();

    for (let i = 0; i < days; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);

      map.set(d.toISOString().slice(0, 10), 0);
    }

    for (const chat of chats) {
      const key = chat.createdAt.toISOString().slice(0, 10);
      map.set(key, (map.get(key) ?? 0) + 1);
    }

    return {
      totalConversations: conversationCount,
      totalMessages: messageCount,
      dailyChats: [...map.entries()].map(([date, value]) => ({
        date,
        value,
      })),
    };
  }
}
