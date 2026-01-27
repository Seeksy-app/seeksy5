import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Send, 
  Loader2, 
  Mic, 
  Sparkles,
  Plus
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AgentMessageCard } from "./AgentMessageCard";
import { EpisodeProgressPanel } from "./EpisodeProgressPanel";
import { CreateMeetingTypeModal } from "./CreateMeetingTypeModal";
import { AgentAction, AgentMessage, EpisodeWorkspace } from "./types";

interface PodcastAgentChatProps {
  podcastId?: string;
  episodeId?: string;
}

const QUICK_PROMPTS = [
  "Help me prepare for a new episode",
  "Research questions for my next guest",
  "Create an episode outline",
  "Send a guest invitation",
  "Generate talking points for AI in podcasting",
];

export function PodcastAgentChat({ podcastId, episodeId }: PodcastAgentChatProps) {
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [workspace, setWorkspace] = useState<EpisodeWorkspace | null>(null);
  const [pendingTasks, setPendingTasks] = useState(0);
  const [showCreateMeetingModal, setShowCreateMeetingModal] = useState(false);
  const [suggestedMeetingName, setSuggestedMeetingName] = useState("");
  const [pendingMeetingAction, setPendingMeetingAction] = useState<{
    messageIndex: number;
    actionIndex: number;
  } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchWorkspace = async (wsId: string) => {
    const result = await (supabase as any)
      .from("podcast_episode_workspaces")
      .select("*")
      .eq("id", wsId)
      .single();
    
    const data = result.data as any;
    if (data) {
      setWorkspace({
        id: data.id,
        title: data.title,
        topic: data.topic,
        status: data.status as EpisodeWorkspace['status'],
        guestInvited: data.guest_invited,
        researchComplete: data.research_complete,
        outlineComplete: data.outline_complete,
        recordingScheduled: data.recording_scheduled,
        scheduledDate: data.scheduled_date ? new Date(data.scheduled_date) : undefined,
      });
    }

    // Fetch pending tasks
    const taskResult = await (supabase as any)
      .from("podcast_agent_tasks")
      .select("*", { count: "exact", head: true })
      .eq("workspace_id", wsId)
      .eq("status", "pending");
    
    setPendingTasks(taskResult.count || 0);
  };

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage: AgentMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Not authenticated");
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/podcast-agent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            message: messageText,
            conversationId,
            workspaceId,
            context: { podcastId, episodeId },
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to get response");
      }

      const data = await response.json();

      if (data.conversationId && !conversationId) {
        setConversationId(data.conversationId);
      }

      const assistantMessage: AgentMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.response,
        actions: data.actions,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // If there's a workspace, fetch it
      if (data.workspaceId) {
        setWorkspaceId(data.workspaceId);
        await fetchWorkspace(data.workspaceId);
      }
    } catch (error) {
      console.error("Agent error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveAction = async (action: AgentAction, messageIndex: number, actionIndex: number) => {
    // Handle create_meeting_type action by opening modal
    if (action.type === "create_meeting_type") {
      setSuggestedMeetingName(action.data?.suggestedName || "Pre-Podcast Interview");
      setPendingMeetingAction({ messageIndex, actionIndex });
      setShowCreateMeetingModal(true);
      return;
    }

    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      let actionType = action.type;
      let actionData = action.data;

      // For outreach, we need to send the email
      if (action.type === "outreach") {
        // First save the draft
        const saveResponse = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/podcast-agent-action`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              actionType: "outreach",
              actionData: action.data,
              workspaceId,
              conversationId,
            }),
          }
        );

        const saveData = await saveResponse.json();
        if (!saveData.success) throw new Error(saveData.error);

        // Update workspace ID if returned
        if (saveData.workspaceId && !workspaceId) {
          setWorkspaceId(saveData.workspaceId);
        }

        // Now send the email
        const sendResponse = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/podcast-agent-action`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              actionType: "send_email",
              actionData: {
                ...action.data,
                outreachId: saveData.outreachId,
              },
              workspaceId: saveData.workspaceId,
            }),
          }
        );

        const sendData = await sendResponse.json();
        if (!sendData.success) throw new Error(sendData.error);

        toast({
          title: "Email Sent!",
          description: sendData.message,
        });
      } else {
        // Execute other action types
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/podcast-agent-action`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              actionType,
              actionData,
              workspaceId,
              conversationId,
            }),
          }
        );

        const data = await response.json();
        if (!data.success) throw new Error(data.error);

        if (data.workspaceId && !workspaceId) {
          setWorkspaceId(data.workspaceId);
        }

        toast({
          title: "Action Completed",
          description: data.message,
        });
      }

      // Update action status in messages
      setMessages((prev) =>
        prev.map((msg, mIdx) => {
          if (mIdx === messageIndex && msg.actions) {
            return {
              ...msg,
              actions: msg.actions.map((a, aIdx) =>
                aIdx === actionIndex ? { ...a, status: "completed" as const } : a
              ),
            };
          }
          return msg;
        })
      );

      // Refresh workspace
      if (workspaceId) {
        await fetchWorkspace(workspaceId);
      }
    } catch (error) {
      console.error("Action error:", error);
      toast({
        title: "Action Failed",
        description: error instanceof Error ? error.message : "Failed to execute action",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelAction = (action: AgentAction, messageIndex: number, actionIndex: number) => {
    setMessages((prev) =>
      prev.map((msg, mIdx) => {
        if (mIdx === messageIndex && msg.actions) {
          return {
            ...msg,
            actions: msg.actions.map((a, aIdx) =>
              aIdx === actionIndex ? { ...a, status: "cancelled" as const } : a
            ),
          };
        }
        return msg;
      })
    );
  };

  const startNewConversation = () => {
    setMessages([]);
    setConversationId(null);
    setWorkspaceId(null);
    setWorkspace(null);
    setPendingTasks(0);
  };

  return (
    <div className="flex gap-4 h-[calc(100vh-12rem)]">
      {/* Main Chat Area */}
      <Card className="flex-1 flex flex-col">
        <CardHeader className="border-b py-3 px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-base">Podcast Production Agent</CardTitle>
                <p className="text-xs text-muted-foreground">Your AI production assistant</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={startNewConversation}>
              <Plus className="h-4 w-4 mr-1" />
              New
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-8">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center mb-4">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-lg font-medium mb-2">
                  Hi! I'm your Podcast Production Agent
                </h3>
                <p className="text-muted-foreground text-sm max-w-md mb-6">
                  I can help you invite guests, research topics, create outlines, 
                  manage tasks, and prepare for your episodes. Just tell me what you need!
                </p>
                <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                  {QUICK_PROMPTS.map((prompt, i) => (
                    <Button
                      key={i}
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => sendMessage(prompt)}
                    >
                      {prompt}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                {messages.map((message, messageIndex) => (
                  <AgentMessageCard
                    key={message.id}
                    content={message.content}
                    actions={message.actions}
                    isUser={message.role === "user"}
                    onApproveAction={(action, actionIndex) =>
                      handleApproveAction(action, messageIndex, actionIndex)
                    }
                    onCancelAction={(action, actionIndex) =>
                      handleCancelAction(action, messageIndex, actionIndex)
                    }
                    isProcessing={isLoading}
                  />
                ))}
                {isLoading && (
                  <div className="flex items-center gap-2 text-muted-foreground ml-11">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Thinking...</span>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          {/* Input Area */}
          <div className="border-t p-4">
            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Tell me what you need for your next episode..."
                className="min-h-[60px] resize-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage(input);
                  }
                }}
              />
              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || isLoading}
                  size="icon"
                  className="h-[60px] w-10"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress Panel */}
      <div className="w-80 flex-shrink-0">
        <EpisodeProgressPanel
          workspace={workspace}
          pendingTasks={pendingTasks}
        />
      </div>

      {/* Create Meeting Type Modal */}
      <CreateMeetingTypeModal
        open={showCreateMeetingModal}
        onClose={() => {
          setShowCreateMeetingModal(false);
          setPendingMeetingAction(null);
        }}
        suggestedName={suggestedMeetingName}
        onCreated={(meetingType) => {
          // Mark action as completed
          if (pendingMeetingAction) {
            setMessages((prev) =>
              prev.map((msg, mIdx) => {
                if (mIdx === pendingMeetingAction.messageIndex && msg.actions) {
                  return {
                    ...msg,
                    actions: msg.actions.map((a, aIdx) =>
                      aIdx === pendingMeetingAction.actionIndex
                        ? { ...a, status: "completed" as const }
                        : a
                    ),
                  };
                }
                return msg;
              })
            );
          }
          setPendingMeetingAction(null);
        }}
      />
    </div>
  );
}
