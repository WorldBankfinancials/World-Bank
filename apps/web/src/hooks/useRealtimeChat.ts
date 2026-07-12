/**
 * REAL-TIME CHAT HOOK
 * Live chat messaging with Supabase Realtime
 */

import { useEffect, useCallback, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface ChatMessage {
  id?: string;
  senderId: string;
  senderName: string;
  senderRole: 'admin' | 'customer';
  message: string;
  conversationId?: string;
  isRead?: boolean;
  timestamp?: string;
}

export function useRealtimeChat(
  userId: string | undefined,
  onMessageReceived?: (message: ChatMessage) => void
) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const handleMessage = useCallback(
    (payload: { new: Record<string, unknown> }) => {
      if (!payload.new) return;
      const message: ChatMessage = {
        id: payload.new.id as string | undefined,
        senderId: payload.new.sender_id as string,
        senderName: payload.new.sender_name as string,
        senderRole: payload.new.sender_role as 'admin' | 'customer',
        message: payload.new.message as string,
        conversationId: payload.new.conversation_id as string | undefined,
        isRead: payload.new.is_read as boolean | undefined,
        timestamp: payload.new.created_at as string | undefined
      };
      setMessages((prev) => [...prev, message]);
      if (onMessageReceived) {
        onMessageReceived(message);
      }
    },
    [onMessageReceived]
  );

  useEffect(() => {
    if (!userId) return;

    // Subscribe to chat messages for this user
    const channel = supabase.channel(`chat:${userId}`);

    channel
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `sender_id=eq.${userId}`
        },
        handleMessage
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `recipient_id=eq.${userId}`
        },
        handleMessage
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [userId, handleMessage]);

  return { messages };
}
