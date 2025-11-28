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
    const wsUrl = `${protocol}//${window.location.host}/ws`;

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
      <Card className="rounded-xl overflow-hidden border border-gray-200">
        {/* Header */}
        <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-white/20 p-2 rounded-full">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-white text-base font-semibold">Support</CardTitle>
              <p className="text-xs text-blue-100">We typically reply within minutes</p>
            </div>
          </div>
          {onClose && (
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-blue-600 h-8 w-8 p-0"
            >
              <X className="w-5 h-5" />
            </Button>
          )}
        </CardHeader>

        {/* Messages Area */}
        <CardContent className="p-0 flex flex-col h-96">
          <div className="flex-1 overflow-y-auto bg-gray-50 p-4 space-y-4">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs px-4 py-3 rounded-lg text-sm break-words ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-br-sm'
                      : 'bg-white text-gray-900 border border-gray-200 rounded-bl-sm'
                  }`}
                >
                  <p className="mb-1">{msg.text}</p>
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

          {/* Input Area */}
          <div className="border-t bg-white p-4 space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="Type your message..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                disabled={!isConnected}
                className="text-sm"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputText.trim() || !isConnected}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 h-10"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            {!isConnected && (
              <p className="text-xs text-orange-600 font-medium">⚠ Connecting to support...</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
