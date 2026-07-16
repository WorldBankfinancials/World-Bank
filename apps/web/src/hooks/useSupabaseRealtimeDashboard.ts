import { useEffect, useRef, useCallback } from 'react';
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
 * Generic Supabase Realtime hook with Smart Polling Fallback
 * Primary: Supabase Realtime for instant updates
 * Fallback: Polling if realtime connection fails
 */
export function useSupabaseRealtime<T>(
  options: {
    endpoint: string;
    channelName: string;
    table: string;
    presenceKey: string;
    onDataChange: (data: T) => void;
    transform?: (raw: unknown) => T;
    enabled?: boolean;
  }
) {
  const { endpoint, channelName, table, presenceKey, onDataChange, transform, enabled = true } = options;
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const onDataChangeRef = useRef(onDataChange);
  onDataChangeRef.current = onDataChange;

  const fetchData = useCallback(async () => {
    try {
      if (!isAuthenticated()) return;
      const { authenticatedFetch } = await import('@/lib/queryClient');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      const response = await authenticatedFetch(`${endpoint}?t=${Date.now()}`, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (!response.ok) return;
      const data = await response.json();
      if (data) onDataChangeRef.current(transform ? transform(data) : data);
    } catch {
      // Silent fail - polling will retry
    }
  }, [endpoint, transform]);

  useEffect(() => {
    if (!enabled) return;
    fetchData();
    let pollInterval: ReturnType<typeof setInterval> | null = null;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let realtimeConnected = false;

    const setupRealtime = async () => {
      try {
        channel = supabase
          .channel(channelName, {
            config: { broadcast: { ack: false }, presence: { key: presenceKey } },
          })
          .on('postgres_changes', { event: '*', schema: 'public', table }, () => fetchData())
          .subscribe((status: string) => {
            if (status === 'SUBSCRIBED') {
              realtimeConnected = true;
              if (pollInterval) { clearInterval(pollInterval); pollInterval = null; }
            } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
              if (!pollInterval) pollInterval = setInterval(fetchData, 8000);
            }
          });
      } catch {
        if (!pollInterval) pollInterval = setInterval(fetchData, 8000);
      }
    };

    setupRealtime();
    const safetyPoll = setInterval(() => { if (!realtimeConnected) fetchData(); }, 8000);

    unsubscribeRef.current = () => {
      channel?.unsubscribe();
      if (pollInterval) clearInterval(pollInterval);
      clearInterval(safetyPoll);
    };

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [enabled, fetchData]);

  return { fetchData };
}

/**
 * Supabase Realtime for accounts (backward-compatible wrapper)
 */
export function useSupabaseRealtimeAccounts(
  onAccountsChange: (accounts: Account[]) => void,
  enabled = true
) {
  return useSupabaseRealtime<Account[]>({
    endpoint: '/api/accounts',
    channelName: 'accounts_realtime',
    table: 'accounts',
    presenceKey: 'accounts',
    onDataChange: (data) => {
      if (Array.isArray(data)) onAccountsChange(data);
    },
    enabled,
  });
}

/**
 * Supabase Realtime for transactions (backward-compatible wrapper)
 */
export function useSupabaseRealtimeTransactions(
  onTransactionsChange: (transactions: Transaction[]) => void,
  enabled = true
) {
  return useSupabaseRealtime<Transaction[]>({
    endpoint: '/api/transactions',
    channelName: 'transactions_realtime',
    table: 'transactions',
    presenceKey: 'transactions',
    onDataChange: (data) => {
      if (Array.isArray(data)) onTransactionsChange(data);
    },
    transform: (data: unknown) => (data as unknown[]).slice(0, 10).map((txn) => {
      const t = txn as Record<string, unknown>;
      return {
        id: t.id as number,
        amount: t.amount as string,
        status: (t.status as string) || 'pending',
        description: (t.description as string) || (t.recipientName as string) || 'Transfer',
        createdAt: (t.createdAt as string) || new Date().toISOString(),
        date: (t.createdAt as string) || new Date().toISOString(),
      };
    }),
    enabled,
  });
}

/**
 * Supabase Realtime for user balance (backward-compatible wrapper)
 */
export function useSupabaseRealtimeUserBalance(
  onBalanceChange: (balance: Record<string, unknown>) => void,
  enabled = true
) {
  return useSupabaseRealtime<Record<string, unknown>>({
    endpoint: '/api/user',
    channelName: 'users_realtime',
    table: 'users',
    presenceKey: 'user',
    onDataChange: onBalanceChange,
    enabled,
  });
}
