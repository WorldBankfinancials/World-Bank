import { useState, useEffect, useRef } from "react";
import { MessageSquare, Send, X, Phone, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// import { useAuth } from "@/contexts/AuthContext";
import { realtimeChat, RealtimeMessage } from "@/lib/supabase-realtime";


interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'customer' | 'admin';
  message: string;
  timestamp: Date;
  isRead: boolean;
}

interface LiveChatProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LiveChat({ isOpen, onClose }: LiveChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      senderId: 'admin-1',
      senderName: 'Customer Support',
      senderRole: 'admin',
      message: 'Hello! How can I help you today?',
      timestamp: new Date(Date.now() - 60000),
      isRead: true
    }
  ]);
  const [newMessage, setNewMessage] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      connectSupabaseRealtime();
      loadChatHistory();
    } else {
      disconnectSupabaseRealtime();
    }

    return () => {
      disconnectSupabaseRealtime();
    };
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chat history from Supabase
  const loadChatHistory = async () => {
    try {
      const chatMessages = await realtimeChat.getMessages();
      const formattedMessages: ChatMessage[] = chatMessages.map(msg => ({
        id: msg.id,
        senderId: msg.senderId,
        senderName: msg.senderName,
        senderRole: msg.senderRole,
        message: msg.message,
        timestamp: msg.timestamp,
        isRead: msg.isRead
      }));
      setMessages(formattedMessages);
    } catch (error) {
      console.error('Failed to load chat history:', error);
    }
  };

  // Connect to Supabase Realtime for live chat
  const connectSupabaseRealtime = () => {
    try {
      realtimeChat.subscribe((message: RealtimeMessage) => {
        const newMessage: ChatMessage = {
          id: message.id,
          senderId: message.senderId,
          senderName: message.senderName,
          senderRole: message.senderRole,
          message: message.message,
          timestamp: message.timestamp,
          isRead: message.isRead
        };
        setMessages(prev => [...prev, newMessage]);
      });
      setIsConnected(true);
    } catch (error) {
      console.error('Failed to connect to Supabase Realtime:', error);
      setIsConnected(false);
    }
  };

  const disconnectSupabaseRealtime = () => {
    realtimeChat.unsubscribe();
    setIsConnected(false);
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      // Send message via Supabase Realtime
      await realtimeChat.sendMessage(newMessage.trim(), 'customer');
      setNewMessage("");
    } catch (error) {
      console.error('Failed to send message:', error);
    }
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

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-20 right-4 w-80 h-[400px] bg-white rounded-lg shadow-xl border border-gray-200 z-50 flex flex-col">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-blue-600 text-white rounded-t-lg">
        <div className="flex items-center space-x-2">
          <MessageSquare className="w-5 h-5" />
          <div>
            <div className="font-semibold">Live Support</div>
            <div className="text-xs flex items-center space-x-1">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
              <span>{isConnected ? 'Online' : 'Connecting...'}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button size="sm" variant="ghost" className="text-white hover:bg-blue-700 p-1">
            <Phone className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="ghost" className="text-white hover:bg-blue-700 p-1">
            <Video className="w-4 h-4" />
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            className="text-white hover:bg-blue-700 p-1"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.senderRole === 'customer' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs p-3 rounded-lg ${
                message.senderRole === 'customer'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              <div className="text-sm">{message.message}</div>
              <div className={`text-xs mt-1 ${
                message.senderRole === 'customer' ? 'text-blue-100' : 'text-gray-500'
              }`}>
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-800 p-3 rounded-lg">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input - Fixed at Bottom */}
      <div className="p-3 border-t border-gray-200 bg-white rounded-b-lg flex-shrink-0 min-h-[80px]">
        <div className="flex items-end space-x-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500 h-10"
            disabled={!isConnected}
          />
          <Button 
            onClick={sendMessage} 
            size="sm"
            disabled={!newMessage.trim() || !isConnected}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 h-10"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <div className="mt-2 text-xs text-gray-500 text-center">
          {isConnected ? 'Press Enter to send • Connected to support' : 'Connecting...'}
        </div>
      </div>
    </div>
  );
}