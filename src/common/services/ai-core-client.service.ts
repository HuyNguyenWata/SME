import { Injectable, Logger } from '@nestjs/common';
import {
  AiCoreChatResponse,
  AiCoreInternalChatPayload,
  AiCoreStreamChunk,
} from '../types/ai-core.types';

@Injectable()
export class AiCoreClientService {
  private readonly logger = new Logger(AiCoreClientService.name);
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl = process.env.AI_CORE_URL || 'http://localhost:8080';
  }

  // ==============================
  // NON-STREAM: /chatbot/chat/internal
  // ==============================
  async chatInternal(
    payload: AiCoreInternalChatPayload,
  ): Promise<AiCoreChatResponse> {
    const url = `${this.baseUrl}/api/v1/chatbot/chat/internal`;

    this.logger.log(
      `Calling AI-Core internal chat: conversation=${payload.conversation_id}`,
    );

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(
        `AI-Core /chat/internal failed: ${response.status} - ${errorText}`,
      );
      throw new Error(
        `AI-Core chat failed with status ${response.status}: ${errorText}`,
      );
    }

    return (await response.json()) as AiCoreChatResponse;
  }

  // ==============================
  // STREAM: /chatbot/chat/stream/internal
  // ==============================
  async *chatStreamInternal(
    payload: AiCoreInternalChatPayload,
  ): AsyncGenerator<AiCoreStreamChunk> {
    const url = `${this.baseUrl}/api/v1/chatbot/chat/stream/internal`;

    this.logger.log(
      `Calling AI-Core internal stream chat: conversation=${payload.conversation_id}`,
    );

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(
        `AI-Core /chat/stream/internal failed: ${response.status} - ${errorText}`,
      );
      throw new Error(
        `AI-Core stream chat failed with status ${response.status}: ${errorText}`,
      );
    }

    if (!response.body) {
      throw new Error('AI-Core stream response has no body');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Parse SSE lines: "data: {...}\n\n"
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data:')) continue;

          const jsonStr = trimmed.slice(5).trim(); // remove "data: "
          if (!jsonStr) continue;

          try {
            const chunk = JSON.parse(jsonStr) as AiCoreStreamChunk;
            yield chunk;
          } catch {
            this.logger.warn(`Failed to parse SSE chunk: ${jsonStr}`);
          }
        }
      }

      // Process any remaining buffer
      if (buffer.trim()) {
        const remaining = buffer.trim();
        if (remaining.startsWith('data:')) {
          const jsonStr = remaining.slice(5).trim();
          if (jsonStr) {
            try {
              const chunk = JSON.parse(jsonStr) as AiCoreStreamChunk;
              yield chunk;
            } catch {
              this.logger.warn(
                `Failed to parse remaining SSE chunk: ${jsonStr}`,
              );
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}
