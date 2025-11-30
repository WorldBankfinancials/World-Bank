import { useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

interface Account {
  id: number;
  balance: number;
  accountType: string;
  accountNumber: string;
}

interface Transaction {
  id: number;
  amount: string;
  status: string;
  description: string;
  createdAt: string;
  date?: string;
}

export function useSupabaseRealtimeAccounts(
  onAccountsChange: (accounts: Account[]) => void,
  enabled = true
) {
  useEffect(() => {
    if (!enabled) return;

    try {
      // Subscribe to bank_accounts table changes
      const subscription = supabase
        .channel('public:bank_accounts')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'bank_accounts'
          },
          (payload: RealtimePostgresChangesPayload<Record<string, any>>) => {
            // Fetch fresh accounts data when changes occur
            fetchAccountsData();
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    } catch (error) {
      console.error('Error subscribing to accounts:', error);
    }
  }, [enabled]);

  const fetchAccountsData = useCallback(async () => {
    try {
      const { authenticatedFetch } = await import('@/lib/queryClient');
      const response = await authenticatedFetch(`/api/accounts?t=${Date.now()}`, {
        headers: { 'Cache-Control': 'no-cache' }
      });

      if (response.ok) {
        const accountsData = await response.json();
        if (Array.isArray(accountsData)) {
          onAccountsChange(accountsData);
        }
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
    }
  }, [onAccountsChange]);

  return { fetchAccountsData };
}

export function useSupabaseRealtimeTransactions(
  onTransactionsChange: (transactions: Transaction[]) => void,
  enabled = true
) {
  useEffect(() => {
    if (!enabled) return;

    try {
      // Subscribe to bank_transactions table changes
      const subscription = supabase
        .channel('public:bank_transactions')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'bank_transactions'
          },
          (payload: RealtimePostgresChangesPayload<Record<string, any>>) => {
            // Fetch fresh transactions data when changes occur
            fetchTransactionsData();
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    } catch (error) {
      console.error('Error subscribing to transactions:', error);
    }
  }, [enabled]);

  const fetchTransactionsData = useCallback(async () => {
    try {
      const { authenticatedFetch } = await import('@/lib/queryClient');
      const response = await authenticatedFetch('/api/transactions', {
        headers: { 'Cache-Control': 'no-cache' }
      });

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          const txns = data.slice(0, 10).map((txn: any) => ({
            id: txn.id,
            amount: txn.amount,
            status: txn.status || 'pending',
            description: txn.description || txn.recipientName || 'Transfer',
            createdAt: txn.createdAt || new Date().toISOString(),
            date: txn.createdAt || new Date().toISOString()
          }));
          onTransactionsChange(txns);
        }
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  }, [onTransactionsChange]);

  return { fetchTransactionsData };
}

export function useSupabaseRealtimeUserBalance(
  onUserChange: (userData: any) => void,
  enabled = true
) {
  useEffect(() => {
    if (!enabled) return;

    try {
      // Subscribe to bank_users table changes for balance updates
      const subscription = supabase
        .channel('public:bank_users')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'bank_users'
          },
          (payload: RealtimePostgresChangesPayload<Record<string, any>>) => {
            // Fetch fresh user data when changes occur
            fetchUserData();
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    } catch (error) {
      console.error('Error subscribing to user balance:', error);
    }
  }, [enabled]);

  const fetchUserData = useCallback(async () => {
    try {
      const { authenticatedFetch } = await import('@/lib/queryClient');
      const response = await authenticatedFetch(`/api/user`, {
        headers: { 'Cache-Control': 'no-cache' }
      });

      if (response.ok) {
        const data = await response.json();
        onUserChange(data);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  }, [onUserChange]);

  return { fetchUserData };
}
