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

export class WebSocketReconnect {
  private ws: WebSocket | null = null;
  private url: string;
  private maxRetries: number;
  private initialDelay: number;
  private maxDelay: number;
  private retryCount: number = 0;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private isIntentionallyClosed: boolean = false;
  
  private onMessage?: (event: MessageEvent) => void;
  private onOpen?: () => void;
  private onError?: (error: Event) => void;
  private onClose?: () => void;

  constructor(config: ReconnectConfig) {
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
      return;
    }

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this.retryCount = 0; // Reset retry count on successful connection
        this.isIntentionallyClosed = false;
        this.onOpen?.();
      };

      this.ws.onmessage = (event) => {
        this.onMessage?.(event);
      };

      this.ws.onerror = (error) => {
        this.onError?.(error);
      };

      this.ws.onclose = () => {
        this.onClose?.();
        
        // Only attempt reconnect if not intentionally closed
        if (!this.isIntentionallyClosed) {
          this.scheduleReconnect();
        }
      };

    } catch (error) {
      this.scheduleReconnect();
    }
  }

  /**
   * Schedule reconnection with exponential backoff
   */
  private scheduleReconnect() {
    if (this.retryCount >= this.maxRetries) {
      return;
    }

    // Calculate delay with exponential backoff: delay = min(initialDelay * 2^retryCount, maxDelay)
    const delay = Math.min(
      this.initialDelay * Math.pow(2, this.retryCount),
      this.maxDelay
    );

    this.retryCount++;
    

    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, delay);
  }

  /**
   * Send message through WebSocket
   */
  send(data: string | object) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      const message = typeof data === 'string' ? data : JSON.stringify(data);
      this.ws.send(message);
      return true;
    } else {
      return false;
    }
  }

  /**
   * Close WebSocket connection (prevents auto-reconnect)
   */
  close() {
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
  getState(): number {
    return this.ws?.readyState ?? WebSocket.CLOSED;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}
