import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef } from "react";
import { MessageSquare, Send, X, Phone, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// import { useAuth } from "@/contexts/AuthContext";
import { realtimeChat } from "@/lib/supabase-realtime";
export default function LiveChat({ isOpen, onClose }) {
    const [messages, setMessages] = useState([
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
    const messagesEndRef = useRef(null);
    useEffect(() => {
        if (isOpen) {
            connectSupabaseRealtime();
            loadChatHistory();
        }
        else {
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
            const formattedMessages = chatMessages.map(msg => ({
                id: msg.id,
                senderId: msg.senderId,
                senderName: msg.senderName,
                senderRole: msg.senderRole,
                message: msg.message,
                timestamp: msg.timestamp,
                isRead: msg.isRead
            }));
            setMessages(formattedMessages);
        }
        catch (error) {
            console.error('Failed to load chat history:', error);
        }
    };
    // Connect to Supabase Realtime for live chat
    const connectSupabaseRealtime = () => {
        try {
            realtimeChat.subscribe((message) => {
                const newMessage = {
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
        }
        catch (error) {
            console.error('Failed to connect to Supabase Realtime:', error);
            setIsConnected(false);
        }
    };
    const disconnectSupabaseRealtime = () => {
        realtimeChat.unsubscribe();
        setIsConnected(false);
    };
    const sendMessage = async () => {
        if (!newMessage.trim())
            return;
        try {
            // Send message via Supabase Realtime
            await realtimeChat.sendMessage(newMessage.trim(), 'customer');
            setNewMessage("");
        }
        catch (error) {
            console.error('Failed to send message:', error);
        }
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
    if (!isOpen)
        return null;
    return (_jsxs("div", { className: "fixed bottom-20 right-4 w-80 h-[400px] bg-white rounded-lg shadow-xl border border-gray-200 z-50 flex flex-col", children: [_jsxs("div", { className: "flex items-center justify-between p-4 border-b border-gray-200 bg-blue-600 text-white rounded-t-lg", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(MessageSquare, { className: "w-5 h-5" }), _jsxs("div", { children: [_jsx("div", { className: "font-semibold", children: "Live Support" }), _jsxs("div", { className: "text-xs flex items-center space-x-1", children: [_jsx("div", { className: `w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}` }), _jsx("span", { children: isConnected ? 'Online' : 'Connecting...' })] })] })] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(Button, { size: "sm", variant: "ghost", className: "text-white hover:bg-blue-700 p-1", children: _jsx(Phone, { className: "w-4 h-4" }) }), _jsx(Button, { size: "sm", variant: "ghost", className: "text-white hover:bg-blue-700 p-1", children: _jsx(Video, { className: "w-4 h-4" }) }), _jsx(Button, { size: "sm", variant: "ghost", className: "text-white hover:bg-blue-700 p-1", onClick: onClose, children: _jsx(X, { className: "w-4 h-4" }) })] })] }), _jsxs("div", { className: "flex-1 overflow-y-auto p-4 space-y-3", children: [messages.map((message) => (_jsx("div", { className: `flex ${message.senderRole === 'customer' ? 'justify-end' : 'justify-start'}`, children: _jsxs("div", { className: `max-w-xs p-3 rounded-lg ${message.senderRole === 'customer'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-800'}`, children: [_jsx("div", { className: "text-sm", children: message.message }), _jsx("div", { className: `text-xs mt-1 ${message.senderRole === 'customer' ? 'text-blue-100' : 'text-gray-500'}`, children: message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) })] }) }, message.id))), isTyping && (_jsx("div", { className: "flex justify-start", children: _jsx("div", { className: "bg-gray-100 text-gray-800 p-3 rounded-lg", children: _jsxs("div", { className: "flex space-x-1", children: [_jsx("div", { className: "w-2 h-2 bg-gray-400 rounded-full animate-bounce" }), _jsx("div", { className: "w-2 h-2 bg-gray-400 rounded-full animate-bounce", style: { animationDelay: '0.1s' } }), _jsx("div", { className: "w-2 h-2 bg-gray-400 rounded-full animate-bounce", style: { animationDelay: '0.2s' } })] }) }) })), _jsx("div", { ref: messagesEndRef })] }), _jsxs("div", { className: "p-3 border-t border-gray-200 bg-white rounded-b-lg flex-shrink-0 min-h-[80px]", children: [_jsxs("div", { className: "flex items-end space-x-2", children: [_jsx(Input, { value: newMessage, onChange: (e) => setNewMessage(e.target.value), onKeyPress: handleKeyPress, placeholder: "Type your message...", className: "flex-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500 h-10", disabled: !isConnected }), _jsx(Button, { onClick: sendMessage, size: "sm", disabled: !newMessage.trim() || !isConnected, className: "bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 h-10", children: _jsx(Send, { className: "w-4 h-4" }) })] }), _jsx("div", { className: "mt-2 text-xs text-gray-500 text-center", children: isConnected ? 'Press Enter to send • Connected to support' : 'Connecting...' })] })] }));
}
