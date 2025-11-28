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
    eventType?: RealtimeEventType;
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
declare class RealtimeChat {
    private cleanupFn;
    subscribe(callback: (message: RealtimeMessage) => void): void;
    sendMessage(message: string, senderRole: 'admin' | 'customer'): Promise<void>;
    getMessages(): Promise<RealtimeMessage[]>;
    unsubscribe(): void;
}
declare class RealtimeAlerts {
    private cleanupFn;
    subscribe(callback: (alert: RealtimeAlert) => void): void;
    getAlerts(userId?: string): Promise<RealtimeAlert[]>;
    unsubscribe(): void;
}
declare class RealtimeTransactions {
    private cleanupFn;
    subscribe(callback: (transaction: RealtimeTransaction) => void, accountId?: number): void;
    unsubscribe(): void;
}
declare class RealtimeBankAccounts {
    private cleanupFn;
    subscribe(callback: (account: RealtimeBankAccount) => void, userId?: number): void;
    unsubscribe(): void;
}
declare class RealtimeSupportTickets {
    private cleanupFn;
    subscribe(callback: (ticket: RealtimeSupportTicket) => void, userId?: number): void;
    unsubscribe(): void;
}
declare class RealtimeAdminActions {
    private cleanupFn;
    subscribe(callback: (action: RealtimeAdminAction) => void): void;
    unsubscribe(): void;
}
export declare const realtimeChat: RealtimeChat;
export declare const realtimeAlerts: RealtimeAlerts;
export declare const realtimeTransactions: RealtimeTransactions;
export declare const realtimeBankAccounts: RealtimeBankAccounts;
export declare const realtimeSupportTickets: RealtimeSupportTickets;
export declare const realtimeAdminActions: RealtimeAdminActions;
export {};
