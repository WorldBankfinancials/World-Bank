// Client-side schema types for the World Bank app
export interface User {
  id: number;
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
  id: number;
  fromUserId: number;
  toUserId?: number;
  amount: number;
  type: 'transfer' | 'deposit' | 'withdrawal';
  status: 'pending' | 'completed' | 'failed';
  description: string;
  createdAt: string;
}

export interface PendingTransfer {
  id: number;
  amount: number;
  recipientName: string;
  recipientCountry: string;
  bankName: string;
  swiftCode: string;
  transferPurpose: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}