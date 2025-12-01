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
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      
      const response = await authenticatedFetch(`/api/accounts?t=${Date.now()}`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

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
      // Subscribe to Supabase Realtime with proper initialization
      channel = supabase
        .channel(`realtime:accounts:${Math.random()}`, {
          config: {
            broadcast: { ack: false },
            presence: { key: 'accounts' }
          }
        })
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'bank_accounts' },
          () => fetchAccountsData()
        )
        .subscribe(async (status: string) => {
          if (status === 'SUBSCRIBED') {
            console.log('✅ Supabase Realtime CONNECTED for accounts');
            // Do initial fetch on subscription
            await fetchAccountsData();
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.log('⚠️ Supabase Realtime unavailable for accounts, using polling');
            // Start polling if realtime fails
            if (!pollInterval) {
              pollInterval = setInterval(fetchAccountsData, 8000);
            }
          }
        });

      unsubscribeRef.current = () => {
        if (channel) channel.unsubscribe();
        if (pollInterval) clearInterval(pollInterval);
      };
    } catch (error: any) {
      console.log('⚠️ Supabase Realtime error for accounts, using polling:', error?.message);
      // Fallback to polling
      pollInterval = setInterval(fetchAccountsData, 8000);
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
        .channel(`realtime:txn:${Math.random()}`, {
          config: {
            broadcast: { ack: false },
            presence: { key: 'transactions' }
          }
        })
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'bank_transactions' },
          () => fetchTransactionsData()
        )
        .subscribe(async (status: string) => {
          if (status === 'SUBSCRIBED') {
            console.log('✅ Supabase Realtime CONNECTED for transactions');
            await fetchTransactionsData();
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.log('⚠️ Supabase Realtime error for transactions, using polling');
            if (!pollInterval) {
              pollInterval = setInterval(fetchTransactionsData, 5000);
            }
          }
        });

      unsubscribeRef.current = () => {
        if (channel) channel.unsubscribe();
        if (pollInterval) clearInterval(pollInterval);
      };
    } catch (error: any) {
      console.log('⚠️ Supabase Realtime error for transactions, using polling:', error?.message);
      pollInterval = setInterval(fetchTransactionsData, 5000);
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
        .channel(`realtime:user:${Math.random()}`, {
          config: {
            broadcast: { ack: false },
            presence: { key: 'user' }
          }
        })
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'bank_users' },
          () => fetchUserData()
        )
        .subscribe(async (status: string) => {
          if (status === 'SUBSCRIBED') {
            console.log('✅ Supabase Realtime CONNECTED for user balance');
            await fetchUserData();
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.log('⚠️ Supabase Realtime error for user balance, using polling');
            if (!pollInterval) {
              pollInterval = setInterval(fetchUserData, 6000);
            }
          }
        });

      unsubscribeRef.current = () => {
        if (channel) channel.unsubscribe();
        if (pollInterval) clearInterval(pollInterval);
      };
    } catch (error: any) {
      console.log('⚠️ Supabase Realtime error for user balance, using polling:', error?.message);
      pollInterval = setInterval(fetchUserData, 6000);
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
