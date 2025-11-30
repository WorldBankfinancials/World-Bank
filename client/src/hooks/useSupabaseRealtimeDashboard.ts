import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { getDashboardWebSocketClient, resetDashboardWebSocketClient } from '@/lib/websocket-dashboard';

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
  const wsClientRef = useRef<any>(null);

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

    // Setup WebSocket connection for real-time updates
    const setupWebSocket = async () => {
      try {
        const { authenticatedFetch } = await import('@/lib/queryClient');
        const userResponse = await authenticatedFetch('/api/user');
        if (userResponse.ok) {
          const userData = await userResponse.json();
          const wsClient = getDashboardWebSocketClient(userData.id, userData.email);
          
          // Connect if not already connected
          if (!wsClient.isConnected()) {
            await wsClient.connect();
          }

          wsClientRef.current = wsClient;

          // Listen for account updates via WebSocket
          wsClient.on('account_update', () => {
            fetchAccountsData();
          });

          // Ping every 30 seconds to keep connection alive
          const pingInterval = setInterval(() => wsClient.ping(), 30000);
          unsubscribeRef.current = () => {
            clearInterval(pingInterval);
            wsClient.off('account_update');
          };
        }
      } catch (error) {
        console.warn('WebSocket setup failed, using Supabase Realtime:', error);
        
        // Fallback to Supabase Realtime
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
                fetchAccountsData();
              }
            )
            .subscribe();

          unsubscribeRef.current = () => channel.unsubscribe();
        } catch (supabaseError) {
          console.warn('Supabase Realtime failed, using polling:', supabaseError);
          const pollInterval = setInterval(fetchAccountsData, 5000);
          unsubscribeRef.current = () => clearInterval(pollInterval);
        }
      }
    };

    setupWebSocket();

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [enabled, fetchAccountsData]);

  return { fetchAccountsData };
}

export function useSupabaseRealtimeTransactions(
  onTransactionsChange: (transactions: Transaction[]) => void,
  enabled = true
) {
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const wsClientRef = useRef<any>(null);

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

    // Setup WebSocket connection for real-time updates
    const setupWebSocket = async () => {
      try {
        const { authenticatedFetch } = await import('@/lib/queryClient');
        const userResponse = await authenticatedFetch('/api/user');
        if (userResponse.ok) {
          const userData = await userResponse.json();
          const wsClient = getDashboardWebSocketClient(userData.id, userData.email);
          
          if (!wsClient.isConnected()) {
            await wsClient.connect();
          }

          wsClientRef.current = wsClient;

          wsClient.on('transaction_update', () => {
            fetchTransactionsData();
          });

          const pingInterval = setInterval(() => wsClient.ping(), 30000);
          unsubscribeRef.current = () => {
            clearInterval(pingInterval);
            wsClient.off('transaction_update');
          };
        }
      } catch (error) {
        console.warn('WebSocket setup failed, using Supabase Realtime:', error);
        
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
                fetchTransactionsData();
              }
            )
            .subscribe();

          unsubscribeRef.current = () => channel.unsubscribe();
        } catch (supabaseError) {
          console.warn('Supabase Realtime failed, using polling:', supabaseError);
          const pollInterval = setInterval(fetchTransactionsData, 3000);
          unsubscribeRef.current = () => clearInterval(pollInterval);
        }
      }
    };

    setupWebSocket();

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [enabled, fetchTransactionsData]);

  return { fetchTransactionsData };
}

export function useSupabaseRealtimeUserBalance(
  onUserChange: (userData: any) => void,
  enabled = true
) {
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const wsClientRef = useRef<any>(null);

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

    // Setup WebSocket connection for real-time updates
    const setupWebSocket = async () => {
      try {
        const { authenticatedFetch } = await import('@/lib/queryClient');
        const userResponse = await authenticatedFetch('/api/user');
        if (userResponse.ok) {
          const userData = await userResponse.json();
          const wsClient = getDashboardWebSocketClient(userData.id, userData.email);
          
          if (!wsClient.isConnected()) {
            await wsClient.connect();
          }

          wsClientRef.current = wsClient;

          wsClient.on('user_update', () => {
            fetchUserData();
          });

          const pingInterval = setInterval(() => wsClient.ping(), 30000);
          unsubscribeRef.current = () => {
            clearInterval(pingInterval);
            wsClient.off('user_update');
          };
        }
      } catch (error) {
        console.warn('WebSocket setup failed, using Supabase Realtime:', error);
        
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
                fetchUserData();
              }
            )
            .subscribe();

          unsubscribeRef.current = () => channel.unsubscribe();
        } catch (supabaseError) {
          console.warn('Supabase Realtime failed, using polling:', supabaseError);
          const pollInterval = setInterval(fetchUserData, 4000);
          unsubscribeRef.current = () => clearInterval(pollInterval);
        }
      }
    };

    setupWebSocket();

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [enabled, fetchUserData]);

  return { fetchUserData };
}
