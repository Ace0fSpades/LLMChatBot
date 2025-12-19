/**
 * Message response
 */
export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  tokens: number;
  is_incomplete: boolean;
  created_at: string;
  sequence_number: number;
}

/**
 * SSE message event types
 */
export type SSEMessageType = 'token' | 'complete' | 'error';

/**
 * SSE message event
 */
export interface SSEMessageEvent {
  type: SSEMessageType;
  content?: string;
  tokens?: number;
  error?: string;
}

