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
  process.env.VITE_SUPABASE_URL!,
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
    const userId = url.searchParams.get('userId') || '';
    const userRole = (url.searchParams.get('role') || 'customer') as 'admin' | 'customer';
    const userEmail = url.searchParams.get('email') || '';

    if (!userId) {
      ws.close(1008, 'User ID required');
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


    // Subscribe to real-time chat messages for this user
    const chatChannel = supabase
      .channel(`chat:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_messages',
          filter: `receiverId=eq.${userId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            // FIXED: Check WebSocket state before sending
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({
                type: 'chat_message',
                data: payload.new,
                timestamp: new Date().toISOString()
              }));
            }
          }
        }
      )
      .subscribe();

    // Subscribe to online status updates
    const presenceChannel = supabase
      .channel(`presence:${userRole}`)
      .on('presence', { event: 'sync' }, () => {
        const presenceState = presenceChannel.presenceState();
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'presence_update',
            activeUsers: Object.keys(presenceState).length,
            timestamp: new Date().toISOString()
          }));
        }
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'user_joined',
            user: newPresences[0],
            timestamp: new Date().toISOString()
          }));
        }
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'user_left',
            user: leftPresences[0],
            timestamp: new Date().toISOString()
          }));
        }
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
        // FIXED: Safe JSON parsing with error handling
        let data: any;
        try {
          data = JSON.parse(message.toString());
        } catch (e) {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Invalid message format'
            }));
          }
          return;
        }

        if (data.type === 'chat_message') {
          // Validate message
          if (!data.content || data.content.length === 0 || data.content.length > 5000) {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({
                type: 'error',
                message: 'Invalid message length'
              }));
            }
            return;
          }

          // Determine recipient
          const recipientId = data.recipientId || (userRole === 'admin' ? data.customerId : 'admin');

          // Save message to database
          const { data: savedMessage, error } = await supabase
            .from('chat_messages')
            .insert([
              {
                senderId: userId,
                senderName: userEmail || userId,
                senderRole: userRole,
                recipientId,
                content: data.content,
                createdAt: new Date(),
                isRead: false
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
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              type: 'message_sent',
              messageId: savedMessage.id,
              timestamp: new Date().toISOString()
            }));
          }
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
          // Mark messages as read
          try {
            await supabase
              .from('chat_messages')
              .update({ isRead: true })
              .eq('recipientId', userId)
              .eq('isRead', false);

            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({
                type: 'messages_marked_read',
                timestamp: new Date().toISOString()
              }));
            }
          } catch (markReadError) {
            console.error('Failed to mark messages as read:', markReadError);
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({
                type: 'error',
                message: 'Failed to mark messages as read'
              }));
            }
          }
        }
      } catch (error: any) {
        console.error('WebSocket message error:', error);
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'error',
            message: error.message || 'An error occurred'
          }));
        }
      }
    });

    // Handle disconnection
    ws.on('close', async () => {
      activeConnections.delete(connectionId);

      // Update user presence
      try {
        await supabase
          .from('user_presence')
          .update({ isOnline: false, lastSeen: new Date() })
          .eq('userId', userId);
      } catch (error) {
        console.warn('Failed to update user presence on disconnect:', error);
      }
    });

    // Handle errors
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });
}

/**
 * REST API endpoint to get chat history
 */
export async function getChatHistory(req: Request, res: Response) {
  try {
    const { userId, limit = 50, offset = 0 } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'userId required' });
    }

    const { data: messages, error } = await supabase
      .from('chat_messages')
      .select('*')
      .or(`senderId.eq.${userId},recipientId.eq.${userId}`)
      .order('createdAt', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    if (error) throw error;

    res.json({ success: true, messages, total: messages?.length || 0 });
  } catch (error: any) {
    console.error('Failed to fetch chat history:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch chat history' });
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
  } catch (error: any) {
    console.error('Failed to fetch active sessions:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch active sessions' });
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
          userId,
          subject,
          description,
          priority: priority || 'normal',
          status: 'open',
          createdAt: new Date()
        }
      ])
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, ticket });
  } catch (error: any) {
    console.error('Failed to create ticket from chat:', error);
    res.status(500).json({ error: error.message || 'Failed to create support ticket' });
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
