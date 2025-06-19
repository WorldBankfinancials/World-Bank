import { useState, useEffect, useRef } from "react";
import { MessageSquare, Send, X, Phone, Video, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  const [isTyping, setIsTyping] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { userProfile } = useAuth();
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (isOpen) {
      connectWebSocket();
    } else {
      disconnectWebSocket();
    }

    return () => {
      disconnectWebSocket();
    };
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const connectWebSocket = () => {
    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      wsRef.current = new WebSocket(wsUrl);
      
      wsRef.current.onopen = () => {
        setIsConnected(true);
        // console.log('Live chat connected');
      };

      wsRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'chat_message') {
          const newMessage: ChatMessage = {
            id: data.id,
            senderId: data.senderId,
            senderName: data.senderName,
            senderRole: data.senderRole,
            message: data.message,
            timestamp: new Date(data.timestamp),
            isRead: false
          };
          setMessages(prev => [...prev, newMessage]);
        } else if (data.type === 'typing') {
          setIsTyping(data.isTyping && data.senderId !== userProfile?.id);
        }
      };

      wsRef.current.onclose = () => {
        setIsConnected(false);
        // console.log('Live chat disconnected');
      };

      wsRef.current.onerror = (error) => {
        // Silent WebSocket error handling
        setIsConnected(false);
      };
    } catch (error) {
      // Silent live chat connection handling
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
    if (!newMessage.trim() || !wsRef.current) return;

    const message: ChatMessage = {
      id: Date.now().toString(),
      senderId: userProfile?.id?.toString() || 'customer-1',
      senderName: userProfile?.fullName || 'Customer',
      senderRole: 'customer',
      message: newMessage.trim(),
      timestamp: new Date(),
      isRead: false
    };

    // Add to local state immediately
    setMessages(prev => [...prev, message]);

    // Send via WebSocket
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'chat_message',
        ...message
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

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 w-80 h-[500px] bg-white rounded-lg shadow-xl border border-gray-200 z-50 flex flex-col">
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

      {/* Message Input - Fixed Layout */}
      <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg flex-shrink-0">
        <div className="flex items-center space-x-2">
          <Button size="sm" variant="ghost" className="p-2 hover:bg-gray-200">
            <Paperclip className="w-4 h-4 text-gray-500" />
          </Button>
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            disabled={!isConnected}
          />
          <Button 
            onClick={sendMessage} 
            size="sm"
            disabled={!newMessage.trim() || !isConnected}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <div className="mt-2 text-xs text-gray-500 text-center">
          {isConnected ? 'Connected to support' : 'Connecting...'}
        </div>
      </div>
    </div>
  );
}