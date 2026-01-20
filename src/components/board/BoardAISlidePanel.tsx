import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Send, Loader2, Shield, Bot, X, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useBoardDataMode } from "@/contexts/BoardDataModeContext";
import DOMPurify from "dompurify";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const INITIAL_GREETING = `Welcome to the Seeksy Board AI Analyst. I can help you explore KPIs, financials, forecasts, assumptions, or GTM strategy.

What would you like to know?`;

const quickActions = [
  { label: "Explain KPIs", prompt: "Explain the current KPIs and what they mean for our growth" },
  { label: "Business Model", prompt: "Walk me through the Seeksy business model and revenue streams" },
  { label: "GTM Strategy", prompt: "Summarize our go-to-market strategy" },
  { label: "3-Year Forecast", prompt: "Explain the 3-year financial forecast projections" },
  { label: "CFO Assumptions", prompt: "What are the key CFO assumptions driving our financial model?" },
  { label: "Compare Scenarios", prompt: "Compare Base vs Aggressive scenario projections" },
];

// Function to convert URLs in content to clickable links and render HTML
const renderMessageContent = (content: string) => {
  let processedContent = content.replace(
    /(?:→\s*)?(\/?board\/[a-z0-9-]+)/gi,
    (match, path) => {
      const cleanPath = path.startsWith('/') ? path : `/${path}`;
      return `<a href="${cleanPath}" class="text-blue-600 hover:underline font-medium">${cleanPath}</a>`;
    }
  );
  
  const sanitized = DOMPurify.sanitize(processedContent, {
    ALLOWED_TAGS: ['b', 'strong', 'em', 'i', 'a', 'br', 'p', 'ul', 'li'],
    ALLOWED_ATTR: ['href', 'class', 'target'],
  });
  
  return sanitized;
};

interface BoardAISlidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  initialPrompt?: string;
}

export function BoardAISlidePanel({ isOpen, onClose, initialPrompt }: BoardAISlidePanelProps) {
  const { isDemo } = useBoardDataMode();
  const dataMode = isDemo ? 'demo' : 'real';
  
  const [messages, setMessages] = useState<Message[]>([{
    role: "assistant",
    content: INITIAL_GREETING
  }]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Handle initial prompt from search bar
  useEffect(() => {
    if (initialPrompt && isOpen && messages.length === 1) {
      setInput(initialPrompt);
      setTimeout(() => {
        sendMessage(initialPrompt);
        setInput("");
      }, 100);
    }
  }, [initialPrompt, isOpen]);

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

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/board-ai-analyst`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          message: userMessage,
          conversationHistory: newMessages.slice(-10),
          dataMode,
        }),
      });

      if (response.status === 401) {
        toast.error("Session expired. Please refresh and try again.");
        setIsLoading(false);
        return;
      }

      if (response.status === 403) {
        toast.error("Access denied. Board member or admin role required.");
        setIsLoading(false);
        return;
      }

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
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to get response from Board AI");
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

  const handleClearChat = () => {
    setMessages([{ role: "assistant", content: INITIAL_GREETING }]);
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent 
        side="right" 
        className="w-[480px] sm:max-w-[480px] p-0 flex flex-col"
      >
        {/* Header */}
        <SheetHeader className="p-4 border-b bg-gradient-to-r from-slate-800 to-slate-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <SheetTitle className="text-white text-left">Board AI Analyst</SheetTitle>
                <p className="text-xs text-slate-400">Financial & Strategy Insights</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={cn(
                "text-xs px-2 py-1 rounded-full",
                isDemo 
                  ? "bg-amber-500/20 text-amber-300" 
                  : "bg-emerald-500/20 text-emerald-300"
              )}>
                {isDemo ? 'Demo' : 'Live'}
              </span>
            </div>
          </div>
        </SheetHeader>

        {/* Messages */}
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
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
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
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="rounded-2xl px-4 py-2.5 bg-slate-100">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer actions */}
        {messages.length > 1 && (
          <div className="px-4 py-2 border-t border-slate-100 bg-slate-50">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearChat}
              className="text-xs text-slate-500 hover:text-slate-700"
            >
              <X className="w-3 h-3 mr-1" />
              Clear conversation
            </Button>
          </div>
        )}

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-4 border-t bg-white">
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
              placeholder="Ask about KPIs, forecasts, assumptions, or strategy..."
              className="min-h-[44px] max-h-[100px] resize-none text-sm pr-12 rounded-xl border-slate-200"
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
      </SheetContent>
    </Sheet>
  );
}
