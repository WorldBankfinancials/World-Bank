import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Send, MessageCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';

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
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isConnected, setIsConnected] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const subscriptionRef = useRef<any>(null);

  // Fetch messages from database on mount and when user opens chat
  const { data: chatMessages = [] } = useQuery({
    queryKey: ['/api/chat/history'],
    queryFn: async () => {
      try {
        const { authenticatedFetch } = await import('@/lib/queryClient');
        const response = await authenticatedFetch('/api/chat/history');
        if (!response.ok) return [];
        const data = await response.json();
        return Array.isArray(data) ? data.map((msg: any) => ({
          id: msg.id || msg.message_id || Date.now().toString(),
          sender: msg.sender_type === 'user' ? 'user' : 'agent',
          text: msg.content || msg.message || msg.text || '',
          timestamp: new Date(msg.created_at || msg.timestamp || new Date())
        })) : [];
      } catch {
        return [];
      }
    },
    enabled: !!isOpen,
    staleTime: 5000,
  });

  // Update local messages when query data changes
  useEffect(() => {
    if (chatMessages && chatMessages.length > 0) {
      setMessages(chatMessages);
    } else if (messages.length === 0) {
      setMessages([{
        id: '1',
        sender: 'agent',
        text: 'Hello! How can we help you today?',
        timestamp: new Date()
      }]);
    }
  }, [chatMessages]);

  // SUPABASE REALTIME: Subscribe to chat messages changes
  useEffect(() => {
    if (!isOpen) return;

    const setupRealtimeSubscription = async () => {
      try {
        // Subscribe to bank_chat_messages table changes
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
                sender: payload.new.sender_type === 'user' ? 'user' : 'agent',
                text: payload.new.content || payload.new.message || '',
                timestamp: new Date(payload.new.created_at || new Date())
              };
              setMessages(prev => [...prev, newMessage]);
            }
          )
          .subscribe((status) => {
            setIsConnected(status === 'SUBSCRIBED');
            if (status === 'SUBSCRIBED') {
              console.log('✅ Connected to Supabase Realtime chat');
            }
          });

        subscriptionRef.current = channel;
      } catch (error) {
        console.error('❌ Realtime subscription failed:', error);
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

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: inputText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const messageText = inputText;
    setInputText('');

    try {
      const { authenticatedFetch } = await import('@/lib/queryClient');
      const response = await authenticatedFetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageText })
      });

      if (response.ok) {
        const agentMessage: Message = {
          id: Date.now().toString() + '_agent',
          sender: 'agent',
          text: 'Your message has been received. An agent will respond shortly.',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, agentMessage]);
      } else {
        toast({ title: 'Error', description: 'Failed to send message', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Connection failed', variant: 'destructive' });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-24 right-4 w-96 max-h-screen z-50 shadow-2xl flex flex-col hover:right-2 transition-all duration-300">
      <Card className="rounded-xl overflow-hidden border-2 border-blue-500 bg-white h-screen flex flex-col cursor-default">
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
                  autoCapitalize="off"
                  autoCorrect="off"
                  className="text-base p-3 border-2 border-blue-400 rounded-lg font-medium flex-1 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputText.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 h-12 font-bold rounded-lg flex-shrink-0"
                  size="sm"
                >
                  <Send className="w-5 h-5" />
                </Button>
              </div>
            </div>
            {isConnected && (
              <p className="text-xs text-green-700 font-semibold text-center">✓ Connected to support</p>
            )}
            {!isConnected && (
              <p className="text-xs text-gray-600 font-semibold text-center">Connecting...</p>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
