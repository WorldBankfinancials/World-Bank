// Supabase Realtime integration for World Bank hybrid system
// Keeps your mock UI but adds real-time backend functionality

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || 'https://sgxmfpirkjlomzfaqqzr.supabase.co';
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNneG1mcGlya2psb216ZmFxcXpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5NzM0MzIsImV4cCI6MjA2NDU0OTQzMn0.y7YhuW22z-p2JiGLHGEGJligvqnnJS8JfF856O-z8IY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Real-time message types matching your existing mock structure
export interface RealtimeMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'customer' | 'admin';
  message: string;
  timestamp: Date;
  isRead: boolean;
}

export interface RealtimeAlert {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  isRead: boolean;
  createdAt: Date;
}

export interface RealtimeTransaction {
  id: string;
  userId: string;
  amount: number;
  type: 'credit' | 'debit' | 'transfer' | 'admin-topup';
  description: string;
  recipientAccount?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
}

export interface RealtimeSupportTicket {
  id: string;
  userId: string;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: Date;
  updatedAt: Date;
}

// Real-time chat functionality
export class RealtimeChat {
  private channel: any = null;
  private onMessageCallback: ((message: RealtimeMessage) => void) | null = null;

  // Subscribe to real-time chat messages
  subscribe(onMessage: (message: RealtimeMessage) => void) {
    this.onMessageCallback = onMessage;
    
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
            message: payload.new.content,
            timestamp: new Date(payload.new.created_at),
            isRead: payload.new.is_read
          };
          this.onMessageCallback?.(message);
        }
      )
      .subscribe();
  }

  // Send a message (transforms to your mock format)
  async sendMessage(content: string, senderRole: 'customer' | 'admin' = 'customer') {
    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('messages')
      .insert({
        sender_id: user.data.user.id,
        content,
        sender_role: senderRole,
        sender_name: senderRole === 'admin' ? 'World Bank Support' : 'Customer'
      });

    if (error) throw error;
  }

  // Get message history (transforms to your mock format)
  async getMessages(): Promise<RealtimeMessage[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) throw error;

    return data.map(msg => ({
      id: msg.id,
      senderId: msg.sender_id,
      senderName: msg.sender_name,
      senderRole: msg.sender_role,
      message: msg.content,
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

// Real-time alerts functionality  
export class RealtimeAlerts {
  private channel: any = null;

  subscribe(onAlert: (alert: RealtimeAlert) => void) {
    this.channel = supabase
      .channel('banking-alerts')
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
            isRead: payload.new.is_read,
            createdAt: new Date(payload.new.created_at)
          };
          onAlert(alert);
        }
      )
      .subscribe();
  }

  // Send alert (admin function)
  async sendAlert(userId: string, title: string, message: string, type: 'info' | 'warning' | 'success' | 'error' = 'info') {
    const { error } = await supabase
      .from('alerts')
      .insert({
        user_id: userId,
        title,
        message,
        type
      });

    if (error) throw error;
  }

  // Get user alerts
  async getUserAlerts(): Promise<RealtimeAlert[]> {
    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('alerts')
      .select('*')
      .eq('user_id', user.data.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(alert => ({
      id: alert.id,
      userId: alert.user_id,
      title: alert.title,
      message: alert.message,
      type: alert.type,
      isRead: alert.is_read,
      createdAt: new Date(alert.created_at)
    }));
  }

  // Mark alert as read
  async markAsRead(alertId: string) {
    const { error } = await supabase
      .from('alerts')
      .update({ is_read: true })
      .eq('id', alertId);

    if (error) throw error;
  }

  unsubscribe() {
    if (this.channel) {
      supabase.removeChannel(this.channel);
      this.channel = null;
    }
  }
}

// Real-time transactions functionality
export class RealtimeTransactions {
  private channel: any = null;

  subscribe(onTransaction: (transaction: RealtimeTransaction) => void) {
    this.channel = supabase
      .channel('live-transactions')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'live_transactions'
        },
        (payload) => {
          const transaction: RealtimeTransaction = {
            id: payload.new.id,
            userId: payload.new.user_id,
            amount: parseFloat(payload.new.amount),
            type: payload.new.type,
            description: payload.new.description,
            recipientAccount: payload.new.recipient_account,
            status: payload.new.status,
            createdAt: new Date(payload.new.created_at)
          };
          onTransaction(transaction);
        }
      )
      .subscribe();
  }

  // Create transaction (transforms to your mock format)
  async createTransaction(
    amount: number,
    type: 'credit' | 'debit' | 'transfer' | 'admin-topup',
    description: string,
    recipientAccount?: string
  ) {
    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('live_transactions')
      .insert({
        user_id: user.data.user.id,
        amount,
        type,
        description,
        recipient_account: recipientAccount,
        status: 'pending'
      });

    if (error) throw error;
  }

  // Get transaction history (maintains your mock format)
  async getTransactions(): Promise<RealtimeTransaction[]> {
    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('live_transactions')
      .select('*')
      .eq('user_id', user.data.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(txn => ({
      id: txn.id,
      userId: txn.user_id,
      amount: parseFloat(txn.amount),
      type: txn.type,
      description: txn.description,
      recipientAccount: txn.recipient_account,
      status: txn.status,
      createdAt: new Date(txn.created_at)
    }));
  }

  unsubscribe() {
    if (this.channel) {
      supabase.removeChannel(this.channel);
      this.channel = null;
    }
  }
}

// Hybrid data loader - maintains your mock UI structure but with real data
export class HybridDataLoader {
  
  // Load data in your original .json format but from Supabase
  static async loadTransactionsAsJson(): Promise<any[]> {
    const transactions = new RealtimeTransactions();
    const data = await transactions.getTransactions();
    
    // Transform to your original .json format
    return data.map(txn => ({
      id: txn.id,
      amount: txn.amount,
      type: txn.type,
      description: txn.description,
      date: txn.createdAt.toISOString().split('T')[0],
      time: txn.createdAt.toTimeString().split(' ')[0],
      status: txn.status,
      recipientAccount: txn.recipientAccount
    }));
  }

  static async loadAlertsAsJson(): Promise<any[]> {
    const { data, error } = await supabase
      .from('alerts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Transform to your original alert format
    return data.map(alert => ({
      id: alert.id,
      title: alert.title,
      message: alert.message,
      type: alert.type,
      isRead: alert.is_read,
      timestamp: new Date(alert.created_at).toISOString()
    }));
  }
}

// Export singleton instances
export const realtimeChat = new RealtimeChat();
export const realtimeAlerts = new RealtimeAlerts();
export const realtimeTransactions = new RealtimeTransactions();