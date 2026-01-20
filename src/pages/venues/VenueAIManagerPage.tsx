import { useState, useRef, useEffect } from "react";
import { VenueLayout } from "@/components/venues/VenueLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Send, Sparkles, Calendar, DollarSign, Mail, FileText, Lightbulb, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const colors = {
  primary: "#053877",
  primaryLight: "#2C6BED",
};

interface Message {
  role: "user" | "assistant";
  content: string;
}

const quickPrompts = [
  { icon: DollarSign, label: "Suggest pricing for a wedding", prompt: "What's a good pricing structure for a 150-person wedding reception?" },
  { icon: Calendar, label: "Create event package", prompt: "Help me create a corporate event package for mid-sized companies." },
  { icon: Mail, label: "Write follow-up email", prompt: "Write a follow-up email for a client who toured but hasn't booked yet." },
  { icon: FileText, label: "Draft proposal", prompt: "Help me draft a proposal for a holiday gala event." },
  { icon: Lightbulb, label: "Marketing ideas", prompt: "Give me 5 creative marketing ideas to fill slow weekday bookings." },
  { icon: Users, label: "Influencer outreach", prompt: "Write an outreach message to invite a local influencer to feature our venue." },
];

const sessionNotes = [
  "Consider tiered pricing based on guest count",
  "Corporate packages should include AV equipment",
  "Follow up with pending leads within 24 hours",
  "Wedding season starts in May - prepare packages",
];

export default function VenueAIManagerPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi! I'm Mia, your AI venue manager. I can help with pricing strategies, package creation, client communications, and marketing ideas. What would you like to work on today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (messageText?: string) => {
    const text = messageText || input;
    if (!text.trim()) return;

    const userMessage: Message = { role: "user", content: text };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("venue-ai-manager-chat", {
        body: {
          messages: [...messages, userMessage].map(m => ({ role: m.role, content: m.content })),
        },
      });

      if (error) throw error;

      const assistantMessage: Message = {
        role: "assistant",
        content: data?.reply || "I apologize, but I couldn't process that request. Please try again.",
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("AI chat error:", error);
      toast.error("Failed to get response. Please try again.");
      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content: "I'm having trouble connecting right now. Please try again in a moment.",
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

  return (
    <VenueLayout>
      <div className="h-[calc(100vh-6rem)] flex gap-4">
        {/* Left Sidebar - Quick Prompts */}
        <Card className="hidden lg:flex flex-col w-72 border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">What I can help with</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto">
            <div className="space-y-2">
              {quickPrompts.map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => sendMessage(prompt.prompt)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${colors.primaryLight}15` }}>
                    <prompt.icon className="h-4 w-4" style={{ color: colors.primaryLight }} />
                  </div>
                  <span className="text-sm text-gray-700">{prompt.label}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Center - Chat */}
        <Card className="flex-1 flex flex-col border-0 shadow-sm">
          {/* Header */}
          <div className="p-4 border-b flex items-center gap-3">
            <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{ backgroundColor: colors.primary }}>
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Mia - AI Venue Manager</h2>
              <p className="text-xs text-gray-500">Powered by Seeksy AI</p>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] p-4 rounded-2xl ${
                      message.role === "user"
                        ? "bg-blue-600 text-white rounded-br-md"
                        : "bg-gray-100 text-gray-900 rounded-bl-md"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 p-4 rounded-2xl rounded-bl-md">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Mia anything about your venue..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                onClick={() => sendMessage()}
                disabled={!input.trim() || isLoading}
                style={{ backgroundColor: colors.primary }}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>

        {/* Right Sidebar - Session Notes */}
        <Card className="hidden xl:flex flex-col w-64 border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Session Notes
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto">
            <div className="space-y-3">
              {sessionNotes.map((note, index) => (
                <div key={index} className="flex items-start gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-2" />
                  <p className="text-sm text-gray-600">{note}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </VenueLayout>
  );
}
