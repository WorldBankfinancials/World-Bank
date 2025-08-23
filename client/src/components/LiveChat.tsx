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
  const wsRef = useRef<WebSocket | null>(null);

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
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      wsRef.current = new WebSocket(wsUrl);
      
      wsRef.current.onopen = () => {
        setIsConnected(true);
        console.log('Live chat connected');
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'chat_message') {
            const newMessage: ChatMessage = {
              id: message.id,
              senderId: message.senderId,
              senderName: message.senderName,
              senderRole: message.senderRole,
              message: message.message,
              timestamp: new Date(message.timestamp),
              isRead: message.isRead
            };
            setMessages(prev => [...prev, newMessage]);
          }
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      };

      wsRef.current.onclose = () => {
        setIsConnected(false);
        console.log('Live chat disconnected');
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };
    } catch (error) {
      console.error('Failed to connect to live chat:', error);
      setIsConnected(false);
    }
  };

  const disconnectSupabaseRealtime = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  };

  const sendMessage = () => {
    if (newMessage.trim() && wsRef.current && isConnected) {
      const message: ChatMessage = {
        id: Date.now().toString(),
        senderId: userProfile?.accountId || 'customer_1',
        senderName: userProfile?.fullName || 'Customer',
        senderRole: 'customer',
        message: newMessage.trim(),
        timestamp: new Date(),
        isRead: false
      };

      // Add to local messages immediately
      setMessages(prev => [...prev, message]);

      // Send via WebSocket
      try {
        if (wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'chat_message',
            ...message,
            timestamp: message.timestamp.toISOString()
          }));
          console.log('Message sent successfully:', message.message);
        }
      } catch (error) {
        console.error('Failed to send message:', error);
      }

      setNewMessage('');
      setIsTyping(false);
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

          {/* Message Input - Always Visible */}
          <div className="p-4 border-t border-gray-200 bg-white rounded-b-lg flex-shrink-0">
            <div className="flex items-center space-x-2 mb-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message here..."
                className="flex-1 border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-sm h-12 px-4 py-3 rounded-md bg-white text-gray-900 placeholder-gray-500 outline-none"
                disabled={!isConnected}
                autoComplete="off"
                style={{
                  fontSize: '16px',
                  lineHeight: '1.5',
                  minHeight: '48px',
                  backgroundColor: 'white',
                  color: '#111827'
                }}
              />
              <Button 
                onClick={sendMessage} 
                size="sm"
                disabled={!newMessage.trim() || !isConnected}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 h-12 flex items-center justify-center flex-shrink-0 rounded-md"
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span className="flex items-center space-x-1">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
                <span>{isConnected ? 'Connected' : 'Connecting...'}</span>
              </span>
              <span className="font-medium">Press Enter to send</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}