import { useState, useEffect, useRef } from "react";
import { MessageSquare, Send, X, Phone, Video, Paperclip, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
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
      message: 'Hello! Welcome to World Bank. How can I help you today?',
      timestamp: new Date(Date.now() - 60000),
      isRead: true
    }
  ]);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { userProfile } = useAuth();

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
      setMessages(prev => [...prev, ...formattedMessages]);
    } catch (error) {
      console.error('Failed to load chat history:', error);
    }
  };

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
    <div className={`fixed bottom-4 right-4 w-80 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 flex flex-col transition-all duration-300 ${
      isMinimized ? 'h-14' : 'h-[500px]'
    }`}>
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-blue-600 text-white rounded-t-lg">
        <div className="flex items-center space-x-2">
          <MessageSquare className="w-5 h-5" />
          <div>
            <div className="font-semibold">World Bank Support</div>
            <div className="text-xs flex items-center space-x-1">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
              <span>{isConnected ? 'Online' : 'Connecting...'}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <Button 
            size="sm" 
            variant="ghost" 
            className="text-white hover:bg-blue-700 p-1 h-8 w-8"
            onClick={() => setIsMinimized(!isMinimized)}
          >
            <Minimize2 className="w-4 h-4" />
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            className="text-white hover:bg-blue-700 p-1 h-8 w-8"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.senderRole === 'customer' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs p-3 rounded-lg shadow-sm ${
                    message.senderRole === 'customer'
                      ? 'bg-blue-600 text-white ml-4'
                      : 'bg-white text-gray-800 mr-4 border'
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
                <div className="bg-white text-gray-800 p-3 rounded-lg border mr-4">
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

          {/* Message Input */}
          <div className="p-4 border-t border-gray-200 bg-white rounded-b-lg">
            <div className="flex items-center space-x-2">
              <div className="flex-1 relative">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm pr-10"
                  disabled={!isConnected}
                />
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 h-auto text-gray-500 hover:text-gray-700"
                >
                  <Paperclip className="w-4 h-4" />
                </Button>
              </div>
              <Button 
                onClick={sendMessage} 
                size="sm"
                disabled={!newMessage.trim() || !isConnected}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <div className="mt-2 text-xs text-gray-500 flex items-center justify-between">
              <span className="flex items-center space-x-1">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
                <span>{isConnected ? 'Connected' : 'Connecting...'}</span>
              </span>
              <span>Press Enter to send</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}