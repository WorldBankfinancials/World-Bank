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
    } catch (error) {
      // Silent fail - polling will retry
    }
  }, [onAccountsChange]);

  useEffect(() => {
    if (!enabled) return;

    // Initial fetch
    fetchAccountsData();

    // Try Supabase Realtime with async/await pattern to prevent blocking
    let pollInterval: ReturnType<typeof setInterval> | null = null;
    let channel: any = null;
    let realtimeConnected = false;

    const setupRealtime = async () => {
      try {
        // Create channel with non-blocking subscribe
        channel = supabase
          .channel('accounts_realtime', {
            config: {
              broadcast: { ack: false },
              presence: { key: 'accounts' }
            }
          })
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'accounts' },
            () => fetchAccountsData()
          )
          .subscribe((status: string) => {
            if (status === 'SUBSCRIBED') {
              realtimeConnected = true;
              if (pollInterval) clearInterval(pollInterval);
            } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
              if (!pollInterval) {
                pollInterval = setInterval(fetchAccountsData, 8000);
              }
            }
          });
      } catch (error) {
        // Silently fallback to polling
        if (!pollInterval) {
          pollInterval = setInterval(fetchAccountsData, 8000);
        }
      }
    };

    // Start realtime setup asynchronously (non-blocking)
    setupRealtime();

    // Also start polling as safety net
    const safetyPollInterval = setInterval(() => {
      if (!realtimeConnected) fetchAccountsData();
    }, 8000);

    unsubscribeRef.current = () => {
      if (channel) channel.unsubscribe();
      if (pollInterval) clearInterval(pollInterval);
      if (safetyPollInterval) clearInterval(safetyPollInterval);
    };

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [enabled, onAccountsChange, fetchAccountsData]);

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
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      
      const response = await authenticatedFetch(`/api/transactions?t=${Date.now()}`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

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
    } catch (error) {
      // Silent fail
    }
  }, [onTransactionsChange]);

  useEffect(() => {
    if (!enabled) return;

    fetchTransactionsData();

    let pollInterval: ReturnType<typeof setInterval> | null = null;
    let channel: any = null;
    let realtimeConnected = false;

    const setupRealtime = async () => {
      try {
        channel = supabase
          .channel('transactions_realtime', {
            config: {
              broadcast: { ack: false },
              presence: { key: 'transactions' }
            }
          })
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'transactions' },
            () => fetchTransactionsData()
          )
          .subscribe((status: string) => {
            if (status === 'SUBSCRIBED') {
              realtimeConnected = true;
              if (pollInterval) clearInterval(pollInterval);
            } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
              if (!pollInterval) {
                pollInterval = setInterval(fetchTransactionsData, 8000);
              }
            }
          });
      } catch (error) {
        // Silently fallback to polling
        if (!pollInterval) {
          pollInterval = setInterval(fetchTransactionsData, 8000);
        }
      }
    };

    setupRealtime();

    const safetyPollInterval = setInterval(() => {
      if (!realtimeConnected) fetchTransactionsData();
    }, 8000);

    unsubscribeRef.current = () => {
      if (channel) channel.unsubscribe();
      if (pollInterval) clearInterval(pollInterval);
      if (safetyPollInterval) clearInterval(safetyPollInterval);
    };

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [enabled, onTransactionsChange, fetchTransactionsData]);

  return { fetchTransactionsData };
}

/**
 * Supabase Realtime for user balance
 */
export function useSupabaseRealtimeUserBalance(
  onBalanceChange: (balance: any) => void,
  enabled = true
) {
  const unsubscribeRef = useRef<(() => void) | null>(null);

  const fetchUserData = useCallback(async () => {
    try {
      if (!isAuthenticated()) {
        return;
      }

      const { authenticatedFetch } = await import('@/lib/queryClient');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      
      const response = await authenticatedFetch(`/api/user?t=${Date.now()}`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        return;
      }

      const userData = await response.json();
      if (userData) {
        onBalanceChange(userData);
      }
    } catch (error) {
      // Silent fail
    }
  }, [onBalanceChange]);

  useEffect(() => {
    if (!enabled) return;

    fetchUserData();

    let pollInterval: ReturnType<typeof setInterval> | null = null;
    let channel: any = null;
    let realtimeConnected = false;

    const setupRealtime = async () => {
      try {
        channel = supabase
          .channel('users_realtime', {
            config: {
              broadcast: { ack: false },
              presence: { key: 'user' }
            }
          })
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'users' },
            () => fetchUserData()
          )
          .subscribe((status: string) => {
            if (status === 'SUBSCRIBED') {
              realtimeConnected = true;
              if (pollInterval) clearInterval(pollInterval);
            } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
              if (!pollInterval) {
                pollInterval = setInterval(fetchUserData, 8000);
              }
            }
          });
      } catch (error) {
        // Silently fallback to polling
        if (!pollInterval) {
          pollInterval = setInterval(fetchUserData, 8000);
        }
      }
    };

    setupRealtime();

    const safetyPollInterval = setInterval(() => {
      if (!realtimeConnected) fetchUserData();
    }, 8000);

    unsubscribeRef.current = () => {
      if (channel) channel.unsubscribe();
      if (pollInterval) clearInterval(pollInterval);
      if (safetyPollInterval) clearInterval(safetyPollInterval);
    };

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [enabled, onBalanceChange, fetchUserData]);

  return { fetchUserData };
}
