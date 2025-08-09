import { supabase } from './supabase';

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

class RealtimeChat {
  private channel: any = null;

  subscribe(callback: (message: RealtimeMessage) => void) {
    this.channel = supabase
      .channel('chat-messages')
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages' 
        },
        (payload) => {
          const message: RealtimeMessage = {
            id: payload.new.id,
            senderId: payload.new.sender_id,
            senderName: payload.new.sender_name,
            senderRole: payload.new.sender_role,
            message: payload.new.message,
            timestamp: new Date(payload.new.created_at),
            isRead: payload.new.is_read
          };
          callback(message);
        }
      )
      .subscribe();
  }

  async sendMessage(message: string, senderRole: 'admin' | 'customer') {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    await supabase.from('messages').insert({
      sender_id: user.id,
      sender_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
      sender_role: senderRole,
      message: message,
      is_read: false
    });
  }

  async getMessages(): Promise<RealtimeMessage[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(100);

    if (error) throw error;

    return data.map(msg => ({
      id: msg.id,
      senderId: msg.sender_id,
      senderName: msg.sender_name,
      senderRole: msg.sender_role,
      message: msg.message,
      timestamp: new Date(msg.created_at),
      isRead: msg.is_read
    }));
  }

  unsubscribe() {
    if (this.channel) {
      supabase.removeChannel(this.channel);
      this.channel = null;
    }
  }
}

class RealtimeAlerts {
  private channel: any = null;

  subscribe(callback: (alert: RealtimeAlert) => void) {
    this.channel = supabase
      .channel('user-alerts')
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'alerts' 
        },
        (payload) => {
          const alert: RealtimeAlert = {
            id: payload.new.id,
            userId: payload.new.user_id,
            title: payload.new.title,
            message: payload.new.message,
            type: payload.new.type,
            timestamp: new Date(payload.new.created_at),
            isRead: payload.new.is_read
          };
          callback(alert);
        }
      )
      .subscribe();
  }

  async getAlerts(userId?: string): Promise<RealtimeAlert[]> {
    let query = supabase
      .from('alerts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data.map(alert => ({
      id: alert.id,
      userId: alert.user_id,
      title: alert.title,
      message: alert.message,
      type: alert.type,
      timestamp: new Date(alert.created_at),
      isRead: alert.is_read
    }));
  }

  unsubscribe() {
    if (this.channel) {
      supabase.removeChannel(this.channel);
      this.channel = null;
    }
  }
}

export const realtimeChat = new RealtimeChat();
export const realtimeAlerts = new RealtimeAlerts();