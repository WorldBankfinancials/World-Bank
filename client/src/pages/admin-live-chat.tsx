import React from "react";
import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BankLogo } from "@/components/BankLogo";
import { MessageSquare, Send, Phone, Video, AlertTriangle, Paperclip, Headphones } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'customer' | 'admin';
  message: string;
  timestamp: Date;
  isRead: boolean;
}

interface ChatSession {
  id: string;
  customerId: string;
  customerName: string;
  status: 'active' | 'waiting' | 'closed';
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  messages: ChatMessage[];
}

interface SupportTicket {
  id: number;
  subject: string;
  customerName: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  createdAt: string;
  description: string;
  category: string;
}

export default function AdminLiveChat() {
  const [activeTab, setActiveTab] = useState("live-chat");
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [adminName] = useState("Customer Support");
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  // Fetch support tickets from API
  const { data: supportTickets = [], isLoading: ticketsLoading } = useQuery<SupportTicket[]>({
    queryKey: ['/api/support-tickets'],
    enabled: user?.role === 'admin',
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Real-time chat sessions - no mock data, only real WebSocket messages
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);

  useEffect(() => {
    connectWebSocket();
    return () => disconnectWebSocket();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [selectedChat, chatSessions]);

  const connectWebSocket = () => {
    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      wsRef.current = new WebSocket(wsUrl);
      
      wsRef.current.onopen = () => {
        setIsConnected(true);
        // Authenticate as admin
        wsRef.current?.send(JSON.stringify({
          type: 'auth',
          userId: 'admin_1',
          role: 'admin'
        }));
        // console.log('Admin chat connected');
      };

      wsRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'chat_message' && data.senderRole === 'customer') {
          // Add customer message to appropriate chat session
          setChatSessions(prev => prev.map(session => {
            if (session.customerId === data.senderId) {
              return {
                ...session,
                messages: [...session.messages, data],
                lastMessage: data.message,
                lastMessageTime: new Date(data.timestamp),
                unreadCount: session.unreadCount + 1,
                status: 'active' as const
              };
            }
            return session;
          }));
        }
      };

      wsRef.current.onclose = () => {
        setIsConnected(false);
        // console.log('Admin chat disconnected');
      };

      wsRef.current.onerror = (_error) => {
        // console.error('Admin WebSocket error:', error);
        setIsConnected(false);
      };
    } catch (error) {
      // console.error('Failed to connect admin chat:', error);
      setIsConnected(false);
    }
  };

  const disconnectWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !selectedChat || !wsRef.current) return;

    const session = chatSessions.find(s => s.id === selectedChat);
    if (!session) return;

    const message: ChatMessage = {
      id: Date.now().toString(),
      senderId: 'admin_1',
      senderName: adminName,
      senderRole: 'admin',
      message: newMessage.trim(),
      timestamp: new Date(),
      isRead: false
    };

    // Update local state
    setChatSessions(prev => prev.map(s => 
      s.id === selectedChat 
        ? { 
            ...s, 
            messages: [...s.messages, message],
            lastMessage: message.message,
            lastMessageTime: message.timestamp
          }
        : s
    ));

    // Send via WebSocket
    if (wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'chat_message',
        ...message,
        recipientId: session.customerId
      }));
    }

    setNewMessage("");
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const markChatAsRead = (chatId: string) => {
    setChatSessions(prev => prev.map(session => 
      session.id === chatId 
        ? { ...session, unreadCount: 0 }
        : session
    ));
  };

  const selectedChatData = chatSessions.find(s => s.id === selectedChat);
  const activeChatCount = chatSessions.filter(s => s.status === 'active').length;
  const waitingChatCount = chatSessions.filter(s => s.status === 'waiting').length;
  const totalUnread = chatSessions.reduce((sum, session) => sum + session.unreadCount, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <BankLogo className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Live Chat & Support</h1>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div className={`flex items-center space-x-1 ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                  <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span>{isConnected ? 'Online' : 'Disconnected'}</span>
                </div>
                <span>•</span>
                <span>{activeChatCount} Active Chats</span>
                <span>•</span>
                <span>{waitingChatCount} Waiting</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {totalUnread > 0 && (
              <Badge variant="destructive" className="animate-pulse">
                {totalUnread} unread messages
              </Badge>
            )}
            <Badge variant={isConnected ? "default" : "secondary"}>
              {isConnected ? "Connected" : "Disconnected"}
            </Badge>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 m-4">
              <TabsTrigger value="live-chat" className="flex items-center space-x-2">
                <MessageSquare className="w-4 h-4" />
                <span>Live Chat</span>
                {totalUnread > 0 && (
                  <Badge variant="destructive" className="ml-1 h-5 text-xs">
                    {totalUnread}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="tickets" className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4" />
                <span>Tickets</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="live-chat" className="px-4 pb-4 space-y-2">
              {chatSessions.map((session) => (
                <Card 
                  key={session.id}
                  className={`cursor-pointer transition-colors ${
                    selectedChat === session.id ? 'ring-2 ring-blue-500' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => {
                    setSelectedChat(session.id);
                    markChatAsRead(session.id);
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                          {session.customerName.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <div className="font-medium text-sm">{session.customerName}</div>
                          <div className={`flex items-center space-x-1 text-xs ${
                            session.status === 'active' ? 'text-green-600' : 
                            session.status === 'waiting' ? 'text-orange-600' : 'text-gray-500'
                          }`}>
                            <div className={`w-2 h-2 rounded-full ${
                              session.status === 'active' ? 'bg-green-500' : 
                              session.status === 'waiting' ? 'bg-orange-500' : 'bg-gray-400'
                            }`}></div>
                            <span className="capitalize">{session.status}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        {session.unreadCount > 0 && (
                          <Badge variant="destructive" className="text-xs mb-1">
                            {session.unreadCount}
                          </Badge>
                        )}
                        <div className="text-xs text-gray-500">
                          {session.lastMessageTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-600 truncate">
                      {session.lastMessage}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="tickets" className="px-4 pb-4 space-y-2">
              {supportTickets.map((ticket) => (
                <Card key={ticket.id} className="cursor-pointer hover:bg-gray-50">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="font-medium text-sm mb-1">{ticket.subject}</div>
                        <div className="text-xs text-gray-500">{ticket.customerName}</div>
                      </div>
                      <Badge 
                        variant={
                          ticket.priority === 'urgent' ? 'destructive' :
                          ticket.priority === 'high' ? 'default' : 'secondary'
                        }
                        className="text-xs"
                      >
                        {ticket.priority}
                      </Badge>
                    </div>
                    
                    <div className="text-xs text-gray-600 mb-2 line-clamp-2">
                      {ticket.description}
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <Badge variant="outline" className="text-xs">
                        {ticket.status}
                      </Badge>
                      <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedChatData ? (
            <>
              {/* Chat Header */}
              <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                      {selectedChatData.customerName.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <div className="font-semibold">{selectedChatData.customerName}</div>
                      <div className={`text-sm flex items-center space-x-1 ${
                        selectedChatData.status === 'active' ? 'text-green-600' : 'text-orange-600'
                      }`}>
                        <div className={`w-2 h-2 rounded-full ${
                          selectedChatData.status === 'active' ? 'bg-green-500' : 'bg-orange-500'
                        }`}></div>
                        <span className="capitalize">{selectedChatData.status}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button size="sm" variant="outline">
                      <Phone className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <Video className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {selectedChatData.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.senderRole === 'admin' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.senderRole === 'admin'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <div className="text-sm">{message.message}</div>
                      <div className={`text-xs mt-1 ${
                        message.senderRole === 'admin' ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="bg-white border-t border-gray-200 p-4">
                <div className="flex items-center space-x-2">
                  <Button size="sm" variant="ghost">
                    <Paperclip className="w-4 h-4" />
                  </Button>
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    className="flex-1"
                    disabled={!isConnected}
                  />
                  <Button 
                    onClick={sendMessage} 
                    disabled={!newMessage.trim() || !isConnected}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <Headphones className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a conversation</h3>
                <p className="text-gray-500">Choose a customer chat from the sidebar to start helping them</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
