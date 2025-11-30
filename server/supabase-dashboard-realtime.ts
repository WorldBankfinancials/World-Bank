/**
 * DASHBOARD WEBSOCKET REALTIME SERVICE
 * Broadcasts instant updates for accounts, transactions, and user balance
 * Connected via WebSocket to /ws/dashboard
 */

import { WebSocketServer, WebSocket } from 'ws';
import { createClient } from '@supabase/supabase-js';
import type { Request } from 'express';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface DashboardUser {
  ws: WebSocket;
  userId: string;
  email: string;
  subscriptions: Map<string, any>;
}

const activeUsers = new Map<string, DashboardUser>();

export function setupDashboardRealtimeWebSocket(wss: WebSocketServer) {
  wss.on('connection', async (ws: WebSocket, req: Request) => {
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const userId = url.searchParams.get('userId') || '';
    const email = url.searchParams.get('email') || '';

    if (!userId || !email) {
      ws.close(1008, 'User ID and email required');
      return;
    }

    const connectionKey = `${userId}`;
    const dashboardUser: DashboardUser = {
      ws,
      userId,
      email,
      subscriptions: new Map()
    };

    activeUsers.set(connectionKey, dashboardUser);
    console.log(`✅ Dashboard WebSocket connected for user: ${email}`);

    // Send initial connection confirmation
    ws.send(JSON.stringify({
      type: 'connected',
      userId,
      email,
      timestamp: new Date().toISOString()
    }));

    // Subscribe to account changes for this user
    const accountsChannel = supabase
      .channel(`dashboard:accounts:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bank_accounts',
          filter: `userId=eq.${userId}`
        },
        (payload) => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              type: 'account_update',
              event: payload.eventType,
              data: payload.new || payload.old,
              timestamp: new Date().toISOString()
            }));
          }
        }
      )
      .subscribe();

    dashboardUser.subscriptions.set('accounts', accountsChannel);

    // Subscribe to transaction changes for this user
    const transactionsChannel = supabase
      .channel(`dashboard:transactions:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bank_transactions',
          filter: `fromUserId=eq.${userId}`
        },
        (payload) => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              type: 'transaction_update',
              event: payload.eventType,
              data: payload.new || payload.old,
              timestamp: new Date().toISOString()
            }));
          }
        }
      )
      .subscribe();

    dashboardUser.subscriptions.set('transactions', transactionsChannel);

    // Subscribe to user balance changes
    const userChannel = supabase
      .channel(`dashboard:user:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bank_users',
          filter: `id=eq.${userId}`
        },
        (payload) => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              type: 'user_update',
              event: payload.eventType,
              data: payload.new,
              timestamp: new Date().toISOString()
            }));
          }
        }
      )
      .subscribe();

    dashboardUser.subscriptions.set('user', userChannel);

    // Handle incoming messages
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        if (message.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });

    // Handle disconnection
    ws.on('close', () => {
      const user = activeUsers.get(connectionKey);
      if (user) {
        // Unsubscribe from all channels
        user.subscriptions.forEach((channel) => {
          channel.unsubscribe();
        });
        activeUsers.delete(connectionKey);
        console.log(`✅ Dashboard WebSocket disconnected for user: ${email}`);
      }
    });

    // Handle errors
    ws.on('error', (error) => {
      console.error(`WebSocket error for ${email}:`, error);
    });
  });
}
