import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, Send, Loader2, MessageSquare, Trash2, Plus, Calendar, FileText, ClipboardList, Mic } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/seeksy-assistant`;

const AIAssistant = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  // Fetch conversations
  const { data: conversations = [] } = useQuery({
    queryKey: ["ai-conversations", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("ai_conversations")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });
      
      if (error) throw error;
      return data as Conversation[];
    },
    enabled: !!user,
  });

  // Load conversation messages
  const loadConversation = async (conversationId: string) => {
    const { data, error } = await supabase
      .from("ai_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });
    
    if (error) {
      toast.error("Failed to load conversation");
      return;
    }
    
    setMessages(data.map(msg => ({ role: msg.role as "user" | "assistant", content: msg.content })));
    setCurrentConversationId(conversationId);
  };

  // Create new conversation
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

  // Delete conversation
  const deleteConversation = useMutation({
    mutationFn: async (conversationId: string) => {
      const { error } = await supabase
        .from("ai_conversations")
        .delete()
        .eq("id", conversationId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-conversations"] });
      if (currentConversationId === conversationToDelete) {
        startNewChat();
      }
      toast.success("Conversation deleted");
    },
    onError: () => {
      toast.error("Failed to delete conversation");
    },
  });

  // Save message to database
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

  // Update conversation timestamp
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

  const startNewChat = () => {
    setMessages([{
      role: "assistant",
      content: "Hi! I'm Seeksy AI, your assistant for building amazing Seekies. I can help you create meeting types, write event descriptions, generate poll questions, optimize your creator profile, and even search through your podcast transcripts. What would you like to work on today?"
    }]);
    setCurrentConversationId(null);
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    // Check for demo message from welcome page
    const demoMessage = localStorage.getItem("aiDemo");
    if (demoMessage && user) {
      localStorage.removeItem("aiDemo");
      setInput(demoMessage);
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  }, [user]);

  const streamChat = async (userMessage: string) => {
    let conversationId = currentConversationId;
    
    // Create new conversation if needed
    if (!conversationId) {
      try {
        const newConv = await createNewConversation.mutateAsync(userMessage);
        conversationId = newConv.id;
        setCurrentConversationId(conversationId);
      } catch (error) {
        toast.error("Failed to create conversation");
        return;
      }
    }

    const newMessages = [...messages, { role: "user" as const, content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    // Save user message
    if (conversationId) {
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
        body: JSON.stringify({ messages: newMessages, userId: user?.id }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to get response");
      }

      if (!response.body) {
        throw new Error("No response body");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        
        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            
            if (content) {
              assistantMessage += content;
              setMessages([
                ...newMessages,
                { role: "assistant", content: assistantMessage }
              ]);
            }
          } catch (e) {
            // Incomplete JSON, wait for more data
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to send message");
    } finally {
      setIsLoading(false);
      
      // Save assistant message and update conversation
      if (conversationId && assistantMessage) {
        await saveMessage(conversationId, "assistant", assistantMessage);
        await updateConversation(conversationId);
        
        // Track AI message usage
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

  const handleQuickAction = (prompt: string) => {
    setInput(prompt);
    textareaRef.current?.focus();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <ResizablePanelGroup direction="horizontal" className="min-h-screen">
        {/* Sidebar with conversation history */}
        <ResizablePanel defaultSize={20} minSize={15} maxSize={35}>
          <Card className="h-screen bg-gradient-to-br from-card via-card to-primary/5 border-border/50 shadow-lg flex flex-col overflow-hidden transition-all duration-300 rounded-none border-r">
            <div className="flex items-center justify-between p-4 pb-4 border-b border-border/50 shrink-0 bg-gradient-to-r from-primary/5 to-transparent">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-sm">Conversations</h3>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={startNewChat}
                title="New conversation"
                className="h-8 w-8 hover:bg-primary/10 transition-colors"
              >
                <Plus className="h-4 w-4 text-primary" />
              </Button>
            </div>
            
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-2">
                {conversations.map((conv) => (
                  <div
                    key={conv.id}
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer group transition-all duration-200 border ${
                      currentConversationId === conv.id 
                        ? "bg-primary/10 border-primary/20 shadow-sm" 
                        : "hover:bg-accent/50 border-transparent hover:border-border/30"
                    }`}
                  >
                    <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />
                    <button
                      onClick={() => loadConversation(conv.id)}
                      className="flex-1 text-left text-sm truncate font-medium"
                    >
                      {conv.title}
                    </button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 hover:bg-destructive/10 hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        setConversationToDelete(conv.id);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
                {conversations.length === 0 && (
                  <div className="text-center py-12">
                    <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                    <p className="text-sm text-muted-foreground">
                      No conversations yet
                    </p>
                    <p className="text-xs text-muted-foreground/70 mt-1">
                      Start a new chat to get going!
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </Card>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Main chat area */}
        <ResizablePanel defaultSize={80}>
          <div className="flex flex-col h-screen">
        {messages.length === 0 ? (
          /* Empty state with centered input */
          <div className="flex-1 flex flex-col items-center justify-center p-8 max-w-4xl mx-auto w-full">
            <div className="text-center mb-12 animate-fade-in">
              <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                Hello,
              </h1>
              <p className="text-xl text-muted-foreground">
                How can I help you with Seeksy today?
              </p>
            </div>

            {/* Large centered input */}
            <form onSubmit={handleSubmit} className="w-full mb-8">
              <div className="relative">
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    e.target.style.height = "auto";
                    e.target.style.height = Math.min(e.target.scrollHeight, 200) + "px";
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask me anything about creating Seekies..."
                  className="min-h-[64px] max-h-[200px] resize-none text-base pl-5 pr-14 py-5 rounded-3xl border-border/50 focus:border-primary/50 transition-all duration-200 shadow-lg bg-card"
                  disabled={isLoading}
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!input.trim() || isLoading}
                  className="absolute right-2 bottom-2 h-12 w-12 rounded-2xl shadow-md hover:shadow-lg transition-all duration-200 bg-gradient-to-br from-primary to-primary/90"
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </Button>
              </div>
            </form>

            {/* Quick action chips */}
            <div className="flex flex-wrap gap-3 justify-center max-w-3xl animate-fade-in">
              <Button
                variant="outline"
                size="lg"
                onClick={() => handleQuickAction("Help me create a meeting type for client consultations")}
                className="rounded-2xl px-6 py-6 h-auto hover:bg-primary/5 hover:border-primary/30 transition-all duration-200 hover:shadow-md group"
              >
                <Calendar className="h-5 w-5 mr-2 text-primary" />
                <span className="font-medium">Create Meeting</span>
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => handleQuickAction("Write an engaging event description for a workshop")}
                className="rounded-2xl px-6 py-6 h-auto hover:bg-primary/5 hover:border-primary/30 transition-all duration-200 hover:shadow-md group"
              >
                <FileText className="h-5 w-5 mr-2 text-primary" />
                <span className="font-medium">Event Description</span>
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => handleQuickAction("Generate poll questions to understand my audience")}
                className="rounded-2xl px-6 py-6 h-auto hover:bg-primary/5 hover:border-primary/30 transition-all duration-200 hover:shadow-md group"
              >
                <ClipboardList className="h-5 w-5 mr-2 text-primary" />
                <span className="font-medium">Poll Questions</span>
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => handleQuickAction("Search my podcast transcripts for mentions of AI")}
                className="rounded-2xl px-6 py-6 h-auto hover:bg-primary/5 hover:border-primary/30 transition-all duration-200 hover:shadow-md group"
              >
                <Mic className="h-5 w-5 mr-2 text-primary" />
                <span className="font-medium">Search Podcasts</span>
              </Button>
            </div>
          </div>
        ) : (
          /* Conversation view */
          <>
            {/* Header with logo */}
            <div className="p-4 border-b border-border/50 bg-gradient-to-r from-primary/5 to-transparent">
              <div className="flex items-center gap-3 max-w-5xl mx-auto">
                <div className="p-2 bg-gradient-to-br from-primary to-primary/80 rounded-xl shadow-md">
                  <Sparkles className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-lg font-bold">Seeksy AI Assistant</h1>
                  <p className="text-xs text-muted-foreground">
                    Your AI-powered helper for creating Seekies
                  </p>
                </div>
              </div>
            </div>

            {/* Chat Messages */}
            <ScrollArea ref={scrollRef} className="flex-1 p-6">
              <div className="space-y-6 max-w-4xl mx-auto">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex gap-4 animate-fade-in ${
                      message.role === "assistant" ? "justify-start" : "justify-end"
                    }`}
                  >
                    {message.role === "assistant" && (
                      <div className="shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-md">
                        <Sparkles className="h-4 w-4 text-primary-foreground" />
                      </div>
                    )}
                    <div
                      className={`max-w-[75%] rounded-2xl p-4 shadow-md transition-all duration-200 hover:shadow-lg ${
                        message.role === "assistant"
                          ? "bg-gradient-to-br from-muted via-muted to-muted/80 border border-border/30"
                          : "bg-gradient-to-br from-primary to-primary/90 text-primary-foreground"
                      }`}
                    >
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">
                        {message.content}
                      </p>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-4 justify-start animate-fade-in">
                    <div className="shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-md">
                      <Sparkles className="h-4 w-4 text-primary-foreground" />
                    </div>
                    <div className="bg-gradient-to-br from-muted via-muted to-muted/80 border border-border/30 rounded-2xl p-4 shadow-md">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Input Form */}
            <div className="border-t border-border/50 p-4 bg-gradient-to-r from-muted/30 to-transparent">
              <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
                <div className="relative">
                  <Textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => {
                      setInput(e.target.value);
                      e.target.style.height = "auto";
                      e.target.style.height = Math.min(e.target.scrollHeight, 150) + "px";
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask me anything about creating Seekies..."
                    className="min-h-[56px] max-h-[150px] resize-none text-sm pl-5 pr-14 py-4 rounded-3xl border-border/50 focus:border-primary/50 transition-colors"
                    disabled={isLoading}
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={!input.trim() || isLoading}
                    className="absolute right-2 bottom-2 h-12 w-12 rounded-2xl shadow-md hover:shadow-lg transition-all duration-200 bg-gradient-to-br from-primary to-primary/90"
                  >
                    {isLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Send className="h-5 w-5" />
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </>
        )}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this conversation and all its messages. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (conversationToDelete) {
                  deleteConversation.mutate(conversationToDelete);
                }
                setDeleteDialogOpen(false);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AIAssistant;
