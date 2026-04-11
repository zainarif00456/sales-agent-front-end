import { useEffect, useRef, useState, useCallback } from 'react';
import { API_BASE_URL } from '@/lib/axios';

/**
 * WebSocket message structure from backend
 */
interface WebSocketMessage {
    type: string;
    data: any;
    timestamp: number;
}

/**
 * WebSocket hook configuration
 */
interface UseAgentWebSocketProps {
    agentId: string;
    token: string;
    enabled?: boolean;
    onConnectionEstablished?: (data: any) => void;
    onAgentThinking?: (data: any) => void;
    onStreamStart?: (data: any) => void;
    onAgentStreaming?: (data: any) => void;
    onAgentComplete?: (data: any) => void;
    onSessionTitleUpdated?: (data: any) => void;
    onError?: (data: any) => void;
}

/**
 * WebSocket connection states
 */
export enum WebSocketStatus {
    DISCONNECTED = 'DISCONNECTED',
    CONNECTING = 'CONNECTING',
    CONNECTED = 'CONNECTED',
    RECONNECTING = 'RECONNECTING',
    ERROR = 'ERROR',
}

/**
 * Production-grade WebSocket hook for real-time agent communication
 * 
 * Features:
 * - Automatic reconnection with exponential backoff
 * - Connection state management
 * - Proper cleanup on unmount
 * - Token-based authentication
 * - Error handling and recovery
 */
