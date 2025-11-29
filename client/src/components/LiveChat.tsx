import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Send, MessageCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/chat`;

    try {
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        setIsConnected(true);
        wsRef.current?.send(JSON.stringify({
          type: 'chat_init',
          userId: localStorage.getItem('userId') || 'guest'
        }));
        setMessages([{
          id: '1',
          sender: 'agent',
          text: 'Hello! How can we help you today?',
          timestamp: new Date()
        }]);
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'message') {
            setMessages(prev => [...prev, {
              id: Date.now().toString(),
              sender: 'agent',
              text: data.text,
              timestamp: new Date()
            }]);
          }
        } catch (error) {
        }
      };

      wsRef.current.onerror = () => {
        setIsConnected(false);
        toast({
          title: 'Connection Error',
          description: 'Failed to connect to live chat. Please try again.',
          variant: 'destructive',
        });
      };

      wsRef.current.onclose = () => {
        setIsConnected(false);
      };
    } catch (error) {
      setIsConnected(false);
    }

    return () => {
      wsRef.current?.close();
    };
  }, [isOpen, toast]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputText.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: inputText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMessage]);
    
    if (isConnected && wsRef.current) {
      wsRef.current.send(JSON.stringify({
        type: 'message',
        text: inputText
      }));
    }

    setInputText('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-6 right-6 w-96 z-50 shadow-2xl">
      <Card className="rounded-xl overflow-hidden border-2 border-blue-500 bg-white">
        {/* Header - Prominent */}
        <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-4 flex items-center justify-between">
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
              className="text-white hover:bg-blue-700 h-8 w-8 p-0"
            >
              <X className="w-5 h-5" />
            </Button>
          )}
        </CardHeader>

        {/* Messages Area - Clear separation */}
        <div className="flex flex-col h-96 bg-gray-50">
          <div className="flex-1 overflow-y-auto p-4 space-y-4 border-b-2 border-gray-200">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs px-4 py-3 rounded-lg text-sm break-words ${
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

          {/* Input Area - SUPER PROMINENT */}
          <div className="bg-white p-4 space-y-3 border-t-2 border-gray-200">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 block">Type your message:</label>
              <div className="flex gap-2">
                <Input
                  placeholder="Write here and press Enter..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  disabled={!isConnected}
                  className="text-base p-3 border-2 border-gray-300 rounded-lg font-medium"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputText.trim() || !isConnected}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 h-12 font-bold rounded-lg"
                  size="sm"
                >
                  <Send className="w-5 h-5" />
                </Button>
              </div>
            </div>
            {!isConnected && (
              <div className="bg-amber-100 border-2 border-amber-300 rounded-lg p-2 text-center">
                <p className="text-sm font-bold text-amber-800">⚠️ Connecting...</p>
              </div>
            )}
            {isConnected && (
              <p className="text-xs text-green-700 font-semibold text-center">✓ Connected to support</p>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
