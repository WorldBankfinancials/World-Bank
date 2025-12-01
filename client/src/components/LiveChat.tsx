import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Send, MessageCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
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

const STORAGE_KEY = 'wb_chat_messages';

export default function LiveChat({ isOpen = true, onClose }: LiveChatProps) {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isConnected, setIsConnected] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const subscriptionRef = useRef<any>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();

  // STEP 1: Load messages from localStorage on mount (PERSISTENT)
  useEffect(() => {
    if (!isOpen) return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed.map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp)
          })));
          return;
        }
      }
    } catch (e) {
      // Ignore parse errors
    }
    
    // Default message
    const defaultMsg: Message = {
      id: '1',
      sender: 'agent',
      text: 'Hello! How can we help you today?',
      timestamp: new Date()
    };
    setMessages([defaultMsg]);
    localStorage.setItem(STORAGE_KEY, JSON.stringify([defaultMsg]));
  }, [isOpen]);

  // STEP 2: Save messages to localStorage whenever they change (PERSISTENT)
  useEffect(() => {
    if (messages.length === 0) return;
    
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    
    saveTimeoutRef.current = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    }, 1000);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [messages]);

  // STEP 3: Setup Realtime subscription
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
              table: 'bank_chat_messages'
            },
            (payload: any) => {
              const newMessage: Message = {
                id: payload.new.id?.toString() || Date.now().toString(),
                sender: (payload.new.sender_type === 'user' ? 'user' : 'agent') as 'user' | 'agent',
                text: payload.new.content || payload.new.message || '',
                timestamp: new Date(payload.new.created_at || new Date())
              };
              setMessages(prev => [...prev, newMessage]);
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
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });

    try {
      const { authenticatedFetch } = await import('@/lib/queryClient');
      const response = await authenticatedFetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageText })
      });

      if (response.ok) {
        const agentMessage: Message = {
          id: (Date.now() + 1).toString(),
          sender: 'agent',
          text: 'Your message has been received. An agent will respond shortly.',
          timestamp: new Date()
        };
        setMessages(prev => {
          const updated = [...prev, agentMessage];
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
          return updated;
        });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to send message', variant: 'destructive' });
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
              <X className="w-5 h-5" />
            </Button>
          )}
        </CardHeader>

        <div className="flex flex-col flex-1 bg-gray-50 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 pr-6 space-y-4 border-b-2 border-gray-200">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'user' ? 'justify-end pr-2' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs px-4 py-2 rounded-lg text-sm break-words ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-br-none shadow'
                      : 'bg-white text-gray-900 border border-gray-300 rounded-bl-none shadow'
                  }`}
                >
                  <p className="mb-1 leading-relaxed">{msg.text}</p>
                  <p className={`text-xs ${msg.sender === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                    {msg.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="bg-white p-4 space-y-3 border-t-2 border-gray-200 flex-shrink-0">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 block">Type your message:</label>
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  placeholder="Type your message..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  autoFocus
                  type="text"
                  className="border-blue-200 focus:border-blue-500"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputText.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4"
                  size="sm"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
            {!isConnected && (
              <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded">
                Connection status: Reconnecting...
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
