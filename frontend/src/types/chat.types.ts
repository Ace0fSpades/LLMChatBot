/**
 * Chat session response
 */
export interface ChatSession {
  id: string;
  title: string;
  model_used: string;
  created_at: string;
  updated_at: string;
  is_archived: boolean;
  message_count?: number;
}

/**
 * Create chat session request
 */
export interface CreateChatSessionRequest {
  title?: string;
  model_used?: string;
}

/**
 * Update chat session request
 */
export interface UpdateChatSessionRequest {
  title: string;
}

import type { Message } from './message.types';

/**
 * Chat session with messages
 */
export interface ChatSessionWithMessages extends ChatSession {
  messages: Message[];
}

