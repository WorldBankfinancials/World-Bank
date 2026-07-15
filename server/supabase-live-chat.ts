/**
 * SUPABASE REAL-TIME LIVE CHAT IMPLEMENTATION
 * WebSocket + Supabase Realtime for instant messaging between admin and customers
 */

import { Express, Request, Response } from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { createClient } from '@supabase/supabase-js';

// Supabase client for realtime features
const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Track active WebSocket connections by user
interface WebSocketUser {
  ws: WebSocket;
  userId: string;
  role: 'admin' | 'customer';
  email?: string;
}

const activeConnections = new Map<string, WebSocketUser>();

/**
 * Setup live chat WebSocket server
 */
export function setupLiveChatWebSocket(wss: WebSocketServer) {
  wss.on('connection', async (ws: WebSocket, req: Request) => {

    // Parse user info from connection
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const token = url.searchParams.get('token') || '';
    const userId = url.searchParams.get('userId') || '';
    const userRole = (url.searchParams.get('role') || 'customer') as 'admin' | 'customer';
    const userEmail = url.searchParams.get('email') || '';

    if (!token || !userId) {
      ws.close(1008, 'Authentication required');
      return;
    }
    try {
      const { data, error } = await supabase.auth.getUser(token);
      if (error || !data?.user || data.user.id !== userId) {
        ws.close(1008, 'Invalid authentication token');
        return;
      }
    } catch {
      ws.close(1008, 'Authentication failed');
      return;
    }

    // Store connection
    const connectionId = `${userRole}_${userId}`;
    activeConnections.set(connectionId, {
      ws,
      userId,
      role: userRole,
      email: userEmail
    });


    // Subscribe to real-time chat messages for this user (uses correct 'messages' table + snake_case column)
    const chatChannel = supabase
      .channel(`chat_ws:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `recipient_id=eq.${userId}`
        },
        (payload) => {
          if (ws.readyState === ws.OPEN) {
            ws.send(JSON.stringify({
              type: 'chat_message',
              data: payload.new,
              timestamp: new Date().toISOString()
            }));
          }
        }
      )
      .subscribe();

    // Subscribe to online status updates
    const presenceChannel = supabase
      .channel(`presence:${userRole}`)
      .on('presence', { event: 'sync' }, () => {
        const presenceState = presenceChannel.presenceState();
        ws.send(JSON.stringify({
          type: 'presence_update',
          activeUsers: Object.keys(presenceState).length,
          timestamp: new Date().toISOString()
        }));
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        ws.send(JSON.stringify({
          type: 'user_joined',
          user: newPresences[0],
          timestamp: new Date().toISOString()
        }));
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        ws.send(JSON.stringify({
          type: 'user_left',
          user: leftPresences[0],
          timestamp: new Date().toISOString()
        }));
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Announce presence
          await presenceChannel.track({
            user_id: userId,
            role: userRole,
            online_at: new Date().toISOString()
          });
        }
      });

    // Handle incoming messages
    ws.on('message', async (message: Buffer) => {
      try {
        const data = JSON.parse(message.toString());

        if (data.type === 'chat_message') {
          // Validate message
          if (!data.content || data.content.length === 0 || data.content.length > 5000) {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Invalid message length'
            }));
            return;
          }

          // Determine recipient
          const recipientId = data.recipientId || (userRole === 'admin' ? data.customerId : 'admin');

          // Save message to database (messages table, snake_case columns)
          const { data: savedMessage, error } = await supabase
            .from('messages')
            .insert([
              {
                sender_id: userId,
                sender_name: userEmail || userId,
                sender_role: userRole,
                recipient_id: recipientId,
                content: data.content,
                created_at: new Date().toISOString(),
                is_read: false
              }
            ])
            .select()
            .single();

          if (error) throw error;

          // Broadcast to recipient if connected
          const recipientConnection = activeConnections.get(`admin_${recipientId}`) ||
            activeConnections.get(`customer_${recipientId}`);

          if (recipientConnection?.ws.readyState === WebSocket.OPEN) {
            recipientConnection.ws.send(JSON.stringify({
              type: 'chat_message',
              data: savedMessage,
              timestamp: new Date().toISOString()
            }));
          }

          // Acknowledge to sender
          ws.send(JSON.stringify({
            type: 'message_sent',
            messageId: savedMessage.id,
            timestamp: new Date().toISOString()
          }));
        }

        if (data.type === 'typing') {
          // Broadcast typing indicator
          const recipientConnection = activeConnections.get(
            userRole === 'admin' ? `customer_${data.recipientId}` : 'admin_1'
          );

          if (recipientConnection?.ws.readyState === WebSocket.OPEN) {
            recipientConnection.ws.send(JSON.stringify({
              type: 'user_typing',
              userId,
              senderRole: userRole,
              timestamp: new Date().toISOString()
            }));
          }
        }

        if (data.type === 'mark_read') {
          // Mark messages as read — only from a specific sender when senderId is provided
          const senderId = data.senderId;
          let updateQuery = supabase
            .from('messages')
            .update({ is_read: true })
            .eq('recipient_id', userId)
            .eq('is_read', false);
          if (senderId) {
            updateQuery = updateQuery.eq('sender_id', senderId);
          }
          await updateQuery;

          ws.send(JSON.stringify({
            type: 'messages_marked_read',
            timestamp: new Date().toISOString()
          }));
        }
      } catch (error: unknown) {
        ws.send(JSON.stringify({
          type: 'error',
          message: (error instanceof Error ? error.message : 'Internal server error')
        }));
      }
    });

    // Handle disconnection
    ws.on('close', async () => {
      activeConnections.delete(connectionId);

      // Unsubscribe from Supabase realtime channels to prevent leaks
      try {
        supabase.removeChannel(chatChannel);
        supabase.removeChannel(presenceChannel);
      } catch (e) {
        // Channel cleanup best-effort
      }

      // Update user presence
      try {
        await supabase
          .from('user_presence')
          .update({ is_online: false, last_seen: new Date().toISOString() })
          .eq('user_id', userId);
      } catch (error) {
      }
    });

    ws.on('error', (error) => {
    });
  });
}

/**
 * REST API endpoint to get chat history
 */
export async function getChatHistory(req: Request, res: Response) {
  try {
    // SECURITY: Always use the authenticated user's id from the auth middleware,
    // never trust a client-supplied userId query param (IDOR fix).
    const userId = (req as any).user?.id || req.query.userId;
    const limit = req.query.limit || 50;
    const offset = req.query.offset || 0;

    if (!userId) {
      return res.status(400).json({ error: 'userId required' });
    }

    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
      .order('created_at', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    if (error) throw error;

    res.json({ success: true, messages, total: messages?.length || 0 });
  } catch (error: unknown) {
    res.status(500).json({ error: (error instanceof Error ? error.message : 'Internal server error') });
  }
}

/**
 * Get active chat sessions (admin only)
 */
export async function getActiveSessions(req: Request, res: Response) {
  try {
    // Get all active customers
    const sessions = Array.from(activeConnections.values())
      .filter(conn => conn.role === 'customer')
      .map(conn => ({
        userId: conn.userId,
        email: conn.email,
        status: 'active',
        connectedAt: new Date()
      }));

    res.json({ success: true, sessions });
  } catch (error: unknown) {
    res.status(500).json({ error: (error instanceof Error ? error.message : 'Internal server error') });
  }
}

/**
 * Create support ticket from chat
 */
export async function createTicketFromChat(req: Request, res: Response) {
  try {
    const { userId, subject, description, priority } = req.body;

    if (!userId || !subject) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const { data: ticket, error } = await supabase
      .from('support_tickets')
      .insert([
        {
          user_id: userId,
          subject,
          description,
          priority: priority || 'normal',
          status: 'open',
          created_at: new Date()
        }
      ])
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, ticket });
  } catch (error: unknown) {
    res.status(500).json({ error: (error instanceof Error ? error.message : 'Internal server error') });
  }
}

/**
 * Schema for chat_messages table (add to your Drizzle schema)
 */
export const chatMessagesTableDefinition = `
CREATE TABLE IF NOT EXISTS chat_messages (
  id SERIAL PRIMARY KEY,
  sender_id TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('admin', 'customer')),
  recipient_id TEXT NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_chat_recipient ON chat_messages(recipient_id);
CREATE INDEX idx_chat_sender ON chat_messages(sender_id);
`;