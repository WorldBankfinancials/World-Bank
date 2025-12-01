import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Send, MessageCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRealtimeChat } from '@/hooks/useRealtimeChat';

interface ChatSession {
  id: string;
  customerId: string;
  customerName: string;
  status: 'active' | 'closed';
  messages: Array<{ id: string; sender: string; text: string; timestamp: string }>;
}

interface Message {
  id: string;
  sender: string;
  text: string;
  timestamp: string;
}

export default function AdminLiveChat() {
  const { toast } = useToast();
  const { t } = useLanguage();
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);

  // Realtime chat (hook may not be available)
  const realtimeChat = useRealtimeChat?.('admin_1', (msg: any) => {
    if (msg) setMessages((prev) => [...prev, msg]);
  });
  const sendRealtimeMessage = (realtimeChat as any)?.sendMessage || (() => {});
  const rtConnected = (realtimeChat as any)?.isConnected || false;
  
  // Fetch messages from API when session is selected
  const { data: queryMessages = [] } = useQuery<Message[]>({
    queryKey: ['/api/messages', selectedSession?.id],
    queryFn: async () => {
      if (!selectedSession?.id) return [];
      try {
        const { authenticatedFetch } = await import('@/lib/queryClient');
        const sessionId = `session_${selectedSession.customerId || selectedSession.id}`;
        console.log('📨 Fetching messages for session:', sessionId);
        const response = await authenticatedFetch(`/api/messages/session/${sessionId}`);
        if (!response.ok) return [];
        const data = await response.json();
        console.log('✅ Fetched', data.length, 'messages');
        return data;
      } catch (error) {
        console.error('❌ Failed to fetch messages:', error);
        return [];
      }
    },
    enabled: !!selectedSession?.id
  });

  // Update local messages state when query data changes
  useEffect(() => {
    if (queryMessages && queryMessages.length > 0) {
      setMessages(queryMessages);
    }
  }, [queryMessages]);

  const { data: chatSessions = [] } = useQuery<ChatSession[]>({
    queryKey: ['/api/admin/chat-sessions'],
    queryFn: async () => {
      const { authenticatedFetch } = await import('@/lib/queryClient');
      const response = await authenticatedFetch('/api/admin/chat-sessions');
      return response.ok ? response.json() : [];
    }
  });

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/chat`;

    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      setIsConnected(true);
      wsRef.current?.send(JSON.stringify({
        type: 'auth',
        userId: 'admin_1',
        role: 'admin'
      }));
    };

    wsRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'chat_message') {
          const msg = {
            id: data.data?.id || Date.now().toString(),
            sender: data.data?.senderRole === 'admin' ? 'admin' : 'customer',
            text: data.data?.content || data.data?.message || '',
            timestamp: data.data?.createdAt || new Date().toISOString()
          };
          setMessages((prev: Message[]) => [...prev, msg]);
        }
      } catch (error) {
        console.error('Error parsing chat message:', error);
      }
    };

    wsRef.current.onclose = () => {
      setIsConnected(false);
      toast({
        title: 'Chat disconnected',
        description: 'Lost connection to chat server. Attempting to reconnect...',
        variant: 'destructive',
      });
    };

    return () => {
      wsRef.current?.close();
    };
  }, [toast]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedSession) return;

    const message = {
      id: Date.now().toString(),
      sender: 'admin',
      text: messageText,
      timestamp: new Date().toISOString()
    };

    setMessages((prev: Message[]) => [...prev, message]);
    
    try {
      const { authenticatedFetch } = await import('@/lib/queryClient');
      await authenticatedFetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: messageText,
          recipientId: selectedSession.customerId,
          sessionId: selectedSession.id
        })
      });
    } catch (error) {
      console.error('Failed to save message:', error);
    }

    setMessageText('');
  };

  // Show loading state
  const isLoading = !chatSessions || chatSessions.length === 0;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto grid grid-cols-3 gap-6 h-[calc(100vh-2rem)]">
        <div className="col-span-1">
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageCircle className="w-5 h-5" />
                <span>Chat Sessions</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto space-y-2">
              {(chatSessions as ChatSession[]).length === 0 ? (
                <p className="text-center text-gray-500">No chat sessions</p>
              ) : (
                (chatSessions as ChatSession[]).map((session: ChatSession) => (
                  <div
                    key={session.id}
                    onClick={() => setSelectedSession(session)}
                    className={`p-3 border rounded-lg cursor-pointer transition ${
                      selectedSession?.id === session.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-medium text-sm">{session.customerName}</div>
                    <div className="text-xs text-gray-600">{session.status}</div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="col-span-2">
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle>
                {selectedSession ? `${t('chat_with')} ${selectedSession.customerName}` : t('select_chat_session')}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto space-y-3 mb-4">
              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs p-3 rounded-lg ${
                    msg.sender === 'admin' ? 'bg-blue-500 text-white' : 'bg-gray-200'
                  }`}>
                    <p className="text-sm">{msg.text}</p>
                    <p className="text-xs mt-1 opacity-70">{new Date(msg.timestamp).toLocaleTimeString()}</p>
                  </div>
                </div>
              ))}
            </CardContent>

            {selectedSession && (
              <div className="border-t p-4 space-y-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="Type your message..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!messageText.trim()}
                    className="bg-blue-600 text-white"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
