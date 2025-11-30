import { useEffect, useCallback, useRef } from 'react';
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
  const unsubscribeRef = useRef<(() => void) | null>(null);

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

  useEffect(() => {
    if (!enabled) return;

    // First fetch
    fetchAccountsData();

    // Setup realtime subscription with error handling
    try {
      const channel = supabase
        .channel(`realtime:bank_accounts:${Date.now()}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'bank_accounts'
          },
          (payload: any) => {
            // Refetch on any change
            fetchAccountsData();
          }
        )
        .on('error', (error: any) => {
          console.warn('Realtime accounts error, falling back to polling:', error);
          // Fallback: poll every 5 seconds if realtime fails
          const pollInterval = setInterval(fetchAccountsData, 5000);
          unsubscribeRef.current = () => clearInterval(pollInterval);
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('✅ Subscribed to account changes');
          }
        });

      unsubscribeRef.current = () => channel.unsubscribe();
      return () => {
        if (unsubscribeRef.current) {
          unsubscribeRef.current();
        }
      };
    } catch (error) {
      console.warn('Realtime subscription failed, using polling:', error);
      // Fallback to polling every 5 seconds
      const pollInterval = setInterval(fetchAccountsData, 5000);
      return () => clearInterval(pollInterval);
    }
  }, [enabled, fetchAccountsData]);

  return { fetchAccountsData };
}

export function useSupabaseRealtimeTransactions(
  onTransactionsChange: (transactions: Transaction[]) => void,
  enabled = true
) {
  const unsubscribeRef = useRef<(() => void) | null>(null);

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

  useEffect(() => {
    if (!enabled) return;

    // First fetch
    fetchTransactionsData();

    // Setup realtime subscription with error handling
    try {
      const channel = supabase
        .channel(`realtime:bank_transactions:${Date.now()}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'bank_transactions'
          },
          (payload: any) => {
            // Refetch on any change
            fetchTransactionsData();
          }
        )
        .on('error', (error: any) => {
          console.warn('Realtime transactions error, falling back to polling:', error);
          // Fallback: poll every 3 seconds if realtime fails
          const pollInterval = setInterval(fetchTransactionsData, 3000);
          unsubscribeRef.current = () => clearInterval(pollInterval);
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('✅ Subscribed to transaction changes');
          }
        });

      unsubscribeRef.current = () => channel.unsubscribe();
      return () => {
        if (unsubscribeRef.current) {
          unsubscribeRef.current();
        }
      };
    } catch (error) {
      console.warn('Realtime subscription failed, using polling:', error);
      // Fallback to polling every 3 seconds
      const pollInterval = setInterval(fetchTransactionsData, 3000);
      return () => clearInterval(pollInterval);
    }
  }, [enabled, fetchTransactionsData]);

  return { fetchTransactionsData };
}

export function useSupabaseRealtimeUserBalance(
  onUserChange: (userData: any) => void,
  enabled = true
) {
  const unsubscribeRef = useRef<(() => void) | null>(null);

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

  useEffect(() => {
    if (!enabled) return;

    // First fetch
    fetchUserData();

    // Setup realtime subscription with error handling
    try {
      const channel = supabase
        .channel(`realtime:bank_users:${Date.now()}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'bank_users'
          },
          (payload: any) => {
            // Refetch on any change
            fetchUserData();
          }
        )
        .on('error', (error: any) => {
          console.warn('Realtime user error, falling back to polling:', error);
          // Fallback: poll every 4 seconds if realtime fails
          const pollInterval = setInterval(fetchUserData, 4000);
          unsubscribeRef.current = () => clearInterval(pollInterval);
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('✅ Subscribed to user balance changes');
          }
        });

      unsubscribeRef.current = () => channel.unsubscribe();
      return () => {
        if (unsubscribeRef.current) {
          unsubscribeRef.current();
        }
      };
    } catch (error) {
      console.warn('Realtime subscription failed, using polling:', error);
      // Fallback to polling every 4 seconds
      const pollInterval = setInterval(fetchUserData, 4000);
      return () => clearInterval(pollInterval);
    }
  }, [enabled, fetchUserData]);

  return { fetchUserData };
}
