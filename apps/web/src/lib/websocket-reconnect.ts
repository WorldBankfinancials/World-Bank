/**
 * WebSocket reconnection utility with exponential backoff
 */

type MessageHandler = (data: any) => void;
type StatusHandler = (status: 'connecting' | 'connected' | 'disconnected') => void;

export class WebSocketManager {
  private ws: WebSocket | null = null;
  private url: string;
  private retries = 0;
  private maxRetries = 5;
  private handlers: Map<string, Set<MessageHandler>> = new Map();
  private statusHandlers: Set<StatusHandler> = new Set();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(url: string) {
    this.url = url;
  }

  connect() {
    this.notifyStatus('connecting');
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      this.retries = 0;
      this.notifyStatus('connected');
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const handlers = this.handlers.get(data.type) || new Set();
        handlers.forEach(h => h(data));
      } catch (e) {
        console.error('WebSocket parse error:', e);
      }
    };

    this.ws.onclose = () => {
      this.notifyStatus('disconnected');
      this.attemptReconnect();
    };

    this.ws.onerror = () => {
      this.ws?.close();
    };
  }

  private attemptReconnect() {
    if (this.retries >= this.maxRetries) return;
    const delay = Math.min(1000 * 2 ** this.retries, 30000);
    this.retries++;
    this.reconnectTimer = setTimeout(() => this.connect(), delay);
  }

  on(type: string, handler: MessageHandler) {
    if (!this.handlers.has(type)) this.handlers.set(type, new Set());
    this.handlers.get(type)!.add(handler);
  }

  onStatus(handler: StatusHandler) {
    this.statusHandlers.add(handler);
  }

  send(data: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  disconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.ws?.close();
    this.ws = null;
  }

  private notifyStatus(status: 'connecting' | 'connected' | 'disconnected') {
    this.statusHandlers.forEach(h => h(status));
  }
}
