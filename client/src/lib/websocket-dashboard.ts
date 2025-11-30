/**
 * WEBSOCKET DASHBOARD REALTIME CLIENT
 * Maintains WebSocket connection to /ws/dashboard for instant updates
 */

export class DashboardWebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private userId: string;
  private email: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private messageHandlers: Map<string, (data: any) => void> = new Map();
  private isManuallyClosed = false;

  constructor(userId: string, email: string) {
    this.userId = userId;
    this.email = email;
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    this.url = `${protocol}://${window.location.host}/ws/dashboard?userId=${userId}&email=${encodeURIComponent(email)}`;
  }

  /**
   * Connect to WebSocket server
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log('✅ Dashboard WebSocket connected');
          this.reconnectAttempts = 0;
          this.isManuallyClosed = false;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            
            // Route message to appropriate handler
            if (message.type === 'connected') {
              console.log('✅ Dashboard WebSocket authenticated');
            } else if (message.type === 'account_update') {
              const handler = this.messageHandlers.get('account_update');
              if (handler) handler(message);
            } else if (message.type === 'transaction_update') {
              const handler = this.messageHandlers.get('transaction_update');
              if (handler) handler(message);
            } else if (message.type === 'user_update') {
              const handler = this.messageHandlers.get('user_update');
              if (handler) handler(message);
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('Dashboard WebSocket error:', error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('Dashboard WebSocket closed');
          if (!this.isManuallyClosed) {
            this.attemptReconnect();
          }
        };
      } catch (error) {
        console.error('Error creating WebSocket:', error);
        reject(error);
      }
    });
  }

  /**
   * Subscribe to message type
   */
  on(type: string, handler: (data: any) => void): void {
    this.messageHandlers.set(type, handler);
  }

  /**
   * Unsubscribe from message type
   */
  off(type: string): void {
    this.messageHandlers.delete(type);
  }

  /**
   * Send ping to keep connection alive
   */
  ping(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'ping' }));
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Attempt to reconnect with exponential backoff
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connect().catch((error) => {
          console.error('Reconnection failed:', error);
        });
      }, delay);
    } else {
      console.error('Max reconnection attempts reached. Dashboard realtime disabled.');
    }
  }

  /**
   * Disconnect
   */
  disconnect(): void {
    this.isManuallyClosed = true;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.messageHandlers.clear();
  }
}

// Global instance
let instance: DashboardWebSocketClient | null = null;

export function getDashboardWebSocketClient(userId: string, email: string): DashboardWebSocketClient {
  if (!instance || instance === null) {
    instance = new DashboardWebSocketClient(userId, email);
  }
  return instance;
}

export function resetDashboardWebSocketClient(): void {
  if (instance) {
    instance.disconnect();
    instance = null;
  }
}