export const useAgentWebSocket = ({
    agentId,
    token,
    enabled = true,
    onConnectionEstablished,
    onAgentThinking,
    onStreamStart,
    onAgentStreaming,
    onAgentComplete,
    onSessionTitleUpdated,
    onError,
}: UseAgentWebSocketProps) => {
    const [status, setStatus] = useState<WebSocketStatus>(WebSocketStatus.DISCONNECTED);
    const [reconnectAttempts, setReconnectAttempts] = useState(0);

    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<number>();
    const reconnectAttemptsRef = useRef(0);
    const isManualDisconnectRef = useRef(false);

    const maxReconnectAttempts = 2;
    const baseReconnectDelay = 1000; // 1 second
    const maxReconnectDelay = 30000; // 30 seconds

    /**
     * Calculate exponential backoff delay for reconnection
     */
    const getReconnectDelay = useCallback((attempt: number): number => {
        const delay = Math.min(
            baseReconnectDelay * Math.pow(2, attempt),
            maxReconnectDelay
        );
        // Add jitter to prevent thundering herd
        return delay + Math.random() * 1000;
    }, []);

    // Store callbacks in refs to avoid recreating connect function
    const callbacksRef = useRef({
        onConnectionEstablished,
        onAgentThinking,
        onStreamStart,
        onAgentStreaming,
        onAgentComplete,
        onSessionTitleUpdated,
        onError,
    });

    // Update callbacks ref when they change
    useEffect(() => {
        callbacksRef.current = {
            onConnectionEstablished,
            onAgentThinking,
            onStreamStart,
            onAgentStreaming,
            onAgentComplete,
            onSessionTitleUpdated,
            onError,
        };
    }, [onConnectionEstablished, onAgentThinking, onStreamStart, onAgentStreaming, onAgentComplete, onSessionTitleUpdated, onError]);

    const getWebSocketBaseUrl = useCallback((): string => {
        const resolvedApiBase = new URL(API_BASE_URL, window.location.origin);
        const protocol = resolvedApiBase.protocol === 'https:' ? 'wss:' : 'ws:';

        return `${protocol}//${resolvedApiBase.host}`;
    }, []);

    /**
     * Establish WebSocket connection
     */
    const connect = useCallback(() => {
        if (!enabled || !agentId || !token) {
            console.warn('[WebSocket] Cannot connect: missing required parameters');
            return;
        }

        // Prevent multiple simultaneous connection attempts
        if (wsRef.current?.readyState === WebSocket.OPEN ||
            wsRef.current?.readyState === WebSocket.CONNECTING) {
            console.log('[WebSocket] Already connected or connecting');
            return;
        }

        // Clear any pending reconnection attempts
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
        }

        setStatus(
            reconnectAttemptsRef.current > 0
                ? WebSocketStatus.RECONNECTING
                : WebSocketStatus.CONNECTING
        );

        try {
            const wsUrl = `${getWebSocketBaseUrl()}/ws/chat/${agentId}/?token=${token}`;

            console.log(`[WebSocket] Connecting to ${wsUrl} (attempt ${reconnectAttemptsRef.current + 1})`);

            const ws = new WebSocket(wsUrl);

            ws.onopen = () => {
                console.log('[WebSocket] Connection established');
                setStatus(WebSocketStatus.CONNECTED);
                setReconnectAttempts(0);
                reconnectAttemptsRef.current = 0;
                isManualDisconnectRef.current = false;
            };

            ws.onmessage = (event) => {
                try {
                    const message: WebSocketMessage = JSON.parse(event.data);
                    console.log('[WebSocket] Message received:', message.type);

                    switch (message.type) {
                        case 'connection_established':
                            callbacksRef.current.onConnectionEstablished?.(message.data);
                            break;
                        case 'agent_thinking':
                            callbacksRef.current.onAgentThinking?.(message.data);
                            break;
                        case 'stream_start':
                            callbacksRef.current.onStreamStart?.(message.data);
                            break;
                        case 'agent_streaming':
                            callbacksRef.current.onAgentStreaming?.(message.data);
                            break;
                        case 'agent_complete':
                            callbacksRef.current.onAgentComplete?.(message.data);
                            break;
                        case 'session_title_updated':
                            callbacksRef.current.onSessionTitleUpdated?.(message.data);
                            break;
                        case 'error':
                            console.error('[WebSocket] Server error:', message.data);
                            callbacksRef.current.onError?.(message.data);
                            break;
                        default:
                            console.warn('[WebSocket] Unknown message type:', message.type);
                    }
                } catch (error) {
                    console.error('[WebSocket] Error parsing message:', error);
                }
            };

            ws.onerror = (error) => {
                console.error('[WebSocket] Connection error:', error);
                setStatus(WebSocketStatus.ERROR);
            };

            ws.onclose = (event) => {
                console.log(`[WebSocket] Connection closed: code=${event.code}, reason=${event.reason}`);
                setStatus(WebSocketStatus.DISCONNECTED);
                wsRef.current = null;

                // Only attempt reconnection if:
                // 1. Not manually disconnected
                // 2. Still enabled
                // 3. Haven't exceeded max attempts
                if (
                    !isManualDisconnectRef.current &&
                    enabled &&
                    reconnectAttemptsRef.current < maxReconnectAttempts
                ) {
                    const delay = getReconnectDelay(reconnectAttemptsRef.current);
                    console.log(
                        `[WebSocket] Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current + 1}/${maxReconnectAttempts})`
                    );

                    reconnectTimeoutRef.current = setTimeout(() => {
                        reconnectAttemptsRef.current++;
                        setReconnectAttempts(reconnectAttemptsRef.current);
                        connect();
                    }, delay);
                } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
                    console.error('[WebSocket] Max reconnection attempts reached');
                    setStatus(WebSocketStatus.ERROR);
                    callbacksRef.current.onError?.({
                        message: 'Failed to establish connection after multiple attempts',
                    });
                }
            };

            wsRef.current = ws;
        } catch (error) {
            console.error('[WebSocket] Error creating WebSocket:', error);
            setStatus(WebSocketStatus.ERROR);
        }
    }, [agentId, token, enabled, getReconnectDelay, getWebSocketBaseUrl]);

    /**
     * Disconnect WebSocket connection
     */
    const disconnect = useCallback(() => {
        console.log('[WebSocket] Disconnecting...');
        isManualDisconnectRef.current = true;

        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
        }

        if (wsRef.current) {
            wsRef.current.close(1000, 'Client disconnecting');
            wsRef.current = null;
        }

        setStatus(WebSocketStatus.DISCONNECTED);
        setReconnectAttempts(0);
        reconnectAttemptsRef.current = 0;
    }, []);

    /**
     * Send a message through WebSocket
     */
    const sendMessage = useCallback((options: {
        sessionId: string;
        message: string;
        isUserQuery?: boolean;
        isClientQuery?: boolean;
        attachmentBase64?: string;
        attachmentName?: string;
        attachmentMimeType?: string;
    }): boolean => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
            console.error('[WebSocket] Cannot send message: not connected');
            return false;
        }

        const payload = {
            action: 'send_message',
            session_id: options.sessionId,
            message: options.message,
            is_user_query: options.isUserQuery ?? false,
            is_client_query: options.isClientQuery ?? false,
            ...(options.attachmentBase64 ? {
                attachment_base64: options.attachmentBase64,
                attachment_name: options.attachmentName,
                attachment_mime_type: options.attachmentMimeType,
            } : {}),
        };

        try {
            wsRef.current.send(JSON.stringify(payload));
            console.log('[WebSocket] Message sent:', payload);
            return true;
        } catch (error) {
            console.error('[WebSocket] Error sending message:', error);
            return false;
        }
    }, []);

    /**
   * Manually trigger reconnection
   */
    const reconnect = useCallback(() => {
        console.log('[WebSocket] Manual reconnection triggered');

        // Manual disconnect
        isManualDisconnectRef.current = true;
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
        }
        if (wsRef.current) {
            wsRef.current.close(1000, 'Manual reconnect');
            wsRef.current = null;
        }

        // Reset state
        setStatus(WebSocketStatus.DISCONNECTED);
        reconnectAttemptsRef.current = 0;
        setReconnectAttempts(0);
        isManualDisconnectRef.current = false;

        // Reconnect after a short delay
        setTimeout(() => {
            if (enabled && agentId && token) {
                connect();
            }
        }, 100);
    }, [enabled, agentId, token, connect]);

    /**
   * Initialize connection on mount and cleanup on unmount
   */
    useEffect(() => {
        if (enabled) {
            connect();
        }

        return () => {
            disconnect();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [enabled, agentId, token]);

    return {
        status,
        isConnected: status === WebSocketStatus.CONNECTED,
        isConnecting: status === WebSocketStatus.CONNECTING || status === WebSocketStatus.RECONNECTING,
        isError: status === WebSocketStatus.ERROR,
        reconnectAttempts,
        maxReconnectAttempts,
        sendMessage,
        disconnect,
        reconnect,
    };
};
