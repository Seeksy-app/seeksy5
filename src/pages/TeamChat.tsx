import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Send, Loader2, Users } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  user_id: string;
  message: string;
  created_at: string;
  profiles?: {
    account_full_name: string;
    account_avatar_url: string;
  };
}

interface OnlineUser {
  user_id: string;
  is_online: boolean;
  last_seen: string;
  profiles?: {
    account_full_name: string;
    account_avatar_url: string;
  };
}

export default function TeamChat() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [currentTeamId, setCurrentTeamId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (!currentUserId || !currentTeamId) return;

    loadMessages();
    loadOnlineUsers();
    updatePresence();

    // Set up realtime subscriptions filtered by team
    const messagesChannel = supabase
      .channel("team-messages")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "team_messages",
          filter: `team_id=eq.${currentTeamId}`,
        },
        () => {
          loadMessages();
        }
      )
      .subscribe();

    const presenceChannel = supabase
      .channel("user-presence")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_presence",
          filter: `team_id=eq.${currentTeamId}`,
        },
        () => {
          loadOnlineUsers();
        }
      )
      .subscribe();

    // Update presence every 30 seconds
    const presenceInterval = setInterval(updatePresence, 30000);

    // Update presence on page visibility change
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        updatePresence();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(presenceChannel);
      clearInterval(presenceInterval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      // Mark user as offline on unmount
      markOffline();
    };
  }, [currentUserId, currentTeamId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const checkAuth = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    
    setCurrentUserId(session.user.id);
    
    // Load user's team, create one if it doesn't exist
    let { data: teamData, error } = await supabase
      .from("teams")
      .select("id")
      .eq("owner_id", session.user.id)
      .maybeSingle();

    if (error) {
      console.error("Error loading team:", error);
      toast({
        title: "Error",
        description: "Failed to load team",
        variant: "destructive",
      });
      return;
    }

    if (teamData) {
      setCurrentTeamId(teamData.id);
    } else {
      // Create team for this user
      const { data: profile } = await supabase
        .from("profiles")
        .select("account_full_name, username")
        .eq("id", session.user.id)
        .single();

      const teamName = `${profile?.account_full_name || profile?.username || 'User'}'s Team`;
      
      const { data: newTeam, error: createError } = await supabase
        .from("teams")
        .insert({
          owner_id: session.user.id,
          name: teamName,
        })
        .select()
        .single();

      if (createError) {
        console.error("Error creating team:", createError);
        toast({
          title: "Error",
          description: "Failed to create team",
          variant: "destructive",
        });
        return;
      }

      // Add owner as team member
      await supabase
        .from("team_members")
        .insert({
          team_id: newTeam.id,
          user_id: session.user.id,
          role: 'owner',
        });

      setCurrentTeamId(newTeam.id);
    }
    setLoading(false);
  };

  const updatePresence = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || !currentTeamId) return;

    await supabase.from("user_presence").upsert({
      user_id: user.id,
      team_id: currentTeamId,
      last_seen: new Date().toISOString(),
      is_online: true,
    });
  };

  const markOffline = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || !currentTeamId) return;

    // @ts-ignore
    await supabase
      .from("user_presence")
      .update({
        is_online: false,
        last_seen: new Date().toISOString(),
      })
      .eq("user_id", user.id)
      .eq("team_id", currentTeamId);
  };

  const loadMessages = async () => {
    if (!currentTeamId) return;

    try {
      // @ts-ignore
      const { data, error } = await supabase
        .from("team_messages")
        .select("*")
        .eq("team_id", currentTeamId)
        .order("created_at", { ascending: true })
        .limit(100);

      if (error) throw error;

      // Fetch profile data separately
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map((m: any) => m.user_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, account_full_name, account_avatar_url")
          .in("id", userIds);

        const messagesWithProfiles = data.map((msg: any) => ({
          ...msg,
          profiles: profiles?.find((p: any) => p.id === msg.user_id),
        }));

        setMessages(messagesWithProfiles as Message[]);
      } else {
        setMessages([]);
      }
    } catch (error: any) {
      console.error("Error loading messages:", error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadOnlineUsers = async () => {
    if (!currentTeamId) return;

    try {
      const { data, error } = await supabase
        .from("user_presence")
        .select("*")
        .eq("team_id", currentTeamId)
        .order("is_online", { ascending: false })
        .order("last_seen", { ascending: false });

      if (error) throw error;

      // Fetch profile data separately
      if (data && data.length > 0) {
        const userIds = data.map((u: any) => u.user_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, account_full_name, account_avatar_url")
          .in("id", userIds);

        const usersWithProfiles = data.map((user: any) => ({
          ...user,
          profiles: profiles?.find((p: any) => p.id === user.user_id),
        }));

        setOnlineUsers(usersWithProfiles as OnlineUser[]);
      } else {
        setOnlineUsers([]);
      }
    } catch (error: any) {
      console.error("Error loading online users:", error);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentTeamId) return;

    setSending(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("team_messages").insert({
        user_id: user.id,
        team_id: currentTeamId,
        message: newMessage.trim(),
      });

      if (error) throw error;

      setNewMessage("");
    } catch (error: any) {
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Team Chat</h1>
          <p className="text-muted-foreground">
            Collaborate with your team in real-time
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Online Users Sidebar */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team Members
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {onlineUsers.map((user) => (
                <div
                  key={user.user_id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={user.profiles?.account_avatar_url}
                        alt={user.profiles?.account_full_name}
                      />
                      <AvatarFallback>
                        {user.profiles?.account_full_name?.charAt(0) || "U"}
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
                      {user.profiles?.account_full_name || "Unknown"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {user.is_online
                        ? "Active now"
                        : `Last seen ${formatDistanceToNow(new Date(user.last_seen), { addSuffix: true })}`}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Chat Area */}
          <Card className="lg:col-span-3 flex flex-col h-[calc(100vh-240px)]">
            <CardHeader className="border-b">
              <CardTitle>Messages</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((message) => {
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
                      <AvatarImage
                        src={message.profiles?.account_avatar_url}
                        alt={message.profiles?.account_full_name}
                      />
                      <AvatarFallback>
                        {message.profiles?.account_full_name?.charAt(0) || "U"}
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
                          {isCurrentUser
                            ? "You"
                            : message.profiles?.account_full_name || "Unknown"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(message.created_at), {
                            addSuffix: true,
                          })}
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
              })}
              <div ref={messagesEndRef} />
            </CardContent>
            <div className="border-t p-4">
              <form onSubmit={sendMessage} className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  disabled={sending}
                  className="flex-1"
                />
                <Button type="submit" disabled={sending || !newMessage.trim()}>
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </form>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
