import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, X, Send, Loader2, ChevronDown, ChevronUp,
  Lightbulb, FileText, ArrowRight, Wand2, MessageSquare
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const QUICK_ACTIONS = [
  { id: 'explain', label: 'Explain this', icon: Lightbulb },
  { id: 'draft', label: 'Draft content', icon: FileText },
  { id: 'suggest', label: 'Suggest next steps', icon: ArrowRight },
  { id: 'summarize', label: 'Summarize', icon: Wand2 },
];

interface AIColumnProps {
  className?: string;
}

export function AIColumn({ className }: AIColumnProps) {
  const { 
    aiColumnOpen, 
    toggleAiColumn, 
    aiContext, 
    activeSeeksyId,
    contextColumns,
    workspaceName,
    addRecentAction,
  } = useWorkspaceStore();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showContext, setShowContext] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const buildContextPayload = () => ({
    workspace: workspaceName,
    activeApp: activeSeeksyId,
    openPanels: contextColumns.map(c => ({ type: c.type, title: c.title })),
    recentActions: aiContext.recentActions.slice(0, 5),
  });

  const handleSend = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const context = buildContextPayload();
      
      // Call the AI edge function
      const { data, error } = await supabase.functions.invoke('workspace-ai-chat', {
        body: { 
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content,
          })),
          context,
        }
      });

      if (error) throw error;

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data?.content || "I'm here to help with your workspace. What would you like to know?",
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
      addRecentAction(`Asked AI: ${text.slice(0, 50)}...`);
    } catch (error) {
      console.error('AI error:', error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: "I encountered an issue. Please try again or check your connection.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (actionId: string) => {
    const actionPrompts: Record<string, string> = {
      explain: `Explain what I'm currently looking at in the ${activeSeeksyId} section.`,
      draft: `Help me draft content related to my current workspace context.`,
      suggest: `Based on my recent activity, what should I do next?`,
      summarize: `Give me a summary of my current workspace state and open panels.`,
    };
    handleSend(actionPrompts[actionId] || '');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!aiColumnOpen) {
    return (
      <motion.button
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={toggleAiColumn}
        className={cn(
          "fixed right-4 bottom-4 z-50",
          "w-14 h-14 rounded-full",
          "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground",
          "shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40",
          "flex items-center justify-center",
          "transition-all duration-200 hover:scale-105",
          className
        )}
      >
        <Sparkles className="w-6 h-6" />
      </motion.button>
    );
  }

  return (
    <motion.aside
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "w-[380px] h-full flex flex-col",
        "bg-gradient-to-b from-card to-card/95 border-l",
        "shadow-2xl",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-gradient-to-r from-primary/10 to-transparent">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Seeksy AI</h3>
            <p className="text-xs text-muted-foreground">Context-aware assistant</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={toggleAiColumn} className="h-8 w-8">
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Context Indicator */}
      <button
        onClick={() => setShowContext(!showContext)}
        className="flex items-center justify-between px-4 py-2 text-xs bg-muted/30 hover:bg-muted/50 transition-colors"
      >
        <span className="text-muted-foreground">
          Aware of: <span className="text-foreground font-medium">{activeSeeksyId}</span>
          {contextColumns.length > 0 && (
            <span className="text-muted-foreground"> + {contextColumns.length} panels</span>
          )}
        </span>
        {showContext ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>

      <AnimatePresence>
        {showContext && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b overflow-hidden"
          >
            <div className="p-3 space-y-2 bg-muted/20">
              <div className="flex flex-wrap gap-1">
                <Badge variant="secondary" className="text-xs">
                  {workspaceName}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {activeSeeksyId}
                </Badge>
                {contextColumns.map(col => (
                  <Badge key={col.id} variant="outline" className="text-xs">
                    {col.title}
                  </Badge>
                ))}
              </div>
              {aiContext.recentActions.length > 0 && (
                <div className="text-xs text-muted-foreground">
                  <p className="font-medium mb-1">Recent actions:</p>
                  <ul className="space-y-0.5">
                    {aiContext.recentActions.slice(0, 3).map((action, i) => (
                      <li key={i} className="truncate">• {action}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-8">
              <Sparkles className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
              <h4 className="font-medium mb-2">How can I help?</h4>
              <p className="text-sm text-muted-foreground mb-4">
                I understand your workspace context and can help with anything.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {QUICK_ACTIONS.map(action => (
                  <Button
                    key={action.id}
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickAction(action.id)}
                    className="justify-start gap-2 h-auto py-2"
                  >
                    <action.icon className="w-3.5 h-3.5" />
                    <span className="text-xs">{action.label}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3",
                message.role === 'user' && "justify-end"
              )}
            >
              {message.role === 'assistant' && (
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shrink-0">
                  <Sparkles className="w-3.5 h-3.5 text-primary-foreground" />
                </div>
              )}
              <div
                className={cn(
                  "max-w-[85%] rounded-lg px-3 py-2 text-sm",
                  message.role === 'user'
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                )}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
              {message.role === 'user' && (
                <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-primary-foreground animate-pulse" />
              </div>
              <div className="bg-muted rounded-lg px-3 py-2">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-3 border-t bg-background/50">
        <div className="relative">
          <Textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about your workspace..."
            className="min-h-[80px] pr-12 resize-none"
            disabled={isLoading}
          />
          <Button
            size="icon"
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className="absolute right-2 bottom-2 h-8 w-8"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </motion.aside>
  );
}
