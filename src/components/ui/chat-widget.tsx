"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, MessageCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getSession } from "@/lib/auth";

interface QuoteMessage {
  id: string;
  sender: "ADMIN" | "CLIENT";
  text: string;
  createdAt: string;
}

interface ChatProps {
  token: string;
}

export function ChatWidget({ token }: ChatProps) {
  const [messages, setMessages] = useState<QuoteMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, [token]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/quotes/${token}/chat`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isLoading) return;

    setIsLoading(true);
    const text = newMessage;
    setNewMessage("");

    // Optimistic UI update
    const tempId = Date.now().toString();
    setMessages(prev => [...prev, {
      id: tempId,
      sender: "CLIENT",
      text,
      createdAt: new Date().toISOString()
    }]);

    try {
      const res = await fetch(`/api/quotes/${token}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, sender: "CLIENT" })
      });
      
      if (!res.ok) throw new Error("Failed to send");
      
      const savedMsg = await res.json();
      setMessages(prev => prev.map(m => m.id === tempId ? savedMsg : m));
    } catch (err) {
      setMessages(prev => prev.filter(m => m.id !== tempId));
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("es-EC", {
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Button
              size="lg"
              className="w-16 h-16 rounded-full shadow-2xl bg-gradient-to-r from-primary to-accent hover:shadow-primary/50"
              onClick={() => setIsOpen(true)}
            >
              <MessageCircle className="w-8 h-8 text-white" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className="fixed bottom-6 right-6 w-[350px] max-w-[calc(100vw-3rem)] h-[500px] max-h-[calc(100vh-6rem)] z-50 flex flex-col bg-card border border-border/50 rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-primary/10 to-accent/10 border-b border-border/50 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-sm">Consultas y Negociación</h3>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  Escríbenos directamente
                </p>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setIsOpen(false)}>
                X
              </Button>
            </div>

            {/* Messages */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-4"
            >
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-50 space-y-2">
                  <MessageCircle className="w-10 h-10 mb-2 text-muted-foreground" />
                  <p className="text-sm">¿Tienes alguna duda sobre la cotización?</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col max-w-[85%] ${msg.sender === "CLIENT" ? "ml-auto items-end" : "mr-auto items-start"}`}
                  >
                    <div
                      className={`px-4 py-2 rounded-2xl text-sm ${
                        msg.sender === "CLIENT"
                          ? "bg-primary text-primary-foreground rounded-br-sm"
                          : "bg-muted rounded-bl-sm"
                      }`}
                    >
                      {msg.text}
                    </div>
                    <span className="text-[10px] text-muted-foreground mt-1 mx-1">
                      {formatTime(msg.createdAt)}
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Input */}
            <div className="p-3 bg-background border-t border-border/50">
              <form onSubmit={sendMessage} className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Escribe un mensaje..."
                  className="flex-1 rounded-full border-border/50 focus-visible:ring-primary/50"
                />
                <Button 
                  type="submit" 
                  size="icon" 
                  className="rounded-full bg-primary hover:bg-primary/90 shrink-0"
                  disabled={!newMessage.trim() || isLoading}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
