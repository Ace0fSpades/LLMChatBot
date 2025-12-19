import { useCallback } from 'react';
import { useAppSelector } from './redux';
import { selectAccessToken } from '@/stores';
import { streamingApi } from '@/services/api/streamingApi';
import type { SSEMessageEvent } from '@/types/message.types';

/**
 * Hook for managing chat streaming via SSE
 */
export const useChatStream = () => {
  const accessToken = useAppSelector(selectAccessToken);

  /**
   * Start streaming chat response
   */
  const startStream = useCallback(
    async (
      sessionId: string,
      message: string,
      onTokenReceived: (token: string) => void,
      onComplete: () => void,
      onError: (error: Error) => void
    ) => {
      if (!accessToken) {
        onError(new Error('Not authenticated'));
        return;
      }

      await streamingApi.startStream(
        sessionId,
        message,
        accessToken,
        (event: SSEMessageEvent) => {
          if (event.type === 'token' && event.content) {
            onTokenReceived(event.content);
          } else if (event.type === 'complete') {
            onComplete();
          } else if (event.type === 'error') {
            onError(new Error(event.error || 'Stream error'));
          }
        },
        (error: Error) => {
          onError(error);
        },
        () => {
          onComplete();
        }
      );
    },
    [accessToken]
  );

  /**
   * Stop streaming
   */
  const stopStream = useCallback(() => {
    streamingApi.stopStream();
  }, []);

  /**
   * Check if streaming is active
   */
  const isStreaming = useCallback(() => {
    return streamingApi.isStreamingActive();
  }, []);

  return {
    startStream,
    stopStream,
    isStreaming,
  };
};

