import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Send, MessageCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface Message {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: Date;
}

interface LiveChatProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function LiveChat({ isOpen = true, onClose }: LiveChatProps) {
  const { toast } = useToast();
  const { userProfile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [sending, setSending] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const subscriptionRef = useRef<any>(null);

  const userId = userProfile?.id;
  const storageKey = `wb_chat_${userId || 'guest'}`;

  // Load message history from API + fallback to localStorage
  useEffect(() => {
    if (!isOpen || historyLoaded || !userId) return;
    setHistoryLoaded(true);

    const loadHistory = async () => {
      try {
        const { authenticatedFetch } = await import('@/lib/queryClient');
        const response = await authenticatedFetch(`/api/messages/session/session_${userId}`);
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data) && data.length > 0) {
            const mapped: Message[] = data.map((m: any) => ({
              id: String(m.id),
              sender: m.sender_role === 'customer' ? 'user' : 'agent',
              text: m.content || '',
              timestamp: new Date(m.created_at || Date.now())
            }));
            setMessages(mapped);
            return;
          }
        }
      } catch (_) {}

      // Fallback: load from localStorage
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMessages(parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })));
            return;
          }
        }
      } catch (_) {}

      // Default welcome message
      setMessages([{
        id: 'welcome',
        sender: 'agent',
        text: 'Hello! Welcome to World Bank support. How can we help you today?',
        timestamp: new Date()
      }]);
    };

    loadHistory();
  }, [isOpen, historyLoaded, userId, storageKey]);

  // Save to localStorage on change
  useEffect(() => {
    if (messages.length === 0 || !userId) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(messages));
    } catch (_) {}
  }, [messages, storageKey, userId]);

  // Supabase Realtime — ONLY subscribe to messages sent TO this user (admin → customer)
  useEffect(() => {
    if (!isOpen || !userId) return;

    const channel = supabase
      .channel(`customer_inbox:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `recipient_id=eq.${userId}`
        },
        (payload: any) => {
          const raw = payload.new;
          if (!raw || raw.sender_role === 'customer') return;
          const newMessage: Message = {
            id: String(raw.id || Date.now()),
            sender: 'agent',
            text: raw.content || '',
            timestamp: new Date(raw.created_at || Date.now())
          };
          setMessages(prev => {
            if (prev.some(m => m.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          });
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    subscriptionRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen, userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = useCallback(async () => {
    if (!inputText.trim() || sending) return;

    const text = inputText.trim();
    setInputText('');
    setSending(true);

    const optimisticMsg: Message = {
      id: `opt_${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, optimisticMsg]);

    try {
      const { authenticatedFetch } = await import('@/lib/queryClient');
      const response = await authenticatedFetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      });

      if (!response.ok) {
        toast({ title: 'Error', description: 'Failed to send message. Please try again.', variant: 'destructive' });
      }
    } catch (_) {
      toast({ title: 'Error', description: 'Connection failed. Please try again.', variant: 'destructive' });
    } finally {
      setSending(false);
    }
  }, [inputText, sending, toast]);

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-24 right-4 w-96 h-96 z-50 shadow-2xl flex flex-col top-auto">
      <Card className="rounded-xl overflow-hidden border-2 border-blue-500 bg-white h-full flex flex-col cursor-default">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="bg-white/30 p-2 rounded-full">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-white text-base font-bold">Live Chat Support</CardTitle>
              <div className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-yellow-400'}`} />
                <p className="text-xs text-blue-100">{isConnected ? 'Connected' : 'Connecting...'}</p>
              </div>
            </div>
          </div>
          {onClose && (
            <Button onClick={onClose} variant="ghost" size="sm" className="text-white hover:bg-blue-700 h-8 w-8 p-0">
              <X className="w-5 h-5" />
            </Button>
          )}
        </CardHeader>

        <div className="flex flex-col flex-1 bg-gray-50 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs px-3 py-2 rounded-2xl text-sm break-words shadow-sm ${
                  msg.sender === 'user'
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : 'bg-white text-gray-900 border border-gray-200 rounded-bl-none'
                }`}>
                  <p className="leading-relaxed">{msg.text}</p>
                  <p className={`text-xs mt-1 ${msg.sender === 'user' ? 'text-blue-200' : 'text-gray-400'}`}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="bg-white p-3 border-t-2 border-gray-200 flex-shrink-0">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                placeholder="Type your message..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                disabled={sending}
                className="border-blue-200 focus:border-blue-500 text-sm"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputText.trim() || sending}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3"
                size="sm"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
