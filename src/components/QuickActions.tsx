import React, { useState, useEffect, useRef } from "react";
import { 
  ArrowLeftRight, 
  Building2, 
  FileText, 
  Headphones, 
  Shield, 
  Wallet, 
  Receipt, 
  Smartphone,
  MessageCircle,
  Bell,
  X,
  Send,
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'customer' | 'admin';
  message: string;
  timestamp: Date;
  isRead: boolean;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  timestamp: Date;
  isRead: boolean;
}

export default function QuickActions() {
  const [, setLocation] = useLocation();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [unreadChats, setUnreadChats] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // WebSocket connection for real-time chat
  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        // console.log("Connected to live chat");
        
        // Send customer connection message
        ws.send(JSON.stringify({
          type: 'customer_connect',
          userId: 'liu-wei-001',
          userName: 'Liu Wei'
        }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'chat_message') {
            const newMessage: ChatMessage = {
              id: Date.now().toString(),
              senderId: data.senderId || 'admin',
              senderName: data.senderName || 'Customer Service',
              senderRole: data.senderRole || 'admin',
              message: data.message,
              timestamp: new Date(),
              isRead: false
            };
            
            setChatMessages(prev => [...prev, newMessage]);
            if (!isChatOpen) {
              setUnreadChats(prev => prev + 1);
            }
          }
          
          if (data.type === 'typing_indicator') {
            setIsTyping(data.isTyping);
          }
        } catch (error) {
          // Silent WebSocket message parsing
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        // console.log("Disconnected from live chat");
      };

      ws.onerror = (error) => {
        // Silent WebSocket error handling
        setIsConnected(false);
      };

    } catch (error) {
      // Silent WebSocket connection handling
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [isChatOpen]);

  // Initialize demo notifications
  useEffect(() => {
    const demoNotifications: Notification[] = [
      {
        id: '1',
        title: 'Transfer Approved',
        message: 'Your international transfer of $2,500 has been approved',
        type: 'success',
        timestamp: new Date(Date.now() - 300000),
        isRead: false
      },
      {
        id: '2',
        title: 'Security Alert',
        message: 'New login detected from Singapore',
        type: 'warning',
        timestamp: new Date(Date.now() - 600000),
        isRead: false
      },
      {
        id: '3',
        title: 'Account Statement',
        message: 'Your monthly statement is ready for download',
        type: 'info',
        timestamp: new Date(Date.now() - 900000),
        isRead: false
      }
    ];
    
    setNotifications(demoNotifications);
    setUnreadNotifications(demoNotifications.filter(n => !n.isRead).length);
  }, []);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const quickActions = [
    { 
      icon: ArrowLeftRight, 
      label: "Transfer Funds",
      onClick: () => setLocation("/transfer-funds")
    },
    { 
      icon: Building2, 
      label: "Banking Services",
      onClick: () => setLocation("/banking-services")
    },
    { 
      icon: FileText, 
      label: "Generate Report",
      onClick: () => setLocation("/statements-reports")
    },
    { 
      icon: Headphones, 
      label: "Support Center",
      onClick: () => setLocation("/support-center")
    },
    { 
      icon: Shield, 
      label: "Security Center",
      onClick: () => setLocation("/security-center")
    },
    { 
      icon: Wallet, 
      label: "Digital Wallet",
      onClick: () => setLocation("/digital-wallet")
    },
    { 
      icon: Receipt, 
      label: "Account Statement",
      onClick: () => setLocation("/statements-reports")
    },
    { 
      icon: Smartphone, 
      label: "Mobile Pay",
      onClick: () => setLocation("/mobile-pay")
    },
  ];

  const handleSendMessage = () => {
    if (!currentMessage.trim() || !wsRef.current) return;

    const message: ChatMessage = {
      id: Date.now().toString(),
      senderId: 'liu-wei-001',
      senderName: 'Liu Wei',
      senderRole: 'customer',
      message: currentMessage,
      timestamp: new Date(),
      isRead: true
    };

    setChatMessages(prev => [...prev, message]);

    // Send to WebSocket
    wsRef.current.send(JSON.stringify({
      type: 'chat_message',
      senderId: 'liu-wei-001',
      senderName: 'Liu Wei',
      senderRole: 'customer',
      message: currentMessage
    }));

    setCurrentMessage("");
  };

  const handleOpenChat = () => {
    setIsChatOpen(true);
    setUnreadChats(0);
    // Mark messages as read
    setChatMessages(prev => prev.map(msg => ({ ...msg, isRead: true })));
  };

  const handleOpenNotifications = () => {
    setIsNotificationOpen(true);
    setUnreadNotifications(0);
    // Mark notifications as read
    setNotifications(prev => prev.map(notif => ({ ...notif, isRead: true })));
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <h2 className="text-xl font-semibold mb-6" style={{ color: '#1e40af' }}>Quick Actions</h2>
        
        {/* Quick Actions Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-6">
          {quickActions.map((action, index) => (
            <div
              key={index}
              onClick={action.onClick}
              className="flex flex-col items-center p-4 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer border border-transparent hover:border-blue-200"
            >
              <action.icon className="w-8 h-8 mb-2" style={{ color: '#1e40af' }} />
              <span className="text-sm font-medium text-center" style={{ color: '#1f2937' }}>{action.label}</span>
            </div>
          ))}
        </div>

        {/* Communication Tools */}
        <div className="border-t pt-4">
          <h3 className="text-lg font-medium mb-4" style={{ color: '#1e40af' }}>Customer Service</h3>
          <div className="flex space-x-4">
            {/* Live Chat Button */}
            <Button
              onClick={handleOpenChat}
              className="relative flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2"
            >
              <MessageCircle className="w-5 h-5" />
              <span>Live Chat</span>
              {unreadChats > 0 && (
                <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs">
                  {unreadChats}
                </Badge>
              )}
              {isConnected && (
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              )}
            </Button>

            {/* Notifications Button */}
            <Button
              onClick={handleOpenNotifications}
              className="relative flex items-center space-x-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2"
            >
              <Bell className="w-5 h-5" />
              <span>Notifications</span>
              {unreadNotifications > 0 && (
                <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs">
                  {unreadNotifications}
                </Badge>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Live Chat Modal */}
      {isChatOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md h-[600px] flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg">Live Chat Support</CardTitle>
              <div className="flex items-center space-x-2">
                {isConnected ? (
                  <Badge className="bg-green-100 text-green-800">Online</Badge>
                ) : (
                  <Badge className="bg-red-100 text-red-800">Offline</Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsChatOpen(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="flex-1 flex flex-col p-0">
              {/* Chat Messages */}
              <div 
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto p-4 space-y-3"
              >
                {chatMessages.length === 0 ? (
                  <div className="text-center text-gray-500 mt-8">
                    <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p>Start a conversation with our support team</p>
                  </div>
                ) : (
                  chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.senderRole === 'customer' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          msg.senderRole === 'customer'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <div className="flex items-center space-x-2 mb-1">
                          <User className="w-3 h-3" />
                          <span className="text-xs font-medium">{msg.senderName}</span>
                          <span className="text-xs opacity-70">{formatTime(msg.timestamp)}</span>
                        </div>
                        <p className="text-sm">{msg.message}</p>
                      </div>
                    </div>
                  ))
                )}
                
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-lg p-3">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Message Input */}
              <div className="border-t p-4">
                <div className="flex space-x-2">
                  <Input
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    placeholder="Type your message..."
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!currentMessage.trim() || !isConnected}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Notifications Modal */}
      {isNotificationOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md max-h-[80vh] overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg">Notifications</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsNotificationOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            
            <CardContent className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <Bell className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p>No notifications</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 rounded-lg border ${
                        notification.type === 'error' ? 'border-red-200 bg-red-50' :
                        notification.type === 'warning' ? 'border-orange-200 bg-orange-50' :
                        notification.type === 'success' ? 'border-green-200 bg-green-50' :
                        'border-blue-200 bg-blue-50'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-medium text-sm">{notification.title}</h4>
                        <span className="text-xs text-gray-500">
                          {formatTime(notification.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{notification.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
