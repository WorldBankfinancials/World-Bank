// Client-side schema types for the World Bank app

export interface User {
  id: string; // UUID in Supabase
  username: string;
  email: string;
  fullName: string;
  accountNumber: string;
  balance: number;
  isVerified: boolean;
  role: 'user' | 'admin';
  createdAt: string;
}

export interface Transaction {
  id: string;
  fromUserId: string;
  toUserId?: string;
  amount: number;
  type: 'credit' | 'debit';
  status: 'pending' | 'completed' | 'failed';
  description: string;
  category?: string;
  createdAt: string;
}

export interface PendingTransfer {
  id: string;
  amount: number;
  recipientName: string;
  recipientCountry: string;
  bankName: string;
  swiftCode: string;
  transferPurpose: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'admin' | 'customer';
  message: string;
  createdAt: string;
  isRead: boolean;
}

export interface Alert {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'error' | 'info';
  createdAt: string;
  isRead: boolean;
}
