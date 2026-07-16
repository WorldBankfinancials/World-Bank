import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Send, MessageCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { authenticatedFetch } from '@/lib/queryClient';
import { supabase } from '@/lib/supabase';

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

const STORAGE_KEY = 'bank_chat_messages_v2';

export default function LiveChat({ isOpen = true, onClose }: LiveChatProps) {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isConnected, setIsConnected] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const subscriptionRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMessages(parsed.map((m: Record<string, unknown>) => ({
              ...(m as object),
              timestamp: new Date(m.timestamp as string)
            } as Message)));
            return;
          }
        } catch {
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch (e) {
    }
    
    const defaultMsg: Message = {
      id: Date.now().toString(),
      sender: 'agent',
      text: 'Hello! How can we help you today?',
      timestamp: new Date()
    };
    setMessages([defaultMsg]);
    localStorage.setItem(STORAGE_KEY, JSON.stringify([defaultMsg]));
  }, []);

  useEffect(() => {
    if (messages.length === 0) return;
    
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    
    saveTimeoutRef.current = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
      } catch (e) {
      }
    }, 500);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [messages]);

  useEffect(() => {
    if (!isOpen) return;

    const setupRealtimeSubscription = async () => {
      try {
        const channel = supabase
          .channel('chat_messages_realtime')
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'messages'
            },
            (payload: Record<string, unknown>) => {
              const newRecord = payload.new as Record<string, unknown>;
              const newMessage: Message = {
                id: newRecord.id?.toString() || Date.now().toString(),
                sender: (newRecord.sender_role === 'customer' ? 'user' : 'agent') as 'user' | 'agent',
                text: (newRecord.message as string) || '',
                timestamp: new Date((newRecord.created_at as string) || new Date())
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
      } catch (error) {
        setIsConnected(false);
      }
    };

    setupRealtimeSubscription();

    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
      }
    };
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = useCallback(async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: inputText,
      timestamp: new Date()
    };

    const messageText = inputText;
    setInputText('');
    
    setMessages(prev => {
      const updated = [...prev, userMessage];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
      }
      return updated;
    });

    try {
      const response = await authenticatedFetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageText })
      });

      if (!response.ok) {
        toast({ title: 'Error', description: 'Failed to send message', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Connection failed', variant: 'destructive' });
    }
  }, [inputText, toast]);

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-24 right-4 w-96 h-96 z-50 shadow-2xl flex flex-col hover:right-2 transition-all duration-300 top-auto">
      <Card className="rounded-xl overflow-hidden border-2 border-blue-500 bg-white h-full flex flex-col cursor-default">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="bg-white/30 p-2 rounded-full">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-white text-base font-bold">Live Chat Support</CardTitle>
              <p className="text-xs text-blue-100">Usually replies in minutes</p>
            </div>
          </div>
          {onClose && (
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-blue-700 h-8 w-8 p-0 flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-3 space-y-2">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[75%] p-2 rounded-lg text-sm ${
                  msg.sender === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {msg.text}
                <div className="text-[10px] opacity-70 mt-1">
                  {msg.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </CardContent>
        <div className="border-t p-2 flex gap-2 flex-shrink-0">
          <Input
            ref={inputRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type your message..."
            className="flex-1"
          />
          <Button onClick={handleSendMessage} size="sm" className="bg-blue-600 hover:bg-blue-700">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
}
