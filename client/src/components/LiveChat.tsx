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
    <div className="fixed bottom-4 right-4 w-96 z-50 shadow-2xl">
      <Card className="rounded-lg overflow-hidden">
        <CardHeader className="bg-blue-600 text-white p-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MessageCircle className="w-5 h-5" />
            <CardTitle className="text-white">Live Chat Support</CardTitle>
          </div>
          {onClose && (
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-blue-700"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </CardHeader>

        <CardContent className="p-0">
          <div className="h-80 overflow-y-auto bg-gray-50 p-4 space-y-3">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-gray-200 text-gray-900 rounded-bl-none'
                  }`}
                >
                  {msg.text}
                  <div className="text-xs opacity-70 mt-1">
                    {msg.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t p-3 bg-white space-y-2">
            <div className="flex gap-2">
              <Input
                placeholder="Type a message..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                disabled={!isConnected}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputText.trim() || !isConnected}
                size="sm"
                className="bg-blue-600 text-white"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            {!isConnected && (
              <p className="text-xs text-red-600">Connecting to support...</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
