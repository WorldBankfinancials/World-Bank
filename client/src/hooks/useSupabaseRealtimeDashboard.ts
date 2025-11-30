import { useEffect, useCallback, useRef } from 'react';

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
 * POLLING ONLY - No Supabase Realtime in dev
 * (WebSocket not available over HTTP - security restriction)
 * Uses intelligent polling fallback for reliable real-time sync
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

    // Always use polling for reliability
    const pollInterval = setInterval(fetchAccountsData, 5000);
    unsubscribeRef.current = () => clearInterval(pollInterval);

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [enabled, fetchAccountsData]);

  return { fetchAccountsData };
}

/**
 * POLLING ONLY for transactions
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

    // Always use polling for reliability
    const pollInterval = setInterval(fetchTransactionsData, 3000);
    unsubscribeRef.current = () => clearInterval(pollInterval);

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [enabled, fetchTransactionsData]);

  return { fetchTransactionsData };
}

/**
 * POLLING ONLY for user balance
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

    // Always use polling for reliability
    const pollInterval = setInterval(fetchUserData, 4000);
    unsubscribeRef.current = () => clearInterval(pollInterval);

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [enabled, fetchUserData]);

  return { fetchUserData };
}
