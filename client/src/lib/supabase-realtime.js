import { supabase } from './supabase';
// Shared channel registry to reduce connection count
class SharedChannelRegistry {
    constructor() {
        this.coreChannel = null;
        this.chatChannel = null;
        this.presenceChannel = null;
        // Callback registries for each table type
        this.alertCallbacks = new Set();
        this.transactionCallbacks = new Set();
        this.accountCallbacks = new Set();
        this.ticketCallbacks = new Set();
        this.adminActionCallbacks = new Set();
    }
    // Initialize the core channel with all listeners
    initCoreChannel() {
        if (this.coreChannel)
            return;
        this.coreChannel = supabase
            .channel('core-realtime')
            // Alerts listener
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'alerts' }, (payload) => {
            if (!payload.new)
                return;
            try {
                const alert = {
                    id: payload.new.id,
                    userId: payload.new.user_id,
                    title: payload.new.title,
                    message: payload.new.message,
                    type: payload.new.type,
                    timestamp: new Date(payload.new.created_at),
                    isRead: payload.new.is_read
                };
                this.alertCallbacks.forEach(cb => cb(alert));
            }
            catch (error) {
                console.error('❌ Error processing realtime alert:', error);
            }
        })
            // Transactions listener
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'transactions' }, (payload) => {
            if (!payload.new)
                return;
            try {
                const transaction = {
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
                this.transactionCallbacks.forEach(cb => cb(transaction));
            }
            catch (error) {
                console.error('❌ Error processing realtime transaction:', error);
            }
        })
            // Bank accounts listener (UPDATE events for balance changes)
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'bank_accounts' }, (payload) => {
            if (!payload.new)
                return;
            try {
                const account = {
                    id: payload.new.id,
                    userId: payload.new.user_id,
                    accountNumber: payload.new.account_number,
                    accountType: payload.new.account_type,
                    balance: payload.new.balance,
                    currency: payload.new.currency || 'USD',
                    isActive: payload.new.is_active !== false,
                    updatedAt: new Date(payload.new.updated_at || payload.new.created_at)
                };
                this.accountCallbacks.forEach(cb => cb(account));
            }
            catch (error) {
                console.error('❌ Error processing realtime account update:', error);
            }
        })
            // Support tickets listener (all events)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'support_tickets' }, (payload) => {
            const ticketData = (payload.new || payload.old);
            if (!ticketData)
                return;
            try {
                if (!ticketData.id || !ticketData.user_id)
                    return;
                const ticket = {
                    id: Number(ticketData.id),
                    userId: Number(ticketData.user_id),
                    description: String(ticketData.description || ''),
                    status: String(ticketData.status || 'open'),
                    priority: String(ticketData.priority || 'medium'),
                    category: String(ticketData.category || 'general'),
                    createdAt: new Date(ticketData.created_at),
                    updatedAt: new Date(ticketData.updated_at || ticketData.created_at),
                    eventType: payload.eventType
                };
                this.ticketCallbacks.forEach(cb => cb(ticket));
            }
            catch (error) {
                console.error('❌ Error processing realtime support ticket:', error);
            }
        })
            // Admin actions listener
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'admin_actions' }, (payload) => {
            if (!payload.new)
                return;
            try {
                const action = {
                    id: payload.new.id,
                    adminId: payload.new.admin_id,
                    actionType: payload.new.action_type,
                    targetId: payload.new.target_id || '',
                    targetType: payload.new.target_type || '',
                    description: payload.new.description || '',
                    createdAt: new Date(payload.new.created_at)
                };
                this.adminActionCallbacks.forEach(cb => cb(action));
            }
            catch (error) {
                console.error('❌ Error processing realtime admin action:', error);
            }
        })
            .subscribe((status) => {
            console.log('🔄 Core realtime channel:', status);
        });
    }
    // Subscribe methods for each data type
    subscribeToAlerts(callback) {
        this.alertCallbacks.add(callback);
        this.initCoreChannel();
        return () => this.alertCallbacks.delete(callback);
    }
    subscribeToTransactions(callback) {
        this.transactionCallbacks.add(callback);
        this.initCoreChannel();
        return () => this.transactionCallbacks.delete(callback);
    }
    subscribeToAccounts(callback) {
        this.accountCallbacks.add(callback);
        this.initCoreChannel();
        return () => this.accountCallbacks.delete(callback);
    }
    subscribeToTickets(callback) {
        this.ticketCallbacks.add(callback);
        this.initCoreChannel();
        return () => this.ticketCallbacks.delete(callback);
    }
    subscribeToAdminActions(callback) {
        this.adminActionCallbacks.add(callback);
        this.initCoreChannel();
        return () => this.adminActionCallbacks.delete(callback);
    }
    // Get or create chat channel (kept separate for clarity)
    getChatChannel() {
        if (!this.chatChannel) {
            this.chatChannel = supabase.channel('chat-messages');
        }
        return this.chatChannel;
    }
    // Get or create presence channel (kept separate for presence tracking)
    getPresenceChannel() {
        if (!this.presenceChannel) {
            this.presenceChannel = supabase.channel('online-users');
        }
        return this.presenceChannel;
    }
    // Cleanup all channels
    cleanup() {
        if (this.coreChannel) {
            this.coreChannel.unsubscribe();
            this.coreChannel = null;
        }
        if (this.chatChannel) {
            this.chatChannel.unsubscribe();
            this.chatChannel = null;
        }
        if (this.presenceChannel) {
            this.presenceChannel.unsubscribe();
            this.presenceChannel = null;
        }
        this.alertCallbacks.clear();
        this.transactionCallbacks.clear();
        this.accountCallbacks.clear();
        this.ticketCallbacks.clear();
        this.adminActionCallbacks.clear();
    }
}
// Singleton instance
const sharedChannels = new SharedChannelRegistry();
// Optimized classes using shared channels
class RealtimeChat {
    constructor() {
        this.cleanupFn = null;
    }
    subscribe(callback) {
        const channel = sharedChannels.getChatChannel();
        channel
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
            const message = {
                id: payload.new.id,
                senderId: payload.new.sender_id,
                senderName: payload.new.sender_name,
                senderRole: payload.new.sender_role,
                message: payload.new.message,
                timestamp: new Date(payload.new.created_at),
                isRead: payload.new.is_read
            };
            callback(message);
        })
            .subscribe();
    }
    async sendMessage(message, senderRole) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user)
            throw new Error('User not authenticated');
        await supabase.from('messages').insert({
            sender_id: user.id,
            sender_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
            sender_role: senderRole,
            message: message,
            is_read: false
        });
    }
    async getMessages() {
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .order('created_at', { ascending: true })
            .limit(100);
        if (error)
            throw error;
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
        if (this.cleanupFn) {
            this.cleanupFn();
            this.cleanupFn = null;
        }
    }
}
class RealtimeAlerts {
    constructor() {
        this.cleanupFn = null;
    }
    subscribe(callback) {
        this.cleanupFn = sharedChannels.subscribeToAlerts(callback);
    }
    async getAlerts(userId) {
        let query = supabase
            .from('alerts')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);
        if (userId) {
            query = query.eq('user_id', userId);
        }
        const { data, error } = await query;
        if (error)
            throw error;
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
        if (this.cleanupFn) {
            this.cleanupFn();
            this.cleanupFn = null;
        }
    }
}
class RealtimeTransactions {
    constructor() {
        this.cleanupFn = null;
    }
    subscribe(callback, accountId) {
        // Note: Shared channel doesn't support per-account filtering yet
        // All transactions are broadcast, components should filter client-side if needed
        this.cleanupFn = sharedChannels.subscribeToTransactions(callback);
    }
    unsubscribe() {
        if (this.cleanupFn) {
            this.cleanupFn();
            this.cleanupFn = null;
        }
    }
}
class RealtimeBankAccounts {
    constructor() {
        this.cleanupFn = null;
    }
    subscribe(callback, userId) {
        // Note: Shared channel doesn't support per-user filtering yet
        // All account updates are broadcast, components should filter client-side if needed
        this.cleanupFn = sharedChannels.subscribeToAccounts(callback);
    }
    unsubscribe() {
        if (this.cleanupFn) {
            this.cleanupFn();
            this.cleanupFn = null;
        }
    }
}
class RealtimeSupportTickets {
    constructor() {
        this.cleanupFn = null;
    }
    subscribe(callback, userId) {
        // Note: Shared channel doesn't support per-user filtering yet
        // All tickets are broadcast, components should filter client-side if needed
        this.cleanupFn = sharedChannels.subscribeToTickets(callback);
    }
    unsubscribe() {
        if (this.cleanupFn) {
            this.cleanupFn();
            this.cleanupFn = null;
        }
    }
}
class RealtimeAdminActions {
    constructor() {
        this.cleanupFn = null;
    }
    subscribe(callback) {
        this.cleanupFn = sharedChannels.subscribeToAdminActions(callback);
    }
    unsubscribe() {
        if (this.cleanupFn) {
            this.cleanupFn();
            this.cleanupFn = null;
        }
    }
}
export const realtimeChat = new RealtimeChat();
export const realtimeAlerts = new RealtimeAlerts();
export const realtimeTransactions = new RealtimeTransactions();
export const realtimeBankAccounts = new RealtimeBankAccounts();
export const realtimeSupportTickets = new RealtimeSupportTickets();
export const realtimeAdminActions = new RealtimeAdminActions();
