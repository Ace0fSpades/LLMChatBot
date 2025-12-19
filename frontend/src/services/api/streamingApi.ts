import type { SSEMessageEvent } from '@/types/message.types';

/**
 * Streaming API service for Server-Sent Events
 * Uses fetch with ReadableStream to support custom headers for authentication
 */
export class StreamingApi {
  private abortController: AbortController | null = null;
  private isStreaming: boolean = false;

  /**
   * Start streaming chat response
   */
  async startStream(
    sessionId: string,
    message: string,
    accessToken: string,
    onMessage: (event: SSEMessageEvent) => void,
    onError: (error: Error) => void,
    onComplete: () => void
  ): Promise<void> {
    // Close existing connection if any
    this.stopStream();
    
    // Set streaming flag
    this.isStreaming = true;

    // Build URL with message parameter
    // Note: URLSearchParams automatically encodes the value, so we don't need encodeURIComponent
    const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
    const url = new URL(
      `/api/v1/stream/chat/${sessionId}`,
      apiBaseUrl
    );
    url.searchParams.append('message', message);

    // Create abort controller for cancellation
    this.abortController = new AbortController();

    // Declare variables outside try block so they're accessible in catch
    let eventCount = 0;
    let buffer = '';
    let totalBytes = 0;

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'text/event-stream',
        },
        signal: this.abortController.signal,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        console.error('Stream request failed:', response.status, errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      if (!response.body) {
        throw new Error('Response body is null');
      }

      console.log('SSE stream started, reading response...');
      console.log('Request URL:', url.toString());
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      buffer = '';
      eventCount = 0;
      totalBytes = 0;

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          console.log(`SSE: Stream ended (total events: ${eventCount}, total bytes: ${totalBytes})`);
          console.log(`SSE: Remaining buffer length: ${buffer.length}, content:`, JSON.stringify(buffer.substring(0, 200)));
          
          // Process any remaining complete events in buffer
          let eventEndIndex = buffer.indexOf('\n\n');
          while (eventEndIndex !== -1) {
            const eventText = buffer.substring(0, eventEndIndex);
            buffer = buffer.substring(eventEndIndex + 2);
            
            const trimmedEvent = eventText.trim();
            if (trimmedEvent) {
              const result = this.parseSSEEvent(trimmedEvent);
              if (result && result.eventData) {
                eventCount++;
                this.processSSEEvent(result.eventType, result.eventData, eventCount, onMessage, onError, onComplete);
              }
            }
            eventEndIndex = buffer.indexOf('\n\n');
          }
          
          // Process any remaining incomplete event (without \n\n)
          if (buffer.trim()) {
            console.log('SSE: Processing incomplete event from buffer:', buffer.substring(0, 200));
            const result = this.parseSSEEvent(buffer.trim());
            if (result && result.eventData) {
              eventCount++;
              this.processSSEEvent(result.eventType, result.eventData, eventCount, onMessage, onError, onComplete);
            }
          }
          
          if (eventCount === 0) {
            console.warn('SSE: No events received! Check backend logs.');
          }
          if (this.isStreaming) {
            this.isStreaming = false;
            onComplete();
          }
          break;
        }

        totalBytes += value.length;
        buffer += decoder.decode(value, { stream: true });
        
        // Log raw buffer for debugging (first few chunks)
        if (totalBytes < 500) {
          console.log('SSE: Raw buffer chunk:', JSON.stringify(buffer.substring(0, 300)));
        }
        
        // Process complete SSE events (separated by \n\n)
        let eventEndIndex = buffer.indexOf('\n\n');
        
        // Debug: log buffer state for first few iterations
        if (eventCount === 0 && totalBytes < 1000) {
          console.log(`SSE: Buffer length: ${buffer.length}, contains \\n\\n: ${eventEndIndex !== -1}, buffer start:`, JSON.stringify(buffer.substring(0, 150)));
        }
        
        while (eventEndIndex !== -1) {
          const eventText = buffer.substring(0, eventEndIndex);
          buffer = buffer.substring(eventEndIndex + 2); // Remove processed event and \n\n
          
          const trimmedEvent = eventText.trim();
          if (!trimmedEvent || trimmedEvent === '') {
            eventEndIndex = buffer.indexOf('\n\n');
            continue;
          }

          // Debug: log event text for first few events
          if (eventCount < 3) {
            console.log(`SSE: Processing event text (length: ${trimmedEvent.length}):`, trimmedEvent.substring(0, 200));
          }

          // Parse SSE event
          const result = this.parseSSEEvent(trimmedEvent);
          
          if (result && result.eventData) {
            eventCount++;
            console.log(`SSE: Parsed event #${eventCount}, type: "${result.eventType}", data length: ${result.eventData.length}`);
            const shouldStop = this.processSSEEvent(result.eventType, result.eventData, eventCount, onMessage, onError, onComplete);
            
            // If complete event or error, stop processing
            if (shouldStop) {
              return;
            }
          } else {
            console.warn('SSE: Failed to parse event or no eventData. Event text:', trimmedEvent.substring(0, 150));
            console.warn('SSE: Parse result:', result);
          }
          
          // Look for next event
          eventEndIndex = buffer.indexOf('\n\n');
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // Stream was cancelled, don't call onError
        return;
      }
      
