// ==============================
// AI-Core Response / Payload Types
// ==============================

/** Message format AI-Core expects (InternalChatMessage) */
export interface AiCoreMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/** Payload for /chatbot/chat/internal */
export interface AiCoreInternalChatPayload {
  conversation_id: string;
  user_id?: string;
  recent_messages: AiCoreMessage[];
  current_message: AiCoreMessage;
  extra_state?: Record<string, any>;
}

/** Token usage returned by AI-Core */
export interface AiCoreTokenUsage {
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  llm_calls?: number;
  provider?: string;
  model?: string;
}

/** Normal message in AI-Core response */
export interface AiCoreNormalMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: number;
}

/** Full ChatResponse from AI-Core /chat/internal */
export interface AiCoreChatResponse {
  normal_messages?: AiCoreNormalMessage[] | null;
  token_usage?: AiCoreTokenUsage | null;
  latency_ms: number;
  is_error: boolean;
  error_code?: string | null;
}

/** SSE chunk from AI-Core /chat/stream/internal */
export interface AiCoreStreamChunk {
  event?: string;
  content?: string;
  done?: boolean;
  node?: string;
  message?: string;
  token_usage?: AiCoreTokenUsage | null;
  latency_ms?: number;
  is_error?: boolean;
  error_code?: string | null;
}
