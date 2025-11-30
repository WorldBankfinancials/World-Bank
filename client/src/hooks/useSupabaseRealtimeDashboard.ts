import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';

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

/**
 * Supabase Realtime + Polling for accounts
 * Primary: Supabase Realtime instant updates
 * Fallback: Smart polling if realtime fails
 */
export function useSupabaseRealtimeAccounts(
  onAccountsChange: (accounts: Account[]) => void,
  enabled = true
) {
  const unsubscribeRef = useRef<(() => void) | null>(null);

  const fetchAccountsData = useCallback(async () => {
    try {
      const { authenticatedFetch } = await import('@/lib/queryClient');
      const response = await authenticatedFetch(`/api/accounts?t=${Date.now()}`);

      if (response.ok) {
        const accountsData = await response.json();
        if (Array.isArray(accountsData)) {
          onAccountsChange(accountsData);
        }
      }
    } catch (error) {
      // Silent fail - polling will retry
    }
  }, [onAccountsChange]);

  useEffect(() => {
    if (!enabled) return;

    // Initial fetch
    fetchAccountsData();

    // Setup Supabase Realtime subscription
    try {
      const channel = supabase
        .channel(`realtime:accounts:${Math.random()}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'bank_accounts' },
          () => fetchAccountsData()
        )
        .subscribe();

      unsubscribeRef.current = () => channel.unsubscribe();
      
      // Fallback polling every 5 seconds
      const pollInterval = setInterval(fetchAccountsData, 5000);
      const originalUnsub = unsubscribeRef.current;
      unsubscribeRef.current = () => {
        originalUnsub?.();
        clearInterval(pollInterval);
      };
    } catch (error) {
      // If realtime fails, use polling
      const pollInterval = setInterval(fetchAccountsData, 5000);
      unsubscribeRef.current = () => clearInterval(pollInterval);
    }

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [enabled, fetchAccountsData]);

  return { fetchAccountsData };
}

/**
 * Supabase Realtime + Polling for transactions
 */
export function useSupabaseRealtimeTransactions(
  onTransactionsChange: (transactions: Transaction[]) => void,
  enabled = true
) {
  const unsubscribeRef = useRef<(() => void) | null>(null);

  const fetchTransactionsData = useCallback(async () => {
    try {
      const { authenticatedFetch } = await import('@/lib/queryClient');
      const response = await authenticatedFetch('/api/transactions');

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
      // Silent fail - polling will retry
    }
  }, [onTransactionsChange]);

  useEffect(() => {
    if (!enabled) return;

    // Initial fetch
    fetchTransactionsData();

    // Setup Supabase Realtime subscription
    try {
      const channel = supabase
        .channel(`realtime:transactions:${Math.random()}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'bank_transactions' },
          () => fetchTransactionsData()
        )
        .subscribe();

      unsubscribeRef.current = () => channel.unsubscribe();

      // Fallback polling every 3 seconds
      const pollInterval = setInterval(fetchTransactionsData, 3000);
      const originalUnsub = unsubscribeRef.current;
      unsubscribeRef.current = () => {
        originalUnsub?.();
        clearInterval(pollInterval);
      };
    } catch (error) {
      // If realtime fails, use polling
      const pollInterval = setInterval(fetchTransactionsData, 3000);
      unsubscribeRef.current = () => clearInterval(pollInterval);
    }

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [enabled, fetchTransactionsData]);

  return { fetchTransactionsData };
}

/**
 * Supabase Realtime + Polling for user balance
 */
export function useSupabaseRealtimeUserBalance(
  onUserChange: (userData: any) => void,
  enabled = true
) {
  const unsubscribeRef = useRef<(() => void) | null>(null);

  const fetchUserData = useCallback(async () => {
    try {
      const { authenticatedFetch } = await import('@/lib/queryClient');
      const response = await authenticatedFetch(`/api/user`);

      if (response.ok) {
        const data = await response.json();
        onUserChange(data);
      }
    } catch (error) {
      // Silent fail - polling will retry
    }
  }, [onUserChange]);

  useEffect(() => {
    if (!enabled) return;

    // Initial fetch
    fetchUserData();

    // Setup Supabase Realtime subscription
    try {
      const channel = supabase
        .channel(`realtime:users:${Math.random()}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'bank_users' },
          () => fetchUserData()
        )
        .subscribe();

      unsubscribeRef.current = () => channel.unsubscribe();

      // Fallback polling every 4 seconds
      const pollInterval = setInterval(fetchUserData, 4000);
      const originalUnsub = unsubscribeRef.current;
      unsubscribeRef.current = () => {
        originalUnsub?.();
        clearInterval(pollInterval);
      };
    } catch (error) {
      // If realtime fails, use polling
      const pollInterval = setInterval(fetchUserData, 4000);
      unsubscribeRef.current = () => clearInterval(pollInterval);
    }

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [enabled, fetchUserData]);

  return { fetchUserData };
}
