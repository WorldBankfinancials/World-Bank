/**
 * REAL-TIME CHAT HOOK
 * Live chat messaging with WebSocket and Supabase Realtime
 */

import { useEffect, useCallback, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface ChatMessage {
  id?: string;
  senderId: string;
  senderName: string;
  senderRole: 'admin' | 'customer';
  recipientId: string;
  content: string;
  isRead?: boolean;
  timestamp?: string;
}

export function useRealtimeChat(
  userId: string | undefined,
  onMessageReceived?: (message: ChatMessage) => void,
  onTyping?: (userId: string) => void,
  onPresence?: (activeUsers: number) => void
) {
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!userId) return;

    // Connect WebSocket
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws?userId=${userId}`;

    try {
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('✅ Chat WebSocket connected');
      };

      wsRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.type === 'chat_message' && onMessageReceived) {
          onMessageReceived(data.data);
        }

        if (data.type === 'user_typing' && onTyping) {
          onTyping(data.userId);
        }

        if (data.type === 'presence_update' && onPresence) {
          onPresence(data.activeUsers);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
      };

      wsRef.current.onclose = () => {
        console.log('❌ Chat WebSocket disconnected');
      };
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [userId, onMessageReceived, onTyping, onPresence]);

  const sendMessage = useCallback((message: ChatMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'chat_message',
          ...message
        })
      );
    }
  }, []);

  const sendTypingIndicator = useCallback((recipientId: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'typing',
          recipientId
        })
      );
    }
  }, []);

  const markAsRead = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'mark_read'
        })
      );
    }
  }, []);

  return {
    sendMessage,
    sendTypingIndicator,
    markAsRead,
    isConnected: wsRef.current?.readyState === WebSocket.OPEN
  };
}
