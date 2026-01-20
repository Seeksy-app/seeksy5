// @ts-nocheck
import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Loader2, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  message: string;
  user_id: string;
  created_at: string;
  sender_name: string;
}

interface OnlineUser {
  user_id: string;
  is_online: boolean;
  last_seen: string;
  profiles?: {
    full_name: string;
    username: string;
    avatar_url: string;
  };
}

interface PresenceRecord {
  user_id: string;
  is_online: boolean;
  last_seen: string;
}

interface ProfileRecord {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
}

export function AdminInternalChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [adminTeamId, setAdminTeamId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadMessages = async () => {
    if (!adminTeamId) return;

    try {
      const { data, error } = await supabase
        .from("team_messages")
        .select("id, message, user_id, created_at")
        .eq("team_id", adminTeamId)
        .eq("chat_type", "admin_internal")
        .order("created_at", { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        const userIds = [...new Set(data.map((m) => m.user_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, username")
          .in("id", userIds);

        const messagesWithNames: Message[] = data.map((msg) => {
          const profile = profiles?.find((p) => p.id === msg.user_id);
          return {
            ...msg,
            sender_name: profile?.full_name || profile?.username || "Admin",
          };
        });

        setMessages(messagesWithNames);
      } else {
        setMessages([]);
      }
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  };

  const loadOnlineUsers = async () => {
    if (!adminTeamId) return;

    try {
      // Cast to any to avoid TypeScript deep instantiation errors
      const adminRolesResult: any = await supabase
        .from("user_roles")
        .select("user_id")
        .or("role.eq.admin,role.eq.superadmin");

      if (!adminRolesResult.data || adminRolesResult.data.length === 0) return;

      const adminUserIds: string[] = adminRolesResult.data.map((r: any) => r.user_id);

      const presenceResult: any = await supabase
        .from("user_presence")
        .select("user_id, is_online, last_seen")
        .eq("team_id", adminTeamId)
        .in("user_id", adminUserIds);

      if (presenceResult.error) throw presenceResult.error;
      if (!presenceResult.data || presenceResult.data.length === 0) {
        setOnlineUsers([]);
        return;
      }

      const userIds: string[] = presenceResult.data.map((u: any) => u.user_id);
      
      const profilesResult: any = await supabase
        .from("profiles")
        .select("id, full_name, username, avatar_url")
        .in("id", userIds);

      const usersWithProfiles: OnlineUser[] = presenceResult.data.map((user: any) => {
        const profile = profilesResult.data?.find((p: any) => p.id === user.user_id);
        return {
          user_id: user.user_id,
          is_online: user.is_online,
          last_seen: user.last_seen,
          profiles: profile ? {
            full_name: profile.full_name || "",
            username: profile.username || "",
            avatar_url: profile.avatar_url || "",
          } : undefined,
        };
      });

      setOnlineUsers(usersWithProfiles);
    } catch (error) {
      console.error("Error loading online users:", error);
    }
  };

  useEffect(() => {
    const loadAdminTeam = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        setCurrentUserId(user.id);

        // Get or create Seeksy Admin Team
        let { data: team } = await supabase
          .from("teams")
          .select("id")
          .eq("name", "Seeksy Admin Team")
          .maybeSingle();

        if (!team) {
          const { data: newTeam } = await supabase
            .from("teams")
            .insert({
              owner_id: user.id,
              name: "Seeksy Admin Team",
            })
            .select()
            .single();
          team = newTeam;
        }

        setAdminTeamId(team!.id);
      } catch (error) {
        console.error("Error loading admin team:", error);
        toast({
          title: "Error",
          description: "Failed to load admin chat",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadAdminTeam();
  }, [toast]);

  useEffect(() => {
    if (!adminTeamId || !currentUserId) return;

    loadMessages();
    loadOnlineUsers();

    // Update presence
    supabase.from("user_presence").upsert({
      user_id: currentUserId,
      team_id: adminTeamId,
      last_seen: new Date().toISOString(),
      is_online: true,
    });

    // Set up realtime subscriptions
    const messagesChannel = supabase
      .channel("admin-internal-chat")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "team_messages",
          filter: `team_id=eq.${adminTeamId}`,
        },
        loadMessages
      )
      .subscribe();

    const presenceChannel = supabase
      .channel("admin-presence-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_presence",
          filter: `team_id=eq.${adminTeamId}`,
        },
        loadOnlineUsers
      )
      .subscribe();

    // Update presence every 30 seconds
    const presenceInterval = setInterval(() => {
      supabase.from("user_presence").upsert({
        user_id: currentUserId,
        team_id: adminTeamId,
        last_seen: new Date().toISOString(),
        is_online: true,
      });
    }, 30000);

    return () => {
      clearInterval(presenceInterval);
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(presenceChannel);
      supabase
        .from("user_presence")
        .update({
          is_online: false,
          last_seen: new Date().toISOString(),
        })
        .eq("user_id", currentUserId)
        .eq("team_id", adminTeamId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminTeamId, currentUserId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || sending || !adminTeamId) return;

    setSending(true);
    try {
      const { error } = await supabase.from("team_messages").insert({
        message: newMessage.trim(),
        user_id: currentUserId,
        team_id: adminTeamId,
        chat_type: "admin_internal",
      });

      if (error) throw error;

      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Team Members Sidebar */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Admin Team
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {onlineUsers.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-4">
              No team members online
            </div>
          ) : (
            onlineUsers.map((user) => (
              <div
                key={user.user_id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors cursor-pointer"
              >
                <div className="relative">
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={user.profiles?.avatar_url}
                      alt={user.profiles?.full_name || user.profiles?.username}
                    />
                    <AvatarFallback>
                      {(user.profiles?.full_name || user.profiles?.username)?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className={cn(
                      "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background",
                      user.is_online ? "bg-green-500" : "bg-gray-400"
                    )}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {user.profiles?.full_name || user.profiles?.username || "Unknown"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {user.is_online
                      ? "Active now"
                      : `Last seen ${formatDistanceToNow(new Date(user.last_seen), { addSuffix: true })}`}
                  </p>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Chat Area */}
      <Card className="lg:col-span-3 flex flex-col">
        <CardHeader className="border-b">
          <CardTitle>Admin Team Chat</CardTitle>
          <p className="text-sm text-muted-foreground">
            Internal communication for admin team members
          </p>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col p-0">
          <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-[400px]">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No messages yet. Start the conversation!
              </div>
            ) : (
              messages.map((message) => {
                const isCurrentUser = message.user_id === currentUserId;
                return (
                  <div
                    key={message.id}
                    className={cn(
                      "flex gap-3",
                      isCurrentUser && "flex-row-reverse"
                    )}
                  >
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarFallback>
                        {message.sender_name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={cn(
                        "flex flex-col gap-1",
                        isCurrentUser && "items-end"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {isCurrentUser ? "You" : message.sender_name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(message.created_at), "h:mm a")}
                        </span>
                      </div>
                      <div
                        className={cn(
                          "px-4 py-2 rounded-2xl max-w-md",
                          isCurrentUser
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        )}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">
                          {message.message}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="border-t p-4">
            <div className="flex gap-2">
              <Input
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={sending}
                className="flex-1"
              />
              <Button onClick={handleSend} disabled={sending || !newMessage.trim()}>
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
