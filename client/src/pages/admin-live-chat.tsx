import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Send, MessageCircle, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'wouter';
import { supabase } from '@/lib/supabase';

interface ChatSession {
  id: string;
  customerId: number;
  customerName: string;
  status: 'active' | 'closed';
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
  const { userProfile, user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  // Auth guard — must be admin
  useEffect(() => {
    if (authLoading) return;
    if (!user) { setLocation('/admin-login'); return; }
    const storedProfile = localStorage.getItem('userProfile');
    const profile = storedProfile ? JSON.parse(storedProfile) : null;
    const role = profile?.role || userProfile?.role;
    if (role && role !== 'admin') { setLocation('/login'); }
  }, [user, userProfile, authLoading]);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectAttemptsRef = useRef(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [isConnected, setIsConnected] = useState(false);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessageSessionIds, setNewMessageSessionIds] = useState<Set<string>>(new Set());

  const adminDbId = userProfile?.id;

  // Fetch all customer chat sessions
  const { data: chatSessions = [], refetch: refetchSessions } = useQuery<ChatSession[]>({
    queryKey: ['/api/admin/chat-sessions'],
    queryFn: async () => {
      const { authenticatedFetch } = await import('@/lib/queryClient');
      const response = await authenticatedFetch('/api/admin/chat-sessions');
      return response.ok ? response.json() : [];
    },
    refetchInterval: 30000
  });

  // Fetch messages for selected session
  const { data: sessionMessages = [], isLoading: messagesLoading } = useQuery<any[]>({
    queryKey: ['/api/messages/session', selectedSession?.id],
    queryFn: async () => {
      if (!selectedSession) return [];
      const { authenticatedFetch } = await import('@/lib/queryClient');
      const sessionId = `session_${selectedSession.customerId}`;
      const response = await authenticatedFetch(`/api/messages/session/${sessionId}`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!selectedSession,
    refetchInterval: 10000
  });

  // Map raw DB messages to UI format
  useEffect(() => {
    if (!sessionMessages || !Array.isArray(sessionMessages)) return;
    const mapped: Message[] = sessionMessages.map((m: any) => ({
      id: String(m.id || Date.now()),
      sender: m.sender_role === 'admin' ? 'admin' : 'customer',
      text: m.content || '',
      timestamp: m.created_at || new Date().toISOString()
    }));
    setMessages(mapped);
  }, [sessionMessages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Supabase Realtime — subscribe to incoming customer messages for admin
  useEffect(() => {
    if (!adminDbId) return;

    const channel = supabase
      .channel(`admin_inbox:${adminDbId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `recipient_id=eq.${adminDbId}`
        },
        (payload) => {
          const newMsg = payload.new as any;
          const sessionId = newMsg.session_id || `session_${newMsg.sender_id}`;

          // Mark session as having a new message
          setNewMessageSessionIds(prev => new Set(Array.from(prev).concat(sessionId)));

          // If this message belongs to the currently selected session, add it to UI
          if (selectedSession && sessionId === `session_${selectedSession.customerId}`) {
            const mapped: Message = {
              id: String(newMsg.id || Date.now()),
              sender: newMsg.sender_role === 'admin' ? 'admin' : 'customer',
              text: newMsg.content || '',
              timestamp: newMsg.created_at || new Date().toISOString()
            };
            setMessages(prev => {
              if (prev.some(m => m.id === mapped.id)) return prev;
              return [...prev, mapped];
            });
          }

          // Refresh sessions to update unread counts
          queryClient.invalidateQueries({ queryKey: ['/api/admin/chat-sessions'] });
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [adminDbId, selectedSession, queryClient]);

  // WebSocket connection for live presence and real-time push
  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const token = localStorage.getItem('token') || '';
    const adminId = String(adminDbId || 'admin');
    const wsUrl = `${protocol}//${window.location.host}/ws/chat?userId=${adminId}&role=admin&token=${encodeURIComponent(token)}`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      reconnectAttemptsRef.current = 0;
      ws.send(JSON.stringify({
        type: 'auth',
        userId: adminId,
        role: 'admin',
        token
      }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'chat_message' && data.data) {
          const newMsg = data.data;
          const sessionId = newMsg.session_id || `session_${newMsg.sender_id}`;
          if (selectedSession && sessionId === `session_${selectedSession.customerId}`) {
            const mapped: Message = {
              id: String(newMsg.id || Date.now()),
              sender: newMsg.sender_role === 'admin' ? 'admin' : 'customer',
              text: newMsg.content || '',
              timestamp: newMsg.created_at || new Date().toISOString()
            };
            setMessages(prev => {
              if (prev.some(m => m.id === mapped.id)) return prev;
              return [...prev, mapped];
            });
          }
        }
      } catch (_) {}
    };

    ws.onclose = () => {
      setIsConnected(false);
      // Exponential backoff reconnect
      const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
      reconnectAttemptsRef.current++;
      reconnectTimeoutRef.current = setTimeout(connectWebSocket, delay);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [adminDbId, selectedSession]);

  useEffect(() => {
    if (!adminDbId) return;
    connectWebSocket();
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      wsRef.current?.close();
    };
  }, [adminDbId, connectWebSocket]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedSession) return;

    const text = messageText.trim();
    setMessageText('');

    // Optimistically add message
    const optimisticMsg: Message = {
      id: `optimistic_${Date.now()}`,
      sender: 'admin',
      text,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, optimisticMsg]);

    try {
      const { authenticatedFetch } = await import('@/lib/queryClient');
      const response = await authenticatedFetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: text,
          recipientId: selectedSession.customerId,
          sessionId: `session_${selectedSession.customerId}`
        })
      });

      if (response.ok) {
        queryClient.invalidateQueries({ queryKey: ['/api/messages/session', selectedSession.id] });
      } else {
        toast({ title: 'Failed to send', description: 'Message could not be delivered.', variant: 'destructive' });
      }
    } catch (_) {
      toast({ title: 'Error', description: 'Connection failed. Please try again.', variant: 'destructive' });
    }
  };

