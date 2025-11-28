import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BankLogo } from "@/components/BankLogo";
import { MessageSquare, Send, Phone, Video, AlertTriangle, Paperclip, Headphones } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from '@/hooks/use-toast';
export default function AdminLiveChat() {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState("live-chat");
    const [selectedChat, setSelectedChat] = useState(null);
    const [newMessage, setNewMessage] = useState("");
    const [isConnected, setIsConnected] = useState(false);
    const [adminName] = useState("Customer Support");
    const wsRef = useRef(null);
    const messagesEndRef = useRef(null);
    const { user } = useAuth();
    // Fetch support tickets from API
    const { data: supportTickets = [], isLoading: ticketsLoading } = useQuery({
        queryKey: ['/api/support-tickets'],
        enabled: user?.role === 'admin',
        refetchInterval: 30000 // Refresh every 30 seconds
    });
    // Real-time chat sessions - no mock data, only real WebSocket messages
    const [chatSessions, setChatSessions] = useState([]);
    useEffect(() => {
        connectWebSocket();
        return () => disconnectWebSocket();
    }, []);
    useEffect(() => {
        scrollToBottom();
    }, [selectedChat, chatSessions]);
    const connectWebSocket = () => {
        try {
            const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
            const wsUrl = `${protocol}//${window.location.host}/ws`;
            wsRef.current = new WebSocket(wsUrl);
            wsRef.current.onopen = () => {
                setIsConnected(true);
                console.log('Admin chat connected');
                // Authenticate as admin
                wsRef.current?.send(JSON.stringify({
                    type: 'auth',
                    userId: 'admin_1',
                    role: 'admin'
                }));
            };
            wsRef.current.onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (data.type === 'chat_message' && data.senderRole === 'customer') {
                    // Add customer message to appropriate chat session
                    setChatSessions(prev => {
                        // Check if session exists for this customer
                        const existingSessionIndex = prev.findIndex(s => s.customerId === data.senderId);
                        if (existingSessionIndex >= 0) {
                            // Update existing session
                            return prev.map((session, index) => {
                                if (index === existingSessionIndex) {
                                    return {
                                        ...session,
                                        messages: [...session.messages, data],
                                        lastMessage: data.message,
                                        lastMessageTime: new Date(data.timestamp),
                                        unreadCount: session.unreadCount + 1,
                                        status: 'active'
                                    };
                                }
                                return session;
                            });
                        }
                        else {
                            // Create new session for this customer
                            const newSession = {
                                id: `chat_${data.senderId}`,
                                customerId: data.senderId,
                                customerName: data.senderName,
                                status: 'active',
                                lastMessage: data.message,
                                lastMessageTime: new Date(data.timestamp),
                                unreadCount: 1,
                                messages: [data]
                            };
                            return [...prev, newSession];
                        }
                    });
                }
            };
            wsRef.current.onclose = () => {
                setIsConnected(false);
                console.log('Admin chat disconnected');
                toast({
                    title: 'Chat disconnected',
                    description: 'Lost connection to chat server. Attempting to reconnect...',
                    variant: 'destructive',
                });
            };
            wsRef.current.onerror = (error) => {
                console.error('Admin WebSocket error:', error);
                setIsConnected(false);
                toast({
                    title: 'Connection error',
                    description: 'Unable to connect to chat server. Please refresh the page.',
                    variant: 'destructive',
                });
            };
        }
        catch (error) {
            console.error('Failed to connect admin chat:', error);
            setIsConnected(false);
            toast({
                title: 'Chat system unavailable',
                description: 'Unable to initialize chat system. Please try again later.',
                variant: 'destructive',
            });
        }
    };
    const disconnectWebSocket = () => {
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }
    };
    const sendMessage = () => {
        if (!newMessage.trim() || !selectedChat || !wsRef.current)
            return;
        const session = chatSessions.find(s => s.id === selectedChat);
        if (!session)
            return;
        const message = {
            id: Date.now().toString(),
            senderId: 'admin_1',
            senderName: adminName,
            senderRole: 'admin',
            message: newMessage.trim(),
            timestamp: new Date(),
            isRead: false
        };
        // Update local state
        setChatSessions(prev => prev.map(s => s.id === selectedChat
            ? {
                ...s,
                messages: [...s.messages, message],
                lastMessage: message.message,
                lastMessageTime: message.timestamp
            }
            : s));
        // Send via WebSocket
        if (wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                type: 'chat_message',
                ...message,
                recipientId: session.customerId
            }));
        }
        setNewMessage("");
    };
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };
    const markChatAsRead = (chatId) => {
        setChatSessions(prev => prev.map(session => session.id === chatId
            ? { ...session, unreadCount: 0 }
            : session));
    };
    const selectedChatData = chatSessions.find(s => s.id === selectedChat);
    const activeChatCount = chatSessions.filter(s => s.status === 'active').length;
    const waitingChatCount = chatSessions.filter(s => s.status === 'waiting').length;
    const totalUnread = chatSessions.reduce((sum, session) => sum + session.unreadCount, 0);
    return (_jsxs("div", { className: "min-h-screen bg-gray-50", children: [_jsx("div", { className: "bg-white border-b border-gray-200 px-6 py-4", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center space-x-4", children: [_jsx(BankLogo, { className: "w-8 h-8" }), _jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "Admin Live Chat & Support" }), _jsxs("div", { className: "flex items-center space-x-4 text-sm text-gray-500", children: [_jsxs("div", { className: `flex items-center space-x-1 ${isConnected ? 'text-green-600' : 'text-red-600'}`, children: [_jsx("div", { className: `w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}` }), _jsx("span", { children: isConnected ? 'Online' : 'Disconnected' })] }), _jsx("span", { children: "\u2022" }), _jsxs("span", { children: [activeChatCount, " Active Chats"] }), _jsx("span", { children: "\u2022" }), _jsxs("span", { children: [waitingChatCount, " Waiting"] })] })] })] }), _jsxs("div", { className: "flex items-center space-x-3", children: [totalUnread > 0 && (_jsxs(Badge, { variant: "destructive", className: "animate-pulse", children: [totalUnread, " unread messages"] })), _jsx(Badge, { variant: isConnected ? "default" : "secondary", children: isConnected ? "Connected" : "Disconnected" })] })] }) }), _jsxs("div", { className: "flex h-[calc(100vh-80px)]", children: [_jsx("div", { className: "w-80 bg-white border-r border-gray-200", children: _jsxs(Tabs, { value: activeTab, onValueChange: setActiveTab, className: "w-full", children: [_jsxs(TabsList, { className: "grid w-full grid-cols-2 m-4", children: [_jsxs(TabsTrigger, { value: "live-chat", className: "flex items-center space-x-2", children: [_jsx(MessageSquare, { className: "w-4 h-4" }), _jsx("span", { children: "Live Chat" }), totalUnread > 0 && (_jsx(Badge, { variant: "destructive", className: "ml-1 h-5 text-xs", children: totalUnread }))] }), _jsxs(TabsTrigger, { value: "tickets", className: "flex items-center space-x-2", children: [_jsx(AlertTriangle, { className: "w-4 h-4" }), _jsx("span", { children: "Tickets" })] })] }), _jsx(TabsContent, { value: "live-chat", className: "px-4 pb-4 space-y-2", children: chatSessions.map((session) => (_jsx(Card, { className: `cursor-pointer transition-colors ${selectedChat === session.id ? 'ring-2 ring-blue-500' : 'hover:bg-gray-50'}`, onClick: () => {
                                            setSelectedChat(session.id);
                                            markChatAsRead(session.id);
                                        }, children: _jsxs(CardContent, { className: "p-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("div", { className: "w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium", children: session.customerName.split(' ').map(n => n[0]).join('') }), _jsxs("div", { children: [_jsx("div", { className: "font-medium text-sm", children: session.customerName }), _jsxs("div", { className: `flex items-center space-x-1 text-xs ${session.status === 'active' ? 'text-green-600' :
                                                                                session.status === 'waiting' ? 'text-orange-600' : 'text-gray-500'}`, children: [_jsx("div", { className: `w-2 h-2 rounded-full ${session.status === 'active' ? 'bg-green-500' :
                                                                                        session.status === 'waiting' ? 'bg-orange-500' : 'bg-gray-400'}` }), _jsx("span", { className: "capitalize", children: session.status })] })] })] }), _jsxs("div", { className: "text-right", children: [session.unreadCount > 0 && (_jsx(Badge, { variant: "destructive", className: "text-xs mb-1", children: session.unreadCount })), _jsx("div", { className: "text-xs text-gray-500", children: session.lastMessageTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) })] })] }), _jsx("div", { className: "text-sm text-gray-600 truncate", children: session.lastMessage })] }) }, session.id))) }), _jsx(TabsContent, { value: "tickets", className: "px-4 pb-4 space-y-2", children: supportTickets.map((ticket) => (_jsx(Card, { className: "cursor-pointer hover:bg-gray-50", children: _jsxs(CardContent, { className: "p-4", children: [_jsxs("div", { className: "flex items-start justify-between mb-2", children: [_jsxs("div", { className: "flex-1", children: [_jsx("div", { className: "font-medium text-sm mb-1", children: ticket.subject }), _jsx("div", { className: "text-xs text-gray-500", children: ticket.customerName })] }), _jsx(Badge, { variant: ticket.priority === 'urgent' ? 'destructive' :
                                                                ticket.priority === 'high' ? 'default' : 'secondary', className: "text-xs", children: ticket.priority })] }), _jsx("div", { className: "text-xs text-gray-600 mb-2 line-clamp-2", children: ticket.description }), _jsxs("div", { className: "flex items-center justify-between text-xs text-gray-500", children: [_jsx(Badge, { variant: "outline", className: "text-xs", children: ticket.status }), _jsx("span", { children: new Date(ticket.createdAt).toLocaleDateString() })] })] }) }, ticket.id))) })] }) }), _jsx("div", { className: "flex-1 flex flex-col", children: selectedChatData ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "bg-white border-b border-gray-200 px-6 py-4", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center space-x-4", children: [_jsx("div", { className: "w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium", children: selectedChatData.customerName.split(' ').map(n => n[0]).join('') }), _jsxs("div", { children: [_jsx("div", { className: "font-semibold", children: selectedChatData.customerName }), _jsxs("div", { className: `text-sm flex items-center space-x-1 ${selectedChatData.status === 'active' ? 'text-green-600' : 'text-orange-600'}`, children: [_jsx("div", { className: `w-2 h-2 rounded-full ${selectedChatData.status === 'active' ? 'bg-green-500' : 'bg-orange-500'}` }), _jsx("span", { className: "capitalize", children: selectedChatData.status })] })] })] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(Button, { size: "sm", variant: "outline", children: _jsx(Phone, { className: "w-4 h-4" }) }), _jsx(Button, { size: "sm", variant: "outline", children: _jsx(Video, { className: "w-4 h-4" }) })] })] }) }), _jsxs("div", { className: "flex-1 overflow-y-auto p-6 space-y-4", children: [selectedChatData.messages.map((message) => (_jsx("div", { className: `flex ${message.senderRole === 'admin' ? 'justify-end' : 'justify-start'}`, children: _jsxs("div", { className: `max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${message.senderRole === 'admin'
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-gray-100 text-gray-800'}`, children: [_jsx("div", { className: "text-sm", children: message.message }), _jsx("div", { className: `text-xs mt-1 ${message.senderRole === 'admin' ? 'text-blue-100' : 'text-gray-500'}`, children: message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) })] }) }, message.id))), _jsx("div", { ref: messagesEndRef })] }), _jsx("div", { className: "bg-white border-t border-gray-200 p-4", children: _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(Button, { size: "sm", variant: "ghost", children: _jsx(Paperclip, { className: "w-4 h-4" }) }), _jsx(Input, { value: newMessage, onChange: (e) => setNewMessage(e.target.value), onKeyPress: handleKeyPress, placeholder: "Type your message...", className: "flex-1", disabled: !isConnected }), _jsx(Button, { onClick: sendMessage, disabled: !newMessage.trim() || !isConnected, className: "bg-blue-600 hover:bg-blue-700", children: _jsx(Send, { className: "w-4 h-4" }) })] }) })] })) : (_jsx("div", { className: "flex-1 flex items-center justify-center bg-gray-50", children: _jsxs("div", { className: "text-center", children: [_jsx(Headphones, { className: "w-16 h-16 text-gray-400 mx-auto mb-4" }), _jsx("h3", { className: "text-lg font-medium text-gray-900 mb-2", children: "Select a conversation" }), _jsx("p", { className: "text-gray-500", children: "Choose a customer chat from the sidebar to start helping them" })] }) })) })] })] }));
}
