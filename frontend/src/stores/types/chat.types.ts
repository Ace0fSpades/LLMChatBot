import type { ChatSession } from '@/types/chat.types';
import type { Message } from '@/types/message.types';

/**
 * Chat state interface
 */
export interface ChatState {
  sessions: ChatSession[];
  archivedSessions: ChatSession[];
  currentSession: ChatSession | null;
  currentMessages: Message[];
  loading: boolean;
  archivedLoading: boolean;
  error: string | null;
  isStreaming: boolean;
  streamingMessage: string;
}

