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

export interface RealtimeTransaction {
  id: number;
  fromAccountId: number;
  toAccountId: number;
  amount: string;
  currency: string;
  transactionType: string;
  status: string;
  description: string;
  createdAt: Date;
}

export interface RealtimeBankAccount {
  id: number;
  userId: number;
  accountNumber: string;
  accountType: string;
  balance: string;
  currency: string;
  isActive: boolean;
  updatedAt: Date;
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
      this.channel.unsubscribe();
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
      this.channel.unsubscribe();
      this.channel = null;
    }
  }
}

class RealtimeTransactions {
  private channel: any = null;

  subscribe(callback: (transaction: RealtimeTransaction) => void, accountId?: number) {
    this.channel = supabase
      .channel('user-transactions')
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', // Only listen to INSERT to avoid payload.new being null on DELETE
          schema: 'public', 
          table: 'transactions',
          ...(accountId ? { filter: `from_account_id=eq.${accountId}` } : {})
        },
        (payload) => {
          // Guard against missing payload.new
          if (!payload.new) {
            console.warn('⚠️ Realtime transaction event with null payload.new');
            return;
          }
          
          try {
            const transaction: RealtimeTransaction = {
              id: payload.new.id,
              fromAccountId: payload.new.from_account_id,
              toAccountId: payload.new.to_account_id,
              amount: payload.new.amount,
              currency: payload.new.currency || 'USD',
              transactionType: payload.new.transaction_type,
              status: payload.new.status,
              description: payload.new.description || '',
              createdAt: new Date(payload.new.created_at)
            };
            callback(transaction);
          } catch (error) {
            console.error('❌ Error processing realtime transaction:', error);
          }
        }
      )
      .subscribe((status) => {
        console.log('🔄 Realtime transactions subscription:', status);
      });
  }

  unsubscribe() {
    if (this.channel) {
      this.channel.unsubscribe();
      this.channel = null;
    }
  }
}

class RealtimeBankAccounts {
  private channel: any = null;

  subscribe(callback: (account: RealtimeBankAccount) => void, userId?: number) {
    this.channel = supabase
      .channel('user-accounts')
      .on(
        'postgres_changes',
        { 
          event: 'UPDATE', // Listen to balance updates
          schema: 'public', 
          table: 'bank_accounts',
          ...(userId ? { filter: `user_id=eq.${userId}` } : {})
        },
        (payload) => {
          // Guard against missing payload.new (replica identity issues)
          if (!payload.new) {
            console.warn('⚠️ Realtime bank account event with null payload.new');
            return;
          }
          
          try {
            const account: RealtimeBankAccount = {
              id: payload.new.id,
              userId: payload.new.user_id,
              accountNumber: payload.new.account_number,
              accountType: payload.new.account_type,
              balance: payload.new.balance,
              currency: payload.new.currency || 'USD',
              isActive: payload.new.is_active !== false,
              updatedAt: new Date(payload.new.updated_at || payload.new.created_at)
            };
            callback(account);
          } catch (error) {
            console.error('❌ Error processing realtime account update:', error);
          }
        }
      )
      .subscribe((status) => {
        console.log('🔄 Realtime bank accounts subscription:', status);
      });
  }

  unsubscribe() {
    if (this.channel) {
      this.channel.unsubscribe();
      this.channel = null;
    }
  }
}

export type RealtimeEventType = 'INSERT' | 'UPDATE' | 'DELETE';

export interface RealtimeSupportTicket {
  id: number;
  userId: number;
  description: string;
  status: string;
  priority: string;
  category: string;
  createdAt: Date;
  updatedAt: Date;
  eventType?: RealtimeEventType; // Track event type for DELETE distinction
}

export interface RealtimeAdminAction {
  id: number;
  adminId: number;
  actionType: string;
  targetId: string;
  targetType: string;
  description: string;
  createdAt: Date;
}

class RealtimeSupportTickets {
  private channel: any = null;

  subscribe(callback: (ticket: RealtimeSupportTicket) => void, userId?: number) {
    this.channel = supabase
      .channel('support-tickets')
      .on(
        'postgres_changes',
        { 
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public', 
          table: 'support_tickets',
          ...(userId ? { filter: `user_id=eq.${userId}` } : {})
        },
        (payload) => {
          if (!payload.new && payload.eventType !== 'DELETE') {
            console.warn('⚠️ Realtime support ticket event with null payload.new');
            return;
          }
          
          try {
            // Use Record type for safer typing than `as any`
            const ticketData = (payload.new || payload.old) as Record<string, any> | null;
            if (!ticketData) {
              console.warn('⚠️ Realtime support ticket: no data in payload');
              return;
            }
            
            // Validate required fields before usage
            if (!ticketData.id || !ticketData.user_id) {
              console.error('❌ Invalid support ticket payload: missing required fields');
              return;
            }
            
            const ticket: RealtimeSupportTicket = {
              id: Number(ticketData.id),
              userId: Number(ticketData.user_id),
              description: String(ticketData.description || ''),
              status: String(ticketData.status || 'open'),
              priority: String(ticketData.priority || 'medium'),
              category: String(ticketData.category || 'general'),
              createdAt: new Date(ticketData.created_at),
              updatedAt: new Date(ticketData.updated_at || ticketData.created_at),
              eventType: payload.eventType as RealtimeEventType // Pass event type for DELETE distinction
            };
            callback(ticket);
          } catch (error) {
            console.error('❌ Error processing realtime support ticket:', error, payload);
          }
        }
      )
      .subscribe((status) => {
        console.log('🔄 Realtime support tickets subscription:', status);
      });
  }

  unsubscribe() {
    if (this.channel) {
      this.channel.unsubscribe();
      this.channel = null;
    }
  }
}

class RealtimeAdminActions {
  private channel: any = null;

  subscribe(callback: (action: RealtimeAdminAction) => void) {
    this.channel = supabase
      .channel('admin-actions')
      .on(
        'postgres_changes',
        { 
          event: 'INSERT',
          schema: 'public', 
          table: 'admin_actions'
        },
        (payload) => {
          if (!payload.new) {
            console.warn('⚠️ Realtime admin action event with null payload.new');
            return;
          }
          
          try {
            const action: RealtimeAdminAction = {
              id: payload.new.id,
              adminId: payload.new.admin_id,
              actionType: payload.new.action_type,
              targetId: payload.new.target_id || '',
              targetType: payload.new.target_type || '',
              description: payload.new.description || '',
              createdAt: new Date(payload.new.created_at)
            };
            callback(action);
          } catch (error) {
            console.error('❌ Error processing realtime admin action:', error);
          }
        }
      )
      .subscribe((status) => {
        console.log('🔄 Realtime admin actions subscription:', status);
      });
  }

  unsubscribe() {
    if (this.channel) {
      this.channel.unsubscribe();
      this.channel = null;
    }
  }
}

export const realtimeChat = new RealtimeChat();
export const realtimeAlerts = new RealtimeAlerts();
export const realtimeTransactions = new RealtimeTransactions();
export const realtimeBankAccounts = new RealtimeBankAccounts();
export const realtimeSupportTickets = new RealtimeSupportTickets();
export const realtimeAdminActions = new RealtimeAdminActions();