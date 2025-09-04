import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BankLogo } from "@/components/BankLogo";
import { MessageSquare, Send, Phone, Video, AlertTriangle, Paperclip, Headphones } from "lucide-react";
import { realtimeChat, RealtimeMessage, realtimeAlerts } from "@/lib/supabase-realtime";

interface ChatMessage extends RealtimeMessage {}

interface ChatSession {
  customerId: string;
  customerName: string;
  messages: ChatMessage[];
  status: 'active' | 'waiting' | 'closed';
  unreadCount: number;
  lastMessage: string;
  lastMessageTime: Date;
}

interface SupportTicket {
  id: string;
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
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load chats and tickets
  useEffect(() => {
    const loadChats = async () => {
      const msgs = await realtimeChat.getMessages();
      const sessions: { [key: string]: ChatSession } = {};
      msgs.forEach(m => {
        if (!sessions[m.senderId]) {
          sessions[m.senderId] = {
            customerId: m.senderId,
            customerName: m.senderName,
            messages: [],
            status: 'active',
            unreadCount: 0,
            lastMessage: '',
            lastMessageTime: new Date(0),
          };
        }
        sessions[m.senderId].messages.push(m);
        sessions[m.senderId].lastMessage = m.message;
        sessions[m.senderId].lastMessageTime = new Date(m.timestamp);
        if (m.senderRole === 'customer') sessions[m.senderId].unreadCount++;
      });
      setChatSessions(Object.values(sessions));
    };

    const loadTickets = async () => {
      const tks = await realtimeAlerts.getAlerts();
      setTickets(tks.map(t => ({
        id: t.id,
        subject: t.title,
        customerName: t.userId,
        priority: 'medium',
        status: 'open',
        createdAt: t.timestamp.toISOString(),
        description: t.message,
        category: 'general'
      })));
    };

    loadChats();
    loadTickets();

    // Subscribe to chat messages
    realtimeChat.subscribe((message: RealtimeMessage) => {
      setChatSessions(prev => {
        const sessionIndex = prev.findIndex(s => s.customerId === message.senderId);
        if (sessionIndex !== -1) {
          const updated = [...prev];
          updated[sessionIndex].messages.push(message);
          updated[sessionIndex].lastMessage = message.message;
          updated[sessionIndex].lastMessageTime = new Date(message.timestamp);
          if (message.senderRole === 'customer') updated[sessionIndex].unreadCount++;
          return updated;
        } else {
          return [
            ...prev,
            {
              customerId: message.senderId,
              customerName: message.senderName,
              messages: [message],
              status: 'active',
              unreadCount: message.senderRole === 'customer' ? 1 : 0,
              lastMessage: message.message,
              lastMessageTime: new Date(message.timestamp)
            }
          ];
        }
      });
    });

    // Subscribe to tickets
    realtimeAlerts.subscribe((alert) => {
      setTickets(prev => [
        ...prev,
        {
          id: alert.id,
          subject: alert.title,
          customerName: alert.userId,
          priority: 'medium',
          status: 'open',
          createdAt: alert.timestamp.toISOString(),
          description: alert.message,
          category: 'general'
        }
      ]);
    });

    return () => {
      realtimeChat.unsubscribe();
      realtimeAlerts.unsubscribe();
    };
  }, []);

  const selectedSession = chatSessions.find(s => s.customerId === selectedChat);

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return;
    await realtimeChat.sendMessage(newMessage.trim(), 'admin');
    setNewMessage("");
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [selectedChat, chatSessions]);

  const totalUnreadChats = chatSessions.reduce((sum, s) => sum + s.unreadCount, 0);
  const totalTickets = tickets.length;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 m-4">
            <TabsTrigger value="live-chat" className="flex items-center space-x-2">
              <MessageSquare className="w-4 h-4" />
              <span>Live Chat</span>
              {totalUnreadChats > 0 && (
                <Badge variant="destructive">{totalUnreadChats}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="tickets" className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4" />
              <span>Tickets</span>
              {totalTickets > 0 && (
                <Badge variant="destructive">{totalTickets}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Live Chat Tab */}
          <TabsContent value="live-chat" className="px-4 pb-4 space-y-2">
            {chatSessions.map(session => (
              <Card
                key={session.customerId}
                className={`cursor-pointer ${selectedChat === session.customerId ? 'ring-2 ring-blue-500' : 'hover:bg-gray-50'}`}
                onClick={() => setSelectedChat(session.customerId)}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between">
                    <div>
                      {session.customerName}
                      {session.unreadCount > 0 && <Badge variant="destructive" className="ml-2">{session.unreadCount}</Badge>}
                    </div>
                    <div className="text-xs text-gray-500">
                      {session.lastMessageTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 truncate">{session.lastMessage}</div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Tickets Tab */}
          <TabsContent value="tickets" className="px-4 pb-4 space-y-2">
            {tickets.map(ticket => (
              <Card key={ticket.id} className="cursor-pointer hover:bg-gray-50">
                <CardContent className="p-4">
                  <div className="flex justify-between mb-2">
                    <div className="font-medium text-sm">{ticket.subject}</div>
                    <Badge variant="default" className="text-xs">{ticket.priority}</Badge>
                  </div>
                  <div className="text-xs text-gray-600 mb-2 line-clamp-2">{ticket.description}</div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <Badge variant="outline" className="text-xs">{ticket.status}</Badge>
                    <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>

      {/* Chat Window */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedSession ? (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {selectedSession.messages.map(m => (
                <div key={m.id} className={`flex ${m.senderRole === 'admin' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`p-3 rounded-lg max-w-xs ${m.senderRole === 'admin' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
                    <div>{m.message}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-3 border-t border-gray-200 flex space-x-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); sendMessage(); } }}
                placeholder="Type your message..."
              />
              <Button onClick={sendMessage}>Send</Button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <Headphones className="w-16 h-16 mx-auto mb-2" />
              Select a chat from the sidebar
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
