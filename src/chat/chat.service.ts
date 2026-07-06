import {
  Injectable,
  Logger,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/PrismaService/prisma.service';
import { SendMessageDto } from './dto/send-message.dto';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { AiCoreClientService } from '../common/services/ai-core-client.service';
import type {
  AiCoreMessage,
  AiCoreStreamChunk,
  AiCoreTokenUsage,
} from '../common/types/ai-core.types';

// ==============================
// INPUT TYPES
// ==============================
type SendMessageInput = SendMessageDto & {
  userId: number;
};

type CreateConversationInput = CreateConversationDto & {
  userId: number;
};

/** Number of recent messages to send as context to AI-Core */
const RECENT_MESSAGES_LIMIT = 10;

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiCore: AiCoreClientService,
  ) {}

  // ==============================
  // LIST CONVERSATIONS
  // ==============================
  conversations(userId?: number) {
    return this.prisma.conversation.findMany({
      where: userId ? { userId } : undefined,
      include: {
        chats: {
          select: {
            id: true,
            conversationId: true,
            role: true,
            message: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  // ==============================
  // CREATE CONVERSATION
  // ==============================
  async createConversation(dto: CreateConversationInput) {
    return this.prisma.conversation.create({
      data: {
        title: dto.title ?? 'New Chat',
        userId: dto.userId,
      },
      include: {
        chats: {
          select: {
            id: true,
            conversationId: true,
            role: true,
            message: true,
            createdAt: true,
          },
        },
      },
    });
  }

  // ==============================
  // GET SINGLE CONVERSATION
  // ==============================
  async conversation(id: number, userId: number) {
    return this.prisma.conversation.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        chats: {
          select: {
            id: true,
            conversationId: true,
            role: true,
            message: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });
  }

  // ==============================
  // SEND MESSAGE (NON-STREAM)
  // ==============================
  async send(conversationId: number, dto: SendMessageInput) {
    // 1. Verify conversation exists
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });
    if (!conversation) throw new NotFoundException('Conversation not found');

    // 2. Save user message to DB
    const userMsg = await this.prisma.chat.create({
      data: {
        conversationId,
        role: 'user',
        message: dto.message,
        metadata: {},
      },
    });

    // 3. Load recent messages for context
    const recentChats = await this.prisma.chat.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: RECENT_MESSAGES_LIMIT,
    });

    // Reverse to chronological order, exclude the current message (already in current_message)
    const recentMessages: AiCoreMessage[] = recentChats
      .reverse()
      .filter((c) => c.id !== userMsg.id)
      .map((c) => ({
        id: String(c.id),
        role: c.role as 'user' | 'assistant' | 'system',
        content: c.message,
      }));

    const currentMessage: AiCoreMessage = {
      id: String(userMsg.id),
      role: 'user',
      content: dto.message,
    };

    // 4. Call AI-Core internal chat
    try {
      const aiResponse = await this.aiCore.chatInternal({
        conversation_id: String(conversationId),
        user_id: String(dto.userId),
        recent_messages: recentMessages,
        current_message: currentMessage,
      });

      // 5. Extract assistant content from response
      const rawResponse = aiResponse as unknown as Record<string, unknown>;
      const assistantContent = this.extractAssistantContent(rawResponse);
      const metadata = this.buildMetadata(rawResponse);

      // 6. Save assistant message to DB
      const assistantMsg = await this.prisma.chat.create({
        data: {
          conversationId,
          role: 'assistant',
          message: assistantContent,
          metadata: metadata as Prisma.InputJsonValue,
        },
      });

      // 7. Touch conversation to update updatedAt (Prisma @updatedAt auto-handles)
      await this.prisma.conversation.update({
        where: { id: conversationId },
        data: { title: conversation.title },
      });

      return {
        conversationId,
        userMessage: {
          id: userMsg.id,
          role: userMsg.role,
          content: userMsg.message,
        },
        assistantMessage: {
          id: assistantMsg.id,
          role: assistantMsg.role,
          content: assistantMsg.message,
        },
      };
    } catch (error) {
      this.logger.error(
        `AI-Core chat failed for conversation ${conversationId}: ${
          error instanceof Error ? error.message : error
        }`,
      );
      throw new InternalServerErrorException(
        'Failed to process chat message with AI service',
      );
    }
  }

  // ==============================
  // SEND MESSAGE (SSE STREAM)
  // ==============================
  async *sendStream(
    conversationId: number,
    dto: SendMessageInput,
  ): AsyncGenerator<string> {
    // 1. Verify conversation exists
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });
    if (!conversation) throw new NotFoundException('Conversation not found');

    // 2. Save user message to DB
    const userMsg = await this.prisma.chat.create({
      data: {
        conversationId,
        role: 'user',
        message: dto.message,
        metadata: {},
      },
    });

    // 3. Load recent messages for context
    const recentChats = await this.prisma.chat.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: RECENT_MESSAGES_LIMIT,
    });

    const recentMessages: AiCoreMessage[] = recentChats
      .reverse()
      .filter((c) => c.id !== userMsg.id)
      .map((c) => ({
        id: String(c.id),
        role: c.role as 'user' | 'assistant' | 'system',
        content: c.message,
      }));

    const currentMessage: AiCoreMessage = {
      id: String(userMsg.id),
      role: 'user',
      content: dto.message,
    };

    // 4. Stream from AI-Core, forward chunks to client, accumulate content
    let fullContent = '';
    let tokenUsage: AiCoreTokenUsage | null = null;
    let latencyMs = 0;
    let isError = false;
    let errorCode: string | null = null;

    try {
      const stream = this.aiCore.chatStreamInternal({
        conversation_id: String(conversationId),
        user_id: String(dto.userId),
        recent_messages: recentMessages,
        current_message: currentMessage,
      });

      for await (const chunk of stream) {
        // Extract metadata from final chunk (done=true) before we strip it
        if (chunk.done) {
          if (chunk.token_usage) tokenUsage = chunk.token_usage;
          if (chunk.latency_ms) latencyMs = chunk.latency_ms;
          if (chunk.is_error) isError = chunk.is_error;
          if (chunk.error_code) errorCode = chunk.error_code;
        }

        // Forward every chunk as SSE to client but omit internal metadata
        const safeChunk: Record<string, any> = { ...chunk };
        delete safeChunk.token_usage;
        delete safeChunk.latency_ms;
        delete safeChunk.is_error;
        delete safeChunk.error_code;
        yield `data: ${JSON.stringify(safeChunk)}\n\n`;

        // Accumulate content from non-done chunks
        if (chunk.content && !chunk.done) {
          fullContent += chunk.content;
        }
      }

      // 5. Save full assistant response to DB after stream completes
      if (fullContent || isError) {
        const metadata = this.buildStreamMetadata(
          tokenUsage,
          latencyMs,
          isError,
          errorCode,
        );

        await this.prisma.chat.create({
          data: {
            conversationId,
            role: 'assistant',
            message: fullContent || '[Stream error - no content]',
            metadata: metadata as Prisma.InputJsonValue,
          },
        });

        // Touch conversation to update updatedAt (Prisma @updatedAt auto-handles)
        await this.prisma.conversation.update({
          where: { id: conversationId },
          data: { title: conversation.title },
        });
      }
    } catch (error) {
      this.logger.error(
        `AI-Core stream failed for conversation ${conversationId}: ${
          error instanceof Error ? error.message : error
        }`,
      );

      // Send error event to client
      const errorChunk: AiCoreStreamChunk = {
        content:
          'Xin lỗi, hệ thống đang bận hoặc đã hết hạn mức. Vui lòng thử lại sau.',
        done: true,
        is_error: true,
        error_code: 'STREAM_ERROR',
      };
      yield `data: ${JSON.stringify(errorChunk)}\n\n`;
    }
  }

  // ==============================
  // DELETE CONVERSATION
  // ==============================
  async removeConversation(id: number) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id },
    });
    if (!conversation) throw new NotFoundException('Conversation not found');

    // Delete chats first (foreign key constraint)
    await this.prisma.chat.deleteMany({ where: { conversationId: id } });
    await this.prisma.conversation.delete({ where: { id } });
    return { id };
  }

  // ==============================
  // PRIVATE HELPERS
  // ==============================

  /** Extract assistant text content from AI-Core ChatResponse */
  private extractAssistantContent(response: Record<string, unknown>): string {
    const normalMessages = response.normal_messages as
      Array<{ content?: string; role?: string }> | undefined;

    if (normalMessages && normalMessages.length > 0) {
      // Get the last assistant message
      const assistantMsg = normalMessages
        .filter((m) => m.role === 'assistant')
        .pop();

      if (assistantMsg?.content) {
        return assistantMsg.content;
      }

      // Fallback: get last message regardless of role
      const lastMsg = normalMessages[normalMessages.length - 1];
      return lastMsg?.content || 'Không nhận được phản hồi từ AI.';
    }

    return 'Không nhận được phản hồi từ AI.';
  }

  /** Build metadata object from non-stream AI-Core response */
  private buildMetadata(
    response: Record<string, unknown>,
  ): Record<string, unknown> {
    const metadata: Record<string, unknown> = {};

    if (response.token_usage) {
      metadata.token_usage = response.token_usage;
    }
    if (response.latency_ms) {
      metadata.latency_ms = response.latency_ms;
    }
    if (response.is_error) {
      metadata.is_error = response.is_error;
    }
    if (response.error_code) {
      metadata.error_code = response.error_code;
    }

    return metadata;
  }

  /** Build metadata from stream final chunk */
  private buildStreamMetadata(
    tokenUsage: AiCoreTokenUsage | null,
    latencyMs: number,
    isError: boolean,
    errorCode: string | null,
  ): Record<string, unknown> {
    const metadata: Record<string, unknown> = {};

    if (tokenUsage) metadata.token_usage = tokenUsage;
    if (latencyMs) metadata.latency_ms = latencyMs;
    if (isError) metadata.is_error = isError;
    if (errorCode) metadata.error_code = errorCode;

    return metadata;
  }

  async chatAnalytics(days: number) {
    const start = new Date();
    start.setDate(start.getDate() - days + 1);
    start.setHours(0, 0, 0, 0);

    const [conversationCount, messageCount, chats, products, histories, posts] =
      await Promise.all([
        this.prisma.conversation.count(),
        this.prisma.chat.count(),
        this.prisma.chat.findMany({
          where: {
            createdAt: {
              gte: start,
            },
          },
          select: {
            role: true,
            createdAt: true,
            metadata: true,
          },
        }),
        this.prisma.product.findMany({
          select: { quantity: true },
        }),
        this.prisma.inventoryHistory.findMany({
          where: {
            createdAt: { gte: start },
          },
          select: {
            type: true,
            changeQuantity: true,
            createdAt: true,
          },
        }),
        this.prisma.socialPost.findMany({
          where: {
            createdAt: { gte: start },
          },
          select: {
            createdAt: true,
          },
        }),
      ]);

    const currentInventory = products.reduce((acc, p) => acc + p.quantity, 0);

    const map = new Map<
      string,
      { chats: number; tokens: number; inventoryChange: number; posts: number }
    >();

    const formatDate = (date: Date) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    };

    for (let i = 0; i < days; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      map.set(formatDate(d), {
        chats: 0,
        tokens: 0,
        inventoryChange: 0,
        posts: 0,
      });
    }

    // Process Chats & Tokens
    for (const chat of chats) {
      const key = formatDate(chat.createdAt);
      const entry = map.get(key);
      if (entry) {
        if (chat.role === 'user') {
          entry.chats += 1;
        }
        if (chat.role === 'assistant' && chat.metadata) {
          const meta = chat.metadata as {
            token_usage?: { total_tokens?: number };
            total_tokens?: number;
          };
          const tokens = meta?.token_usage?.total_tokens || meta?.total_tokens;
          if (tokens) {
            entry.tokens += tokens;
          }
        }
      }
    }

    // Process Inventory Histories
    for (const history of histories) {
      const key = formatDate(history.createdAt);
      const entry = map.get(key);
      if (entry) {
        if (history.type === 'IN') {
          entry.inventoryChange += history.changeQuantity;
        } else if (history.type === 'OUT') {
          entry.inventoryChange -= history.changeQuantity;
        }
      }
    }

    // Process Marketing Posts
    for (const post of posts) {
      const key = formatDate(post.createdAt);
      const entry = map.get(key);
      if (entry) {
        entry.posts += 1;
      }
    }

    // Calculate daily series
    const dailyChats: { date: string; value: number }[] = [];
    const tokenUsage: { date: string; value: number }[] = [];
    const marketing: { date: string; value: number }[] = [];
    const inventory: { date: string; value: number }[] = [];

    // Reconstruct inventory going backwards
    let invTracker = currentInventory;
    const sortedEntries = [...map.entries()].sort((a, b) =>
      a[0] > b[0] ? -1 : 1,
    ); // newest to oldest

    for (const [date, data] of sortedEntries) {
      // Store current day inventory (before subtracting today's changes for yesterday)
      inventory.unshift({ date, value: invTracker });
      invTracker -= data.inventoryChange; // rollback to previous day
    }

    for (const [date, data] of map.entries()) {
      dailyChats.push({ date, value: data.chats });
      tokenUsage.push({ date, value: data.tokens });
      marketing.push({ date, value: data.posts }); // Maybe multiply by 1000 for impressions if needed?
    }

    return {
      totalConversations: conversationCount,
      totalMessages: messageCount,
      dailyChats,
      inventory,
      marketing,
      tokenUsage,
    };
  }
}
