// Supabase Realtime Implementation
import { supabase } from '@/lib/supabase';

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
  private channels: Map<string, any> = new Map();
  
  subscribe(channelName: string, table: string, filter?: string, callback?: (data: any) => void) {
    const channel = supabase.channel(channelName);
    
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: table,
        filter: filter
      },
      (payload) => {
        if (callback) callback(payload);
      }
    ).subscribe();
    
    this.channels.set(channelName, channel);
    return { unsubscribe: () => this.unsubscribe(channelName) };
  }
  
  unsubscribe(channelName: string) {
    const channel = this.channels.get(channelName);
    if (channel) {
      channel.unsubscribe();
      this.channels.delete(channelName);
    }
  }
  
  sendMessage(data: RealtimeMessage) {
    window.dispatchEvent(new CustomEvent('realtime-message', { detail: data }));
  }
  
  broadcastAlert(data: RealtimeAlert) {
    window.dispatchEvent(new CustomEvent('realtime-alert', { detail: data }));
  }
}

export const realtimeManager = new RealtimeManager();
