// client/src/lib/schema.ts
export interface User {
  id: string; // UUID from Supabase auth
  username?: string;
  email?: string;
  fullName?: string;
  accountNumber?: string;
  balance?: number;
  isVerified?: boolean;
  role?: 'user' | 'admin';
  createdAt?: string;
}

export interface Transaction {
  id: string;
  from_user_id?: string;
  to_user_id?: string;
  amount: number;
  type: 'credit' | 'debit';
  status: 'pending' | 'completed' | 'failed';
  description?: string;
  category?: string;
  created_at?: string;
}

export interface PendingTransfer {
  id: string;
  amount: number;
  recipient_name: string;
  recipient_country: string;
  bank_name: string;
  swift_code: string;
  transfer_purpose?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at?: string;
}

export interface Message {
  id: string;
  user_id: string;
  role?: 'user' | 'admin';
  content: string;
  created_at?: string;
}

export interface Alert {
  id: string;
  user_id: string;
  title: string;
  message: string;
  read?: boolean;
  created_at?: string;
}