      // Check if this is a network error but we received some data
      const isNetworkError = error instanceof TypeError && 
        (error.message.includes('network error') || 
         error.message.includes('Failed to fetch') ||
         error.message.includes('ERR_INCOMPLETE_CHUNKED_ENCODING'));
      
      if (isNetworkError && eventCount > 0) {
        // We received some events before the error, treat as successful completion
        console.warn('SSE: Network error occurred but we received', eventCount, 'events. Treating as completion.');
        if (this.isStreaming) {
          this.isStreaming = false;
          onComplete();
        }
        return;
      }
      
      console.error('Stream error:', error);
      if (this.isStreaming) {
        this.isStreaming = false;
        onError(error instanceof Error ? error : new Error('Unknown error'));
      }
    }
  }

  /**
   * Parse SSE event from text
   */
  private parseSSEEvent(eventText: string): { eventType: string; eventData: string; isComplete: boolean } | null {
    let eventType = 'message';
    const eventDataLines: string[] = [];

    // Parse SSE event format: "event: type\ndata: data" or just "data: data"
    const lines = eventText.split('\n');
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;
      
      if (trimmedLine.startsWith('event:')) {
        // Extract event type (everything after "event:")
        eventType = trimmedLine.slice(6).trim();
      } else if (trimmedLine.startsWith('data:')) {
        // Extract data value (everything after "data:")
        const dataValue = trimmedLine.slice(5).trim();
        if (dataValue) {
          eventDataLines.push(dataValue);
        }
      } else if (trimmedLine.startsWith('id:') || trimmedLine.startsWith('retry:') || trimmedLine.startsWith(':')) {
        // Skip SSE metadata lines and comments
        continue;
      } else if (eventDataLines.length > 0) {
        // If we already have data lines, this might be continuation of multi-line data
        eventDataLines.push(trimmedLine);
      }
      // Don't add lines without "data:" prefix if we haven't found any data lines yet
      // This prevents adding "event:message" as data
    }

    // Join all data lines (for multi-line data)
    const eventData = eventDataLines.join('\n').trim();

    if (!eventData) {
      console.warn('SSE: parseSSEEvent - no eventData found. eventText:', eventText.substring(0, 200));
      console.warn('SSE: parseSSEEvent - eventDataLines:', eventDataLines);
      return null;
    }

    // Check if this is a complete event
    let isComplete = false;
    try {
      const parsed = JSON.parse(eventData);
      isComplete = parsed.type === 'complete';
    } catch {
      // Not JSON, not a complete event
    }

    return { eventType, eventData, isComplete };
  }

  /**
   * Process parsed SSE event
   * Returns true if processing should stop (complete or error)
   */
  private processSSEEvent(
    eventType: string,
    eventData: string,
    eventCount: number,
    onMessage: (event: SSEMessageEvent) => void,
    onError: (error: Error) => void,
    onComplete: () => void
  ): boolean {
    // Handle error events
    if (eventType === 'error') {
      if (this.isStreaming) {
        this.isStreaming = false;
        try {
          const parsed = JSON.parse(eventData);
          onError(new Error(parsed.error || 'Stream error'));
        } catch {
          onError(new Error(eventData || 'Stream error'));
        }
      }
      return true; // Stop processing on error
    }

    // Handle message events (default event type)
    if (eventType === 'message' || !eventType || eventType === '') {
      // Debug: log raw event data for first few events
      if (eventCount <= 3) {
        console.log(`SSE: Event #${eventCount} - eventType: "${eventType}", eventData:`, eventData.substring(0, 100));
      }
      
      try {
        const parsed = JSON.parse(eventData);
        
        if (parsed.type === 'complete') {
          console.log(`SSE: Received complete event (total events: ${eventCount})`, parsed);
          if (this.isStreaming) {
            this.isStreaming = false;
            onComplete();
          }
          return true; // Stop processing on complete
        } else if (parsed.type === 'token' && parsed.content) {
          // Log first few tokens for debugging
          if (eventCount <= 3) {
            console.log(`SSE: Token #${eventCount}:`, parsed.content.substring(0, 50));
          }
          onMessage({
            type: 'token',
            content: parsed.content,
          });
        } else {
          // Handle other message types
          console.log('SSE: Received message event:', parsed);
          onMessage(parsed);
        }
      } catch (parseError) {
        // If not JSON, skip it
        console.error(`SSE: Failed to parse as JSON (event #${eventCount}):`, parseError);
        console.error('SSE: Raw eventData (first 200 chars):', eventData.substring(0, 200));
        console.error('SSE: Full eventData length:', eventData.length);
        console.warn('SSE: Skipping invalid event data');
      }
    } else {
      console.log(`SSE: Received event with type '${eventType}':`, eventData.substring(0, 100));
    }
    
    return false; // Continue processing
  }

  /**
   * Stop streaming
   */
  stopStream(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    this.isStreaming = false;
  }

  /**
   * Check if streaming is active
   */
  isStreamingActive(): boolean {
    return this.isStreaming && this.abortController !== null;
  }
}

export const streamingApi = new StreamingApi();
