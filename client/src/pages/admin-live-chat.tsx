import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BankLogo } from "@/components/BankLogo";
import { MessageSquare, Send, Phone, Video, AlertTriangle, Paperclip, Headphones } from "lucide-react";
import { realtimeChat, RealtimeMessage } from "@/lib/supabase-realtime";

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

export default function AdminLiveChat() {
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load initial messages
    const loadMessages = async () => {
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

    loadMessages();

    // Subscribe to new messages
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

    return () => {
      realtimeChat.unsubscribe();
    };
  }, []);

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return;

    const session = chatSessions.find(s => s.customerId === selectedChat);
    if (!session) return;

    await realtimeChat.sendMessage(newMessage.trim(), 'admin');
    setNewMessage("");
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [selectedChat, chatSessions]);

  const selectedSession = chatSessions.find(s => s.customerId === selectedChat);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200">
        <Tabs value="live-chat">
          <TabsList className="grid w-full grid-cols-1">
            {chatSessions.map(session => (
              <TabsTrigger
                key={session.customerId}
                className={`cursor-pointer ${selectedChat === session.customerId ? 'ring-2 ring-blue-500' : ''}`}
                onClick={() => setSelectedChat(session.customerId)}
              >
                <div className="flex justify-between">
                  <span>{session.customerName}</span>
                  {session.unreadCount > 0 && (
                    <Badge variant="destructive">{session.unreadCount}</Badge>
                  )}
                </div>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Chat Window */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedSession ? (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {selectedSession.messages.map((m) => (
                <div key={m.id} className={`flex ${m.senderRole === 'admin' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`p-3 rounded-lg max-w-xs ${
                    m.senderRole === 'admin' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'
                  }`}>
                    <div>{m.message}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
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
