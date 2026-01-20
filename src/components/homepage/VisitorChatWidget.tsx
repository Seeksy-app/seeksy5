import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { 
  MessageCircle, 
  X, 
  Send, 
  Loader2, 
  Sparkles,
  BookOpen,
  DollarSign,
  Users,
  Mic,
  Calendar,
  HelpCircle,
  ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SparkIcon } from "@/components/spark/SparkIcon";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const VISITOR_QUICK_STARTERS = [
  { text: "What is Seeksy and how can it help me?", icon: HelpCircle },
  { text: "What features does Seeksy offer for podcasters?", icon: Mic },
  { text: "How much does Seeksy cost?", icon: DollarSign },
  { text: "How do I get started as a creator?", icon: Users },
  { text: "Tell me about the Studio and recording features", icon: BookOpen },
  { text: "Can I host events with Seeksy?", icon: Calendar },
];

export function VisitorChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const welcomeMessage = `Hi there! 👋 I'm Spark, your Seeksy guide.

I can help you learn about Seeksy's features for podcasters, creators, event hosts, and businesses.

**What would you like to know?**`;

  const sendMessage = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text || loading) return;

    const userMessage: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    setSuggestedPrompts([]); // Clear prompts while loading

    try {
      const { data, error } = await supabase.functions.invoke("visitor-chat", {
        body: { message: text },
      });

      if (error) throw error;

      const assistantMessage: Message = {
        role: "assistant",
        content: data.response || "I'm here to help! Ask me anything about Seeksy.",
      };

      setMessages((prev) => [...prev, assistantMessage]);
      
      // Set new suggested prompts from AI response
      if (data.suggestedPrompts && Array.isArray(data.suggestedPrompts)) {
        setSuggestedPrompts(data.suggestedPrompts.slice(0, 3));
      }
    } catch (error: any) {
      console.error("Visitor chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I'm having trouble connecting right now. Please try again or visit our Help Center at /kb for more information.",
        },
      ]);
      setSuggestedPrompts(["Visit Help Center", "How do I sign up?"]);
    } finally {
      setLoading(false);
    }
  };

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, suggestedPrompts]);

  // Show whether to display initial starters or dynamic prompts
  const showInitialStarters = messages.length === 0;
  const showDynamicPrompts = !loading && suggestedPrompts.length > 0 && messages.length > 0;

  return (
    <>
      {/* Floating Chat Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Button
              onClick={() => setIsOpen(true)}
              className="h-14 w-14 rounded-full bg-primary hover:bg-primary/90 shadow-xl flex items-center justify-center group"
            >
              <div className="relative">
                <MessageCircle className="h-6 w-6 text-primary-foreground" />
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-400"></span>
                </span>
              </div>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 right-6 z-50 w-[380px] h-[540px] bg-background border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="px-4 py-3 bg-gradient-to-r from-primary to-primary/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white rounded-full p-1 shadow-sm">
                  <SparkIcon variant="holiday" size={28} animated />
                </div>
                <div>
                  <h3 className="text-primary-foreground font-semibold text-sm">Ask Seeksy</h3>
                  <p className="text-primary-foreground/80 text-xs">Learn about our platform</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="text-primary-foreground hover:bg-white/10 h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Chat Area */}
            <ScrollArea ref={scrollRef} className="flex-1 p-4">
              {showInitialStarters ? (
                <div className="space-y-4">
                  {/* Welcome Message */}
                  <div className="flex gap-3">
                    <div className="shrink-0 bg-white rounded-full p-0.5">
                      <SparkIcon variant="holiday" size={24} pose="waving" />
                    </div>
                    <div className="bg-muted rounded-xl rounded-tl-sm px-4 py-3 shadow-sm">
                      <div className="text-sm leading-relaxed whitespace-pre-wrap">
                        {welcomeMessage.split("\n").map((line, idx) => {
                          if (line.startsWith("**")) {
                            return <p key={idx} className="font-semibold mt-2">{line.replace(/\*\*/g, "")}</p>;
                          }
                          return <p key={idx}>{line}</p>;
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Initial Quick Starters */}
                  <div className="space-y-2 mt-4">
                    <p className="text-xs font-medium text-muted-foreground px-1">Popular questions:</p>
                    <div className="flex flex-col gap-2">
                      {VISITOR_QUICK_STARTERS.slice(0, 4).map((starter, idx) => {
                        const Icon = starter.icon;
                        return (
                          <button
                            key={idx}
                            onClick={() => sendMessage(starter.text)}
                            disabled={loading}
                            className="flex items-center gap-2 text-left text-xs px-3 py-2 rounded-lg border border-border/60 bg-card hover:bg-muted transition-colors disabled:opacity-50"
                          >
                            <Icon className="h-3.5 w-3.5 text-primary shrink-0" />
                            <span className="line-clamp-1">{starter.text}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      {msg.role === "assistant" && (
                        <div className="shrink-0 mt-1 bg-white rounded-full p-0.5">
                          <SparkIcon variant="holiday" size={20} pose="idle" />
                        </div>
                      )}
                      <div
                        className={`rounded-xl px-4 py-2.5 max-w-[85%] shadow-sm ${
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground rounded-br-sm"
                            : "bg-muted rounded-tl-sm"
                        }`}
                      >
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </div>
                  ))}

                  {loading && (
                    <div className="flex gap-3">
                      <div className="shrink-0 mt-1 bg-white rounded-full p-0.5">
                        <SparkIcon variant="holiday" size={20} pose="typing" animated />
                      </div>
                      <div className="bg-muted rounded-xl rounded-tl-sm px-4 py-2.5 shadow-sm">
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                          <span className="text-sm text-muted-foreground">Thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Dynamic Suggested Prompts */}
                  {showDynamicPrompts && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="space-y-2 mt-2 pt-2 border-t border-border/40"
                    >
                      <p className="text-xs font-medium text-muted-foreground px-1">Continue exploring:</p>
                      <div className="flex flex-wrap gap-2">
                        {suggestedPrompts.map((prompt, idx) => (
                          <button
                            key={idx}
                            onClick={() => sendMessage(prompt)}
                            disabled={loading}
                            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary transition-colors disabled:opacity-50"
                          >
                            <span>{prompt}</span>
                            <ArrowRight className="h-3 w-3" />
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>
              )}
            </ScrollArea>

            {/* Input Area */}
            <div className="border-t p-3 bg-background">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  sendMessage();
                }}
                className="flex gap-2"
              >
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about Seeksy..."
                  disabled={loading}
                  className="flex-1 h-10 text-sm rounded-lg"
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={loading || !input.trim()}
                  className="h-10 w-10 rounded-lg bg-primary hover:bg-primary/90"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
              <p className="text-[10px] text-muted-foreground text-center mt-2">
                Powered by Seeksy AI • <a href="/kb" className="underline hover:text-foreground">Help Center</a>
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
