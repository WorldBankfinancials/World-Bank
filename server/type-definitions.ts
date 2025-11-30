/**
 * Centralized type definitions to eliminate "any" types
 */

import type { User, Account, Transaction } from '@shared/schema';

// Card types
export interface BankCard {
  id: number;
  accountId: number;
  cardNumber: string;
  cardholderName: string;
  expiryDate: string;
  cvv: string;
  cardType: 'credit' | 'debit' | 'prepaid';
  status: 'active' | 'blocked' | 'expired';
  dailyLimit: number;
  contactlessEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Investment types
export interface Investment {
  id: number;
  userId: number;
  symbol: string;
  shares: number;
  purchasePrice: number;
  currentPrice: number;
  totalValue: number;
  gainLoss: number;
  purchaseDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Message types
export interface ChatMessage {
  id: number;
  userId: number;
  message: string;
  timestamp: Date;
  isAdmin: boolean;
}

// Alert types
export interface BankAlert {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: 'warning' | 'info' | 'success' | 'error';
  read: boolean;
  createdAt: Date;
}

// Generic API response
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
  status: number;
}

// Storage operation results
export interface StorageResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
}
