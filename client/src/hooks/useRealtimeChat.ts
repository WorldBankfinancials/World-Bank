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
  // WebSocket disabled - using API polling instead for stability
  useEffect(() => {
    // Placeholder for future real-time integration
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
