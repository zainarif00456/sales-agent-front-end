import { useState, useCallback, useRef } from 'react';

/**
 * Streaming message state
 */
interface StreamingMessage {
    id: string;
    content: string;
    isComplete: boolean;
    timestamp: Date;
}

/**
 * Hook for managing streaming message state
 * 
 * This hook handles the accumulation of message chunks from WebSocket
 * and manages the streaming state for each message.
 */
export const useStreamingMessages = () => {
    const [streamingMessages, setStreamingMessages] = useState<Map<string, StreamingMessage>>(
        new Map()
    );
    const messageBufferRef = useRef<Map<string, string[]>>(new Map());

    /**
     * Start a new streaming message
     */
    const startStreaming = useCallback((messageId: string) => {
        setStreamingMessages(prev => {
            const next = new Map(prev);
            next.set(messageId, {
                id: messageId,
                content: '',
                isComplete: false,
                timestamp: new Date(),
            });
            return next;
        });
        messageBufferRef.current.set(messageId, []);
    }, []);

    /**
     * Add a chunk to a streaming message
     */
    const addChunk = useCallback((messageId: string, chunk: string) => {
        // Add to buffer
        const buffer = messageBufferRef.current.get(messageId) || [];
        buffer.push(chunk);
        messageBufferRef.current.set(messageId, buffer);

        // Update streaming message
        setStreamingMessages(prev => {
            const next = new Map(prev);
            const existing = next.get(messageId);

            if (existing) {
                next.set(messageId, {
                    ...existing,
                    content: existing.content + chunk,
                });
            } else {
                // Message doesn't exist, create it
                next.set(messageId, {
                    id: messageId,
                    content: chunk,
                    isComplete: false,
                    timestamp: new Date(),
                });
            }

            return next;
        });
    }, []);

    /**
     * Mark a streaming message as complete
     */
    const completeStreaming = useCallback((messageId: string, fullResponse?: string) => {
        setStreamingMessages(prev => {
            const next = new Map(prev);
            const existing = next.get(messageId);

            if (existing) {
                next.set(messageId, {
                    ...existing,
                    content: fullResponse || existing.content,
                    isComplete: true,
                });
            }

            return next;
        });

        // Clean up buffer
        messageBufferRef.current.delete(messageId);
    }, []);

    /**
     * Remove a streaming message
     */
    const removeStreaming = useCallback((messageId: string) => {
        setStreamingMessages(prev => {
            const next = new Map(prev);
            next.delete(messageId);
            return next;
        });
        messageBufferRef.current.delete(messageId);
    }, []);

    /**
     * Clear all streaming messages
     */
    const clearAll = useCallback(() => {
        setStreamingMessages(new Map());
        messageBufferRef.current.clear();
    }, []);

    /**
     * Get a specific streaming message
     */
    const getStreamingMessage = useCallback((messageId: string): StreamingMessage | undefined => {
        return streamingMessages.get(messageId);
    }, [streamingMessages]);

    /**
     * Check if a message is currently streaming
     */
    const isStreaming = useCallback((messageId: string): boolean => {
        const message = streamingMessages.get(messageId);
        return message ? !message.isComplete : false;
    }, [streamingMessages]);

    /**
     * Get all streaming messages as array
     */
    const getAllStreamingMessages = useCallback((): StreamingMessage[] => {
        return Array.from(streamingMessages.values());
    }, [streamingMessages]);

    return {
        streamingMessages,
        startStreaming,
        addChunk,
        completeStreaming,
        removeStreaming,
        clearAll,
        getStreamingMessage,
        isStreaming,
        getAllStreamingMessages,
    };
};