  const handleSelectSession = (session: ChatSession) => {
    setSelectedSession(session);
    setNewMessageSessionIds(prev => {
      const updated = new Set(prev);
      updated.delete(`session_${session.customerId}`);
      return updated;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <MessageCircle className="w-6 h-6 text-blue-600" />
            Admin Live Chat
          </h1>
          <div className="flex items-center gap-3">
            {isConnected
              ? <Badge className="bg-green-100 text-green-800 flex items-center gap-1"><Wifi className="w-3 h-3" /> Live</Badge>
              : <Badge className="bg-red-100 text-red-800 flex items-center gap-1"><WifiOff className="w-3 h-3" /> Reconnecting...</Badge>
            }
            <Button variant="outline" size="sm" onClick={() => refetchSessions()}>
              <RefreshCw className="w-4 h-4 mr-1" /> Refresh
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 h-[calc(100vh-10rem)]">
          {/* Sessions List */}
          <div className="col-span-1">
            <Card className="h-full flex flex-col">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Customer Sessions ({chatSessions.length})</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto space-y-2 p-2">
                {chatSessions.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No customer sessions yet</p>
                  </div>
                ) : (
                  chatSessions.map((session) => {
                    const hasNew = newMessageSessionIds.has(`session_${session.customerId}`);
                    return (
                      <div
                        key={session.id}
                        onClick={() => handleSelectSession(session)}
                        className={`p-3 border rounded-lg cursor-pointer transition-all ${
                          selectedSession?.id === session.id
                            ? 'border-blue-500 bg-blue-50'
                            : hasNew
                              ? 'border-orange-400 bg-orange-50'
                              : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="font-medium text-sm truncate">{session.customerName}</div>
                          {hasNew && <Badge className="bg-orange-500 text-white text-xs px-1.5">New</Badge>}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">ID: {session.customerId}</div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>

          {/* Chat Area */}
          <div className="col-span-2">
            <Card className="h-full flex flex-col">
              <CardHeader className="pb-2 border-b">
                <CardTitle className="text-base">
                  {selectedSession
                    ? `Chatting with ${selectedSession.customerName}`
                    : 'Select a customer to start chatting'}
                </CardTitle>
              </CardHeader>

              <CardContent className="flex-1 overflow-y-auto space-y-3 p-4">
                {!selectedSession ? (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <div className="text-center">
                      <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      <p>Select a customer from the list to view their messages</p>
                    </div>
                  </div>
                ) : messagesLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-gray-400 text-sm">Loading messages...</div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <p className="text-sm">No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs lg:max-w-sm xl:max-w-md p-3 rounded-2xl shadow-sm ${
                        msg.sender === 'admin'
                          ? 'bg-blue-600 text-white rounded-tr-none'
                          : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none'
                      }`}>
                        <p className="text-sm break-words">{msg.text}</p>
                        <p className={`text-xs mt-1 ${msg.sender === 'admin' ? 'text-blue-200' : 'text-gray-400'}`}>
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </CardContent>

              {selectedSession && (
                <div className="border-t p-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder={`Reply to ${selectedSession.customerName}...`}
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      className="flex-1"
                      autoFocus
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!messageText.trim()}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Press Enter to send • Message delivered via Supabase Realtime</p>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
