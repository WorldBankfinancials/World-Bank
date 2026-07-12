/**
 * REAL-TIME CHAT HOOK
 * Live chat messaging with Supabase Realtime
 */

import { useEffect, useCallback } from 'react';
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
  useEffect(() => {
    if (!userId) return;

    // Subscribe to chat messages for this user
    const channel = supabase.channel(`chat:${userId}`);

    const handleMessage = (payload: any) => {
      if (onMessageReceived && payload.new) {
        onMessageReceived({
          id: payload.new.id,
          senderId: payload.new.sender_id,
          senderName: payload.new.sender_name,
          senderRole: payload.new.sender_role,
          message: payload.new.message,
          conversationId: payload.new.conversation_id,
          isRead: payload.new.is_read,
          timestamp: payload.new.created_at
        });
      }
    };

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
  }, [userId, onMessageReceived]);

  return null;
}