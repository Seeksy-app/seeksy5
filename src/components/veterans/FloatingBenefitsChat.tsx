import { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, X, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const MAX_FREE_MESSAGES = 3;

const BASIC_SYSTEM_PROMPT = `You are a helpful VA benefits assistant answering basic questions. Keep responses under 3 sentences. Be friendly and helpful.

For complex questions or detailed guidance, suggest the user create a free account to access the full AI Benefits Agent.

Topics you can help with briefly:
- What is Intent to File
- General VA disability process overview
- Basic eligibility questions
- Types of benefits available

Always end with a helpful suggestion or next step.`;

export function FloatingBenefitsChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi! I'm here to answer basic questions about VA benefits. For personalized guidance, create a free account. How can I help?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    
    if (messageCount >= MAX_FREE_MESSAGES) return;

    const userMessage: Message = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setMessageCount((prev) => prev + 1);

    try {
      const response = await supabase.functions.invoke("veteran-claims-chat", {
        body: {
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          systemPrompt: BASIC_SYSTEM_PROMPT,
        },
      });

      const assistantMessage: Message = {
        role: "assistant",
        content:
          response.data?.message ||
          "I couldn't process that. Please try again.",
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I'm having trouble connecting. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const reachedLimit = messageCount >= MAX_FREE_MESSAGES;

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center"
          aria-label="Open chat"
        >
          <MessageSquare className="w-6 h-6" />
        </button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 z-50 w-[360px] h-[480px] flex flex-col shadow-2xl border-2">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b bg-gradient-to-r from-primary/10 to-orange-500/10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="font-semibold text-sm">Quick Benefits Help</p>
                <p className="text-xs text-muted-foreground">Basic questions only</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-muted rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-3">
            <div className="space-y-3">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg px-3 py-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Limit Reached CTA */}
          {reachedLimit ? (
            <div className="p-3 border-t bg-gradient-to-r from-primary/5 to-orange-500/5">
              <p className="text-sm text-center mb-2 text-muted-foreground">
                Create a free account for unlimited access to the full AI Benefits Agent
              </p>
              <Button asChild className="w-full" size="sm">
                <Link to="/yourbenefits/auth">
                  Get Full Access Free
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          ) : (
            /* Input */
            <div className="p-3 border-t">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask a quick question..."
                  className="text-sm"
                  disabled={isLoading}
                />
                <Button
                  size="icon"
                  onClick={sendMessage}
                  disabled={!input.trim() || isLoading}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                {MAX_FREE_MESSAGES - messageCount} questions remaining •{" "}
                <Link to="/yourbenefits/auth" className="text-primary hover:underline">
                  Sign up for unlimited
                </Link>
              </p>
            </div>
          )}
        </Card>
      )}
    </>
  );
}
