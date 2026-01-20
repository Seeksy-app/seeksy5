import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Loader2, X, Minimize2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useLocation } from "react-router-dom";
import { SparkIcon } from "@/components/spark/SparkIcon";
import { getSparkGreeting, type UserRole } from "@/lib/spark/sparkPersonality";
import { useRole } from "@/contexts/RoleContext";


interface Message {
  role: "user" | "assistant";
  content: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/global-agent`;

export const SeeksyAIChatWidget = () => {
  const location = useLocation();
  const { currentRole } = useRole();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  
  // Hide on investor portal page
  if (location.pathname === '/investor') {
    return null;
  }
  
  // Listen for sidebar "Ask Spark" click
  useEffect(() => {
    const handleOpenChat = () => setIsOpen(true);
    window.addEventListener('openSparkChat', handleOpenChat);
    return () => window.removeEventListener('openSparkChat', handleOpenChat);
  }, []);
  
  // Global keyboard shortcut: Cmd+Shift+S (Mac) or Ctrl+Shift+S (Win)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'S') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  // Determine user role for Spark personality
  const userRole: UserRole = 
    (currentRole === "admin" as any || currentRole === "super_admin" as any)
      ? "admin" 
      : (currentRole === "advertiser" as any)
      ? "advertiser" 
      : "creator";
  
  const greeting = getSparkGreeting(userRole);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [triggerSparkAnimation, setTriggerSparkAnimation] = useState(false);
  
  const initialMessage = greeting.text;
  
  const [messages, setMessages] = useState<Message[]>([{
    role: "assistant",
    content: initialMessage
  }]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const queryClient = useQueryClient();

  // Check if user has reached dashboard before showing chat
  useEffect(() => {
    const hasSeenChat = localStorage.getItem('seeksy_chat_seen');
    const hasVisitedDashboard = localStorage.getItem('visited_dashboard');
    
    if (!hasSeenChat && hasVisitedDashboard) {
      setTimeout(() => {
        setIsOpen(true);
        setShowQuickActions(true);
        localStorage.setItem('seeksy_chat_seen', 'true');
      }, 1000);
    }
  }, []);

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const createNewConversation = useMutation({
    mutationFn: async (firstMessage: string) => {
      if (!user) throw new Error("No user");
      
      const { data: conversation, error: convError } = await supabase
        .from("ai_conversations")
        .insert({
          user_id: user.id,
          title: firstMessage.slice(0, 50) + (firstMessage.length > 50 ? "..." : "")
        })
        .select()
        .single();
      
      if (convError) throw convError;
      return conversation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-conversations"] });
    },
  });

  const saveMessage = async (conversationId: string, role: "user" | "assistant", content: string) => {
    const { error } = await supabase
      .from("ai_messages")
      .insert({
        conversation_id: conversationId,
        role,
        content
      });
    
    if (error) {
      console.error("Failed to save message:", error);
    }
  };

  const updateConversation = async (conversationId: string) => {
    const { error } = await supabase
      .from("ai_conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", conversationId);
    
    if (error) {
      console.error("Failed to update conversation:", error);
    }
    queryClient.invalidateQueries({ queryKey: ["ai-conversations"] });
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const streamChat = async (userMessage: string) => {
    const newMessages: Message[] = [
      ...messages,
      { role: "user", content: userMessage }
    ];
    
    setMessages(newMessages);
    setIsLoading(true);

    let conversationId = currentConversationId;
    
    if (!conversationId && user) {
      try {
        const newConv = await createNewConversation.mutateAsync(userMessage);
        conversationId = newConv.id;
        setCurrentConversationId(conversationId);
      } catch (error) {
        console.error("Failed to create conversation:", error);
      }
    }
    
    if (conversationId && user) {
      await saveMessage(conversationId, "user", userMessage);
    }

    let assistantMessage = "";

    try {
      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          message: userMessage,
          context: {
            route: location.pathname,
            role: userRole,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response from AI");
      }

      const data = await response.json();
      assistantMessage = data.response || data.text || "I'm here to help!";
      
      setMessages([
        ...newMessages,
        { role: "assistant", content: assistantMessage }
      ]);

    } catch (error) {
      console.error("Chat error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to send message");
    } finally {
      setIsLoading(false);
      
      if (conversationId && assistantMessage) {
        await saveMessage(conversationId, "assistant", assistantMessage);
        await updateConversation(conversationId);
        
        if (user) {
          try {
            await supabase.rpc('increment_usage', {
              _user_id: user.id,
              _feature_type: 'ai_messages',
              _increment: 1
            });
          } catch (error) {
            console.error("Failed to track usage:", error);
          }
        }
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    await streamChat(userMessage);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleQuickAction = async (prompt: string) => {
    setShowQuickActions(false);
    setInput(prompt);
    await streamChat(prompt);
  };

  const quickActions = [
    { label: "Create a Meeting", prompt: "Create a meeting" },
    { label: "Add a Podcast", prompt: "Add a podcast" },
    { label: "Create an Event", prompt: "Create an event" },
    { label: "Send an Email", prompt: "Send an email" },
  ];

  if (!isOpen) {
    return (
      <div 
        className="fixed z-50 animate-in fade-in slide-in-from-bottom-4"
        style={{ bottom: '20px', right: '20px' }}
      >
        <button
          onClick={() => {
            setIsOpen(true);
            setTriggerSparkAnimation(true);
          }}
          className="transition-all duration-300 hover:scale-110 bg-transparent border-none p-0"
          aria-label="Open Seeksy AI Chat"
          style={{ 
            background: 'transparent',
            border: 'none',
            padding: 0,
            cursor: 'pointer'
          }}
        >
          <SparkIcon 
            variant="holiday"
            size={80}
            pose="waving"
            animated
          />
        </button>
      </div>
    );
  }
  
  return (
    <Card 
      className={cn(
        "fixed shadow-2xl transition-all duration-300 z-50 flex flex-col animate-in slide-in-from-bottom-4 bg-background/95 backdrop-blur-sm border-border",
        isMinimized ? "h-14 w-80" : "h-[600px] w-[400px]"
      )}
      style={{ bottom: '20px', right: '20px' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b rounded-t-lg">
        <div className="flex items-center gap-3">
          <SparkIcon variant="holiday" size="sm" pose="waving" />
          <div>
            <h3 className="font-semibold text-sm">Seeksy Spark</h3>
            <p className="text-xs text-muted-foreground">Your AI Guide ✨</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setIsMinimized(!isMinimized)}
            className="h-8 w-8"
          >
            <Minimize2 className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setIsOpen(false)}
            className="h-8 w-8"
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
              {showQuickActions && (
                <div className="mb-4 p-3 bg-muted/50 rounded-lg space-y-3">
                  <p className="text-sm text-muted-foreground font-medium">Quick actions to get started:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {quickActions.map((action) => (
                      <Button
                        key={action.label}
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuickAction(action.prompt)}
                        className="justify-start text-xs h-auto py-2"
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
                    <SparkIcon 
                      variant="holiday"
                      size="sm"
                      pose="idle"
                      animated={index === messages.length - 1 && isLoading}
                    />
                  )}
                  <div
                    className={cn(
                      "rounded-2xl px-4 py-2 max-w-[85%]",
                      message.role === "assistant"
                        ? "bg-muted"
                        : "bg-primary text-primary-foreground"
                    )}
                  >
                    <p className="whitespace-pre-wrap break-words leading-relaxed">
                      {message.content}
                    </p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3 text-sm items-start">
                  <SparkIcon 
                    variant="holiday"
                    size="sm"
                    pose="typing"
                    animated
                  />
                  <div className="rounded-2xl px-4 py-2 bg-muted">
                    <Loader2 className="h-4 w-4 animate-spin text-yellow-500" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-4 border-t">
            <div className="relative">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
                }}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything..."
                className="min-h-[40px] max-h-[120px] resize-none text-sm pr-12 rounded-xl"
                disabled={isLoading}
              />
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim() || isLoading}
                className="absolute right-2 bottom-2 h-8 w-8 rounded-lg"
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
};
