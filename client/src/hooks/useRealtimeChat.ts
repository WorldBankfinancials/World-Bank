/**
 * REAL-TIME CHAT HOOK
 * Live chat messaging with WebSocket and Supabase Realtime
 */

import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';

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
    const wsUrl = `${protocol}//${window.location.host}/ws/chat?userId=${userId}`;

    try {
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'chat_message' && onMessageReceived && data.data) {
            onMessageReceived(data.data);
          }

          if (data.type === 'user_typing' && onTyping && data.userId) {
            onTyping(data.userId);
          }

          if (data.type === 'presence_update' && onPresence && typeof data.activeUsers === 'number') {
            onPresence(data.activeUsers);
          }
        } catch (error) {
        }
      };

      wsRef.current.onerror = (error) => {
      };

      wsRef.current.onclose = () => {
      };
    } catch (error) {
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
