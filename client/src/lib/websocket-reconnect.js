/**
 * WEBSOCKET RECONNECTION MANAGER
 * Handles automatic reconnection with exponential backoff
 * CRITICAL for production real-time features
 */
export class WebSocketReconnect {
    constructor(config) {
        this.ws = null;
        this.retryCount = 0;
        this.reconnectTimeout = null;
        this.isIntentionallyClosed = false;
        this.url = config.url;
        this.maxRetries = config.maxRetries ?? 10;
        this.initialDelay = config.initialDelay ?? 1000;
        this.maxDelay = config.maxDelay ?? 30000;
        this.onMessage = config.onMessage;
        this.onOpen = config.onOpen;
        this.onError = config.onError;
        this.onClose = config.onClose;
    }
    /**
     * Connect or reconnect to WebSocket
     */
    connect() {
        if (this.ws?.readyState === WebSocket.OPEN) {
            console.log('✅ WebSocket already connected');
            return;
        }
        try {
            console.log(`🔌 Connecting to WebSocket: ${this.url}`);
            this.ws = new WebSocket(this.url);
            this.ws.onopen = () => {
                console.log('✅ WebSocket connected successfully');
                this.retryCount = 0; // Reset retry count on successful connection
                this.isIntentionallyClosed = false;
                this.onOpen?.();
            };
            this.ws.onmessage = (event) => {
                this.onMessage?.(event);
            };
            this.ws.onerror = (error) => {
                console.error('❌ WebSocket error:', error);
                this.onError?.(error);
            };
            this.ws.onclose = () => {
                console.log('🔌 WebSocket connection closed');
                this.onClose?.();
                // Only attempt reconnect if not intentionally closed
                if (!this.isIntentionallyClosed) {
                    this.scheduleReconnect();
                }
            };
        }
        catch (error) {
            console.error('❌ Failed to create WebSocket:', error);
            this.scheduleReconnect();
        }
    }
    /**
     * Schedule reconnection with exponential backoff
     */
    scheduleReconnect() {
        if (this.retryCount >= this.maxRetries) {
            console.error(`❌ Max reconnection attempts (${this.maxRetries}) reached. Giving up.`);
            return;
        }
        // Calculate delay with exponential backoff: delay = min(initialDelay * 2^retryCount, maxDelay)
        const delay = Math.min(this.initialDelay * Math.pow(2, this.retryCount), this.maxDelay);
        this.retryCount++;
        console.log(`🔄 Scheduling reconnect attempt ${this.retryCount}/${this.maxRetries} in ${delay}ms...`);
        this.reconnectTimeout = setTimeout(() => {
            console.log(`🔄 Attempting reconnect ${this.retryCount}/${this.maxRetries}...`);
            this.connect();
        }, delay);
    }
    /**
     * Send message through WebSocket
     */
    send(data) {
        if (this.ws?.readyState === WebSocket.OPEN) {
            const message = typeof data === 'string' ? data : JSON.stringify(data);
            this.ws.send(message);
            return true;
        }
        else {
            console.warn('⚠️ Cannot send message: WebSocket not connected');
            return false;
        }
    }
    /**
     * Close WebSocket connection (prevents auto-reconnect)
     */
    close() {
        console.log('🔌 Closing WebSocket connection intentionally');
        this.isIntentionallyClosed = true;
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }
    /**
     * Get current connection state
     */
    getState() {
        return this.ws?.readyState ?? WebSocket.CLOSED;
    }
    /**
     * Check if connected
     */
    isConnected() {
        return this.ws?.readyState === WebSocket.OPEN;
    }
}
