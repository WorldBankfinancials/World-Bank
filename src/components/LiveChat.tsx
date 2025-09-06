import { useState, useEffect, useRef } from "react";
import { MessageSquare, Send, X, Phone, Video, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: "customer" | "admin";
  message: string;
  timestamp: string;
}

interface LiveChatProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LiveChat({ isOpen, onClose }: LiveChatProps) {
  const { userProfile } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (isOpen) initRealtime();
    else cleanupRealtime();
    return () => cleanupRealtime();
  }, [isOpen]);

  useEffect(() => scrollToBottom(), [messages]);

  const initRealtime = async () => {
    // Load last 50 messages
    const { data: msgs } = await supabase
      .from("messages")
      .select("*")
      .order("timestamp", { ascending: true })
      .limit(50);

    if (msgs) setMessages(msgs as ChatMessage[]);

    // Subscribe to Realtime channel
    const channel = supabase
      .channel("public:messages")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const message = payload.new as ChatMessage;
        setMessages((prev) => [...prev, message]);
      })
      .subscribe();

    channelRef.current = channel;
  };

  const cleanupRealtime = () => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    const message: Omit<ChatMessage, "id"> = {
      senderId: userProfile?.id?.toString() || "customer-1",
      senderName: userProfile?.fullName || "Customer",
      senderRole: "customer",
      message: newMessage.trim(),
      timestamp: new Date().toISOString(),
    };

    // Insert into Supabase
    const { error } = await supabase.from("messages").insert([message]);
    if (error) console.error("Error sending message:", error);

    setNewMessage("");
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 w-80 h-[500px] bg-white rounded-lg shadow-xl border border-gray-200 z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-blue-600 text-white rounded-t-lg">
        <div className="flex items-center space-x-2">
          <MessageSquare className="w-5 h-5" />
          <div>
            <div className="font-semibold">Live Support</div>
            <div className="text-xs flex items-center space-x-1">
              <div className={`w-2 h-2 rounded-full bg-green-400`} />
              <span>Online</span>
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
          <Button size="sm" variant="ghost" className="text-white hover:bg-blue-700 p-1" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.senderRole === "customer" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-xs p-3 rounded-lg ${msg.senderRole === "customer" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-800"}`}>
              <div className="text-sm">{msg.message}</div>
              <div className={`text-xs mt-1 ${msg.senderRole === "customer" ? "text-blue-100" : "text-gray-500"}`}>
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-800 p-3 rounded-lg">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
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
          />
          <Button onClick={sendMessage} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2">
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <div className="mt-2 text-xs text-gray-500 text-center">Connected to support</div>
      </div>
    </div>
  );
}
