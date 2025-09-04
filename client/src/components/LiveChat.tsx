import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { realtimeChat, RealtimeMessage } from "@/lib/supabase-realtime";

export default function ChatPage() {
  const [messages, setMessages] = useState<RealtimeMessage[]>([]);
  const [text, setText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    // Load existing chat messages
    const loadMessages = async () => {
      const msgs = await realtimeChat.getMessages();
      setMessages(msgs);
    };
    loadMessages();

    // Subscribe to live updates
    realtimeChat.subscribe((message: RealtimeMessage) => {
      setMessages(prev => [...prev, message]);
    });

    return () => {
      realtimeChat.unsubscribe();
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!text.trim()) return;
    await realtimeChat.sendMessage(text.trim(), 'customer');
    setText("");
  };

  return (
    <div className="p-4">
      <Card className="h-[80vh] flex flex-col">
        <CardHeader>
          <CardTitle>Customer Support Chat</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto space-y-2">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`p-2 rounded ${m.senderRole === "admin" ? "bg-gray-200" : "bg-blue-100"}`}
            >
              <div className="text-xs text-gray-600">{m.senderName}</div>
              <div>{m.message}</div>
              <div className="text-xs text-gray-400">
                {new Date(m.timestamp).toLocaleTimeString()}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </CardContent>
        <div className="flex space-x-2 mt-2">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message..."
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <Button onClick={handleSend}>Send</Button>
        </div>
      </Card>
    </div>
  );
}
