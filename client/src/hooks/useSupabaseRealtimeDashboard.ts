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
 * Check if authenticated (token exists in localStorage)
 */
function isAuthenticated(): boolean {
  return !!localStorage.getItem('token');
}

/**
 * Supabase Realtime with Smart Polling Fallback
 * Primary: Supabase Realtime for instant updates
 * Fallback: Polling if realtime connection fails
 */
export function useSupabaseRealtimeAccounts(
  onAccountsChange: (accounts: Account[]) => void,
  enabled = true
) {
  const unsubscribeRef = useRef<(() => void) | null>(null);

  const fetchAccountsData = useCallback(async () => {
    try {
      if (!isAuthenticated()) {
        return;
      }

      const { authenticatedFetch } = await import('@/lib/queryClient');
      const response = await authenticatedFetch(`/api/accounts?t=${Date.now()}`);

      if (!response.ok) {
        return;
      }

      const accountsData = await response.json();
      if (Array.isArray(accountsData)) {
        onAccountsChange(accountsData);
      }
    } catch (error: any) {
      // Silent fail - polling will retry
    }
  }, [onAccountsChange]);

  useEffect(() => {
    if (!enabled) return;

    // Initial fetch
    fetchAccountsData();

    // Try Supabase Realtime first
    let pollInterval: NodeJS.Timeout | null = null;
    let channel: any = null;

    try {
      channel = supabase
        .channel(`realtime:accounts:${Math.random()}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'bank_accounts' },
          () => fetchAccountsData()
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('✅ Supabase Realtime connected for accounts');
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.log('⚠️ Supabase Realtime unavailable, using polling for accounts');
            // Start polling if realtime fails
            if (!pollInterval) {
              pollInterval = setInterval(fetchAccountsData, 5000);
            }
          }
        });

      unsubscribeRef.current = () => {
        if (channel) channel.unsubscribe();
        if (pollInterval) clearInterval(pollInterval);
      };
    } catch (error: any) {
      console.log('⚠️ Supabase Realtime error, using polling for accounts');
      // Fallback to polling
      pollInterval = setInterval(fetchAccountsData, 5000);
      unsubscribeRef.current = () => {
        if (channel) channel.unsubscribe();
        if (pollInterval) clearInterval(pollInterval);
      };
    }

    // Safety net: Always poll in addition to realtime
    const safetyPollInterval = setInterval(fetchAccountsData, 15000);
    const originalUnsub = unsubscribeRef.current;
    unsubscribeRef.current = () => {
      originalUnsub?.();
      clearInterval(safetyPollInterval);
    };

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [enabled, fetchAccountsData]);

  return { fetchAccountsData };
}

/**
 * Supabase Realtime for transactions
 */
export function useSupabaseRealtimeTransactions(
  onTransactionsChange: (transactions: Transaction[]) => void,
  enabled = true
) {
  const unsubscribeRef = useRef<(() => void) | null>(null);

  const fetchTransactionsData = useCallback(async () => {
    try {
      if (!isAuthenticated()) {
        return;
      }

      const { authenticatedFetch } = await import('@/lib/queryClient');
      const response = await authenticatedFetch('/api/transactions');

      if (!response.ok) {
        return;
      }

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
    } catch (error: any) {
      // Silent fail - polling will retry
    }
  }, [onTransactionsChange]);

  useEffect(() => {
    if (!enabled) return;

    // Initial fetch
    fetchTransactionsData();

    let pollInterval: NodeJS.Timeout | null = null;
    let channel: any = null;

    try {
      channel = supabase
        .channel(`realtime:transactions:${Math.random()}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'bank_transactions' },
          () => fetchTransactionsData()
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('✅ Supabase Realtime connected for transactions');
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.log('⚠️ Supabase Realtime unavailable, using polling for transactions');
            if (!pollInterval) {
              pollInterval = setInterval(fetchTransactionsData, 3000);
            }
          }
        });

      unsubscribeRef.current = () => {
        if (channel) channel.unsubscribe();
        if (pollInterval) clearInterval(pollInterval);
      };
    } catch (error: any) {
      console.log('⚠️ Supabase Realtime error, using polling for transactions');
      pollInterval = setInterval(fetchTransactionsData, 3000);
      unsubscribeRef.current = () => {
        if (channel) channel.unsubscribe();
        if (pollInterval) clearInterval(pollInterval);
      };
    }

    // Safety net polling
    const safetyPollInterval = setInterval(fetchTransactionsData, 10000);
    const originalUnsub = unsubscribeRef.current;
    unsubscribeRef.current = () => {
      originalUnsub?.();
      clearInterval(safetyPollInterval);
    };

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [enabled, fetchTransactionsData]);

  return { fetchTransactionsData };
}

/**
 * Supabase Realtime for user balance
 */
export function useSupabaseRealtimeUserBalance(
  onUserChange: (userData: any) => void,
  enabled = true
) {
  const unsubscribeRef = useRef<(() => void) | null>(null);

  const fetchUserData = useCallback(async () => {
    try {
      if (!isAuthenticated()) {
        return;
      }

      const { authenticatedFetch } = await import('@/lib/queryClient');
      const response = await authenticatedFetch(`/api/user`);

      if (!response.ok) {
        return;
      }

      const data = await response.json();
      onUserChange(data);
    } catch (error: any) {
      // Silent fail - polling will retry
    }
  }, [onUserChange]);

  useEffect(() => {
    if (!enabled) return;

    // Initial fetch
    fetchUserData();

    let pollInterval: NodeJS.Timeout | null = null;
    let channel: any = null;

    try {
      channel = supabase
        .channel(`realtime:users:${Math.random()}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'bank_users' },
          () => fetchUserData()
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('✅ Supabase Realtime connected for user balance');
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.log('⚠️ Supabase Realtime unavailable, using polling for user balance');
            if (!pollInterval) {
              pollInterval = setInterval(fetchUserData, 4000);
            }
          }
        });

      unsubscribeRef.current = () => {
        if (channel) channel.unsubscribe();
        if (pollInterval) clearInterval(pollInterval);
      };
    } catch (error: any) {
      console.log('⚠️ Supabase Realtime error, using polling for user balance');
      pollInterval = setInterval(fetchUserData, 4000);
      unsubscribeRef.current = () => {
        if (channel) channel.unsubscribe();
        if (pollInterval) clearInterval(pollInterval);
      };
    }

    // Safety net polling
    const safetyPollInterval = setInterval(fetchUserData, 12000);
    const originalUnsub = unsubscribeRef.current;
    unsubscribeRef.current = () => {
      originalUnsub?.();
      clearInterval(safetyPollInterval);
    };

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [enabled, fetchUserData]);

  return { fetchUserData };
}
