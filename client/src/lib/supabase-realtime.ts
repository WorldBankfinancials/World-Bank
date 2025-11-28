// Realtime features disabled - using backend API instead
export interface RealtimeMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'admin' | 'customer';
  message: string;
  timestamp: Date;
  isRead: boolean;
}

export interface RealtimeAlert {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'error' | 'info';
  timestamp: Date;
  isRead: boolean;
}

export class RealtimeManager {
  constructor() {}
  
  subscribe() {
    return { unsubscribe: () => {} };
  }
  
  unsubscribe() {}
  sendMessage() {}
  broadcastAlert() {}
}

export const realtimeManager = new RealtimeManager();
