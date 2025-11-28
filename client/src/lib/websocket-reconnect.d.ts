/**
 * WEBSOCKET RECONNECTION MANAGER
 * Handles automatic reconnection with exponential backoff
 * CRITICAL for production real-time features
 */
interface ReconnectConfig {
    url: string;
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    onMessage?: (event: MessageEvent) => void;
    onOpen?: () => void;
    onError?: (error: Event) => void;
    onClose?: () => void;
}
export declare class WebSocketReconnect {
    private ws;
    private url;
    private maxRetries;
    private initialDelay;
    private maxDelay;
    private retryCount;
    private reconnectTimeout;
    private isIntentionallyClosed;
    private onMessage?;
    private onOpen?;
    private onError?;
    private onClose?;
    constructor(config: ReconnectConfig);
    /**
     * Connect or reconnect to WebSocket
     */
    connect(): void;
    /**
     * Schedule reconnection with exponential backoff
     */
    private scheduleReconnect;
    /**
     * Send message through WebSocket
     */
    send(data: string | object): boolean;
    /**
     * Close WebSocket connection (prevents auto-reconnect)
     */
    close(): void;
    /**
     * Get current connection state
     */
    getState(): number;
    /**
     * Check if connected
     */
    isConnected(): boolean;
}
export {};
