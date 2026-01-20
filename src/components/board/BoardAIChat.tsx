import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Loader2, X, Minimize2, Shield, Bot } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import DOMPurify from "dompurify";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/board-ai-analyst`;

const INITIAL_GREETING = `Welcome to the Seeksy Board Portal. I can walk you through our KPIs, financials, forecasts, or GTM strategy anytime.

What would you like to explore?`;

const quickActions = [
  { label: "Explain KPIs", prompt: "Explain the current KPIs and what they mean for our growth" },
  { label: "Business Model", prompt: "Walk me through the Seeksy business model and revenue streams" },
  { label: "GTM Strategy", prompt: "Summarize our go-to-market strategy" },
  { label: "3-Year Forecast", prompt: "Explain the 3-year financial forecast projections" },
];

// Function to convert URLs in content to clickable links and render HTML
const renderMessageContent = (content: string) => {
  // Convert /board/* paths to clickable links
  let processedContent = content.replace(
    /(?:→\s*)?(\/?board\/[a-z0-9-]+)/gi,
    (match, path) => {
      const cleanPath = path.startsWith('/') ? path : `/${path}`;
      return `<a href="${cleanPath}" class="text-blue-600 hover:underline font-medium">${cleanPath}</a>`;
    }
  );
  
  // Sanitize HTML but allow safe tags
  const sanitized = DOMPurify.sanitize(processedContent, {
    ALLOWED_TAGS: ['b', 'strong', 'em', 'i', 'a', 'br', 'p', 'ul', 'li'],
    ALLOWED_ATTR: ['href', 'class', 'target'],
  });
  
  return sanitized;
};

export function BoardAIChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([{
    role: "assistant",
    content: INITIAL_GREETING
  }]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasAutoOpened, setHasAutoOpened] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-open DISABLED - users can open manually
  useEffect(() => {
    // No auto-open behavior
  }, [hasAutoOpened]);

  // Listen for sidebar "Board AI Analyst" click
  useEffect(() => {
    const handleOpenChat = () => setIsOpen(true);
    window.addEventListener('openBoardAIChat', handleOpenChat);
    return () => window.removeEventListener('openBoardAIChat', handleOpenChat);
  }, []);

  // Listen for "Ask Board AI Analyst" with pre-filled prompt (from SWOT, etc.)
  useEffect(() => {
    const handleOpenWithPrompt = (e: CustomEvent<{ prompt: string; context?: Record<string, unknown> }>) => {
      setIsOpen(true);
      setIsMinimized(false);
      // Set the input and auto-submit after a brief delay
      const { prompt } = e.detail;
      setInput(prompt);
      // Auto-submit after opening
      setTimeout(() => {
        sendMessage(prompt);
        setInput("");
      }, 100);
    };
    window.addEventListener('openBoardAIChatWithPrompt', handleOpenWithPrompt as EventListener);
    return () => window.removeEventListener('openBoardAIChatWithPrompt', handleOpenWithPrompt as EventListener);
  }, [messages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    await sendMessage(userMessage);
  };

  const sendMessage = async (userMessage: string) => {
    const newMessages: Message[] = [
      ...messages,
      { role: "user", content: userMessage }
    ];
    
    setMessages(newMessages);
    setIsLoading(true);

    try {
      // Get the current session for proper JWT auth
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        toast.error("Please log in to use the AI Analyst");
        setIsLoading(false);
        return;
      }

      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          message: userMessage,
          conversationHistory: newMessages.slice(-10),
        }),
      });

      if (response.status === 429) {
        toast.error("Rate limit exceeded. Please wait a moment and try again.");
        setIsLoading(false);
        return;
      }

      if (response.status === 402) {
        toast.error("AI credits exhausted. Please contact admin.");
        setIsLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to get response from Board AI");
      }

      const data = await response.json();
      const assistantMessage = data.response || data.text || "I'm here to help with board-related questions.";
      
      setMessages([
        ...newMessages,
        { role: "assistant", content: assistantMessage }
      ]);

    } catch (error) {
      console.error("Board AI Chat error:", error);
      toast.error("Failed to get response. Please try again.");
      setMessages([
        ...newMessages,
        { role: "assistant", content: "I apologize, but I'm having trouble connecting. Please try again in a moment." }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = async (prompt: string) => {
    await sendMessage(prompt);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  if (!isOpen) {
    return (
      <div 
        className="fixed z-[60] animate-in fade-in slide-in-from-bottom-4"
        style={{ bottom: '24px', right: '24px' }}
      >
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          aria-label="Open Board AI Analyst"
        >
          <Shield className="w-6 h-6 text-white" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white animate-pulse" />
        </button>
      </div>
    );
  }
  
  return (
    <Card 
      className={cn(
        "fixed shadow-2xl transition-all duration-300 z-[60] flex flex-col animate-in slide-in-from-bottom-4 bg-white border-slate-200",
        isMinimized ? "h-14 w-80" : "h-[550px] w-[380px]"
      )}
      style={{ bottom: '24px', right: '24px' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b bg-gradient-to-r from-slate-800 to-slate-900 rounded-t-lg">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-white">Board AI Analyst</h3>
            <p className="text-xs text-slate-400">Financial & Strategy Insights</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setIsMinimized(!isMinimized)}
            className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-700"
          >
            <Minimize2 className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setIsOpen(false)}
            className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-700"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Chat area */}
      {!isMinimized && (
        <>
          <ScrollArea ref={scrollRef} className="flex-1 p-4">
            <div className="space-y-4">
              {messages.length === 1 && (
                <div className="mb-4 space-y-2">
                  <p className="text-xs text-slate-500 font-medium">Quick actions:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {quickActions.map((action) => (
                      <Button
                        key={action.label}
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuickAction(action.prompt)}
                        className="justify-start text-xs h-auto py-2 border-slate-200 hover:bg-slate-50"
                        disabled={isLoading}
                      >
                        {action.label}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex gap-3 text-sm",
                    message.role === "assistant" ? "items-start" : "items-end flex-row-reverse"
                  )}
                >
                  {message.role === "assistant" && (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "rounded-2xl px-4 py-2.5 max-w-[85%]",
                      message.role === "assistant"
                        ? "bg-slate-100 text-slate-800"
                        : "bg-blue-600 text-white"
                    )}
                  >
                    {message.role === "assistant" ? (
                      <div 
                        className="whitespace-pre-wrap break-words leading-relaxed text-sm [&_b]:font-semibold [&_a]:text-blue-600 [&_a]:hover:underline"
                        dangerouslySetInnerHTML={{ __html: renderMessageContent(message.content) }}
                      />
                    ) : (
                      <p className="whitespace-pre-wrap break-words leading-relaxed text-sm">
                        {message.content}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3 text-sm items-start">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="rounded-2xl px-4 py-2.5 bg-slate-100">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-3 border-t bg-slate-50">
            <div className="relative">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = Math.min(e.target.scrollHeight, 100) + "px";
                }}
                onKeyDown={handleKeyDown}
                placeholder="Ask about KPIs, forecasts, or strategy..."
                className="min-h-[40px] max-h-[100px] resize-none text-sm pr-12 rounded-xl border-slate-200 bg-white"
                disabled={isLoading}
              />
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim() || isLoading}
                className="absolute right-2 bottom-2 h-8 w-8 rounded-lg bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </form>
        </>
      )}
    </Card>
  );
}