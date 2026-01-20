import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  Video, VideoOff, Mic, MicOff, PhoneOff, 
  Monitor, MessageSquare, Users, Settings,
  Send, X, Volume2, VolumeX, Link, Copy, Check, Loader2,
  UserCheck, UserX, Bell
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { DeviceTestDialog } from "@/components/meeting/DeviceTestDialog";
import DailyIframe from "@daily-co/daily-js";

interface WaitingParticipant {
  id: string;
  name: string;
}

export default function SimpleMeetingStudio() {
  const { id } = useParams();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const callFrameRef = useRef<any>(null);
  
  const [isInitializing, setIsInitializing] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [showWaitingRoom, setShowWaitingRoom] = useState(false);
  const [showDeviceTest, setShowDeviceTest] = useState(true);
  const [chatMessage, setChatMessage] = useState("");
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);
  const [participantCount, setParticipantCount] = useState(1);
  const [waitingParticipants, setWaitingParticipants] = useState<WaitingParticipant[]>([]);
  const [selectedDevices, setSelectedDevices] = useState<{
    videoDeviceId: string | null;
    audioInputDeviceId: string | null;
    audioOutputDeviceId: string | null;
  } | null>(null);

  // Fetch meeting details
  const { data: meeting } = useQuery({
    queryKey: ["meeting-studio", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("meetings")
        .select(`*, meeting_attendees (*)`)
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch chat messages
  const { data: dbChatMessages = [] } = useQuery({
    queryKey: ["meeting-chat-studio", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("meeting_chat")
        .select("*")
        .eq("meeting_id", id)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  useEffect(() => {
    setChatMessages(dbChatMessages);
  }, [dbChatMessages]);

  // Subscribe to realtime chat
  useEffect(() => {
    if (!id) return;

    const channel = supabase
      .channel(`studio-chat-${id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "meeting_chat",
          filter: `meeting_id=eq.${id}`,
        },
        (payload) => {
          setChatMessages((prev) => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  const handleDeviceTestComplete = async (devices: {
    videoDeviceId: string | null;
    audioInputDeviceId: string | null;
    audioOutputDeviceId: string | null;
  }) => {
    setSelectedDevices(devices);
    setShowDeviceTest(false);
    
    // Initialize Daily.co room with waiting room enabled
    try {
      const { data, error } = await supabase.functions.invoke("daily-create-meeting-room", {
        body: {
          meetingId: id,
          meetingTitle: meeting?.title || "Meeting",
          enableWaitingRoom: true, // Enable waiting room
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      // Initialize Daily iframe
      if (containerRef.current) {
        const callFrame = DailyIframe.createFrame(containerRef.current, {
          iframeStyle: {
            width: "100%",
            height: "100%",
            border: "0",
            borderRadius: "12px",
          },
          showLeaveButton: true,
          showFullscreenButton: true,
          showLocalVideo: true,
          showParticipantsBar: true,
        });

        callFrameRef.current = callFrame;

        // Track participant count
        callFrame.on("participant-joined", () => {
          const participants = callFrame.participants();
          setParticipantCount(Object.keys(participants).length);
        });

        callFrame.on("participant-left", () => {
          const participants = callFrame.participants();
          setParticipantCount(Object.keys(participants).length);
        });

        // Handle waiting room "knocking" events
        callFrame.on("waiting-participant-added", (event: any) => {
          console.log("Waiting participant added:", event);
          const participant = event.participant;
          setWaitingParticipants(prev => [...prev, {
            id: participant.id,
            name: participant.name || "Guest",
          }]);
          toast.info(`${participant.name || "Someone"} is waiting to join`);
        });

        callFrame.on("waiting-participant-removed", (event: any) => {
          console.log("Waiting participant removed:", event);
          setWaitingParticipants(prev => 
            prev.filter(p => p.id !== event.participant.id)
          );
        });

        callFrame.on("left-meeting", () => {
          callFrame.destroy();
          navigate("/admin/meetings");
          toast.success("Meeting ended");
        });

        await callFrame.join({
          url: data.roomUrl,
          token: data.token,
        });

        setParticipantCount(1);
      }

      setIsInitializing(false);
    } catch (error: any) {
      console.error("Error initializing Daily:", error);
      toast.error(error.message || "Failed to start meeting");
      setIsInitializing(false);
    }
  };

  // Admit participant from waiting room
  const admitParticipant = async (participantId: string) => {
    if (callFrameRef.current) {
      try {
        await callFrameRef.current.updateWaitingParticipant(participantId, {
          grantRequestedAccess: true,
        });
        toast.success("Participant admitted");
      } catch (error) {
        console.error("Error admitting participant:", error);
        toast.error("Failed to admit participant");
      }
    }
  };

  // Reject participant from waiting room
  const rejectParticipant = async (participantId: string) => {
    if (callFrameRef.current) {
      try {
        await callFrameRef.current.updateWaitingParticipant(participantId, {
          grantRequestedAccess: false,
        });
        toast.success("Participant rejected");
      } catch (error) {
        console.error("Error rejecting participant:", error);
        toast.error("Failed to reject participant");
      }
    }
  };

  // Admit all waiting participants
  const admitAll = async () => {
    for (const participant of waitingParticipants) {
      await admitParticipant(participant.id);
    }
  };

  // Send chat message
  const sendMessage = async () => {
    if (!chatMessage.trim() || !id) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user?.id)
        .single();

      await supabase.from("meeting_chat").insert({
        meeting_id: id,
        sender_name: profile?.full_name || user?.email || "Host",
        sender_email: user?.email,
        message: chatMessage,
      });

      setChatMessage("");
    } catch (error: any) {
      toast.error("Failed to send message");
    }
  };

  // End meeting
  const endMeeting = async () => {
    try {
      if (callFrameRef.current) {
        await callFrameRef.current.leave();
        callFrameRef.current.destroy();
      }

      // Call end meeting function to cleanup Daily room
      await supabase.functions.invoke("daily-end-meeting", {
        body: {
          meetingId: id,
          roomName: meeting?.room_name,
        },
      });
    } catch (error) {
      console.error("Error ending meeting:", error);
    }
    
    navigate("/admin/meetings");
    toast.success("Meeting ended");
  };

  // Copy invite link
  const copyInviteLink = () => {
    const inviteLink = `${window.location.origin}/meetings/join/${id}`;
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    toast.success("Invite link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <DeviceTestDialog open={showDeviceTest} onContinue={handleDeviceTestComplete} />

      <div className="flex flex-col h-screen bg-zinc-950 fixed inset-0 z-50">
        {/* Header */}
        <div className="h-14 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <h1 className="text-white font-medium truncate max-w-[300px]">
              {meeting?.title || "Meeting"}
            </h1>
            <Badge variant="secondary" className="bg-red-500/20 text-red-400">
              Live
            </Badge>
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={copyInviteLink}
              className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
            >
              {copied ? <Check className="h-4 w-4 mr-2" /> : <Link className="h-4 w-4 mr-2" />}
              {copied ? "Copied!" : "Invite"}
            </Button>
            <span className="flex items-center gap-1 text-zinc-400 text-sm">
              <Users className="h-4 w-4" />
              {participantCount}
            </span>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex">
          {/* Video area */}
          <div className="flex-1 flex flex-col">
            <div className="flex-1 p-4 relative">
              {isInitializing && !showDeviceTest ? (
                <div className="absolute inset-4 flex items-center justify-center bg-zinc-900 rounded-xl">
                  <div className="text-center text-zinc-400">
                    <Loader2 className="h-12 w-12 mx-auto mb-3 animate-spin" />
                    <p>Starting meeting...</p>
                  </div>
                </div>
              ) : (
                <div 
                  ref={containerRef} 
                  className="w-full h-full rounded-xl overflow-hidden bg-zinc-900"
                />
              )}
            </div>

            {/* Controls */}
            <div className="h-20 bg-zinc-900 border-t border-zinc-800 flex items-center justify-center gap-3">
              {/* Waiting Room Button */}
              <Button
                variant={showWaitingRoom ? "default" : "secondary"}
                size="icon"
                className="h-12 w-12 rounded-full relative"
                onClick={() => setShowWaitingRoom(!showWaitingRoom)}
              >
                <Bell className="h-5 w-5" />
                {waitingParticipants.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {waitingParticipants.length}
                  </span>
                )}
              </Button>

              <Button
                variant={showChat ? "default" : "secondary"}
                size="icon"
                className="h-12 w-12 rounded-full"
                onClick={() => setShowChat(!showChat)}
              >
                <MessageSquare className="h-5 w-5" />
              </Button>

              <Button
                variant="destructive"
                size="icon"
                className="h-12 w-12 rounded-full"
                onClick={endMeeting}
              >
                <PhoneOff className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Waiting Room sidebar */}
          {showWaitingRoom && (
            <div className="w-80 bg-zinc-900 border-l border-zinc-800 flex flex-col">
              <div className="h-14 flex items-center justify-between px-4 border-b border-zinc-800">
                <h2 className="text-white font-medium">Waiting Room</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowWaitingRoom(false)}
                  className="text-zinc-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <ScrollArea className="flex-1 p-4">
                {waitingParticipants.length === 0 ? (
                  <p className="text-zinc-500 text-center text-sm">No one is waiting</p>
                ) : (
                  <div className="space-y-3">
                    {waitingParticipants.map((participant) => (
                      <div key={participant.id} className="bg-zinc-800 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-white font-medium">{participant.name}</span>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-green-400 hover:text-green-300 hover:bg-green-500/20"
                              onClick={() => admitParticipant(participant.id)}
                            >
                              <UserCheck className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                              onClick={() => rejectParticipant(participant.id)}
                            >
                              <UserX className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>

              {waitingParticipants.length > 0 && (
                <div className="p-3 border-t border-zinc-800">
                  <Button 
                    className="w-full" 
                    onClick={admitAll}
                  >
                    Admit All ({waitingParticipants.length})
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Chat sidebar */}
          {showChat && (
            <div className="w-80 bg-zinc-900 border-l border-zinc-800 flex flex-col">
              <div className="h-14 flex items-center justify-between px-4 border-b border-zinc-800">
                <h2 className="text-white font-medium">Chat</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowChat(false)}
                  className="text-zinc-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <ScrollArea className="flex-1 p-4">
                {chatMessages.length === 0 ? (
                  <p className="text-zinc-500 text-center text-sm">No messages yet</p>
                ) : (
                  <div className="space-y-3">
                    {chatMessages.map((msg: any, idx: number) => (
                      <div key={msg.id || idx} className="text-sm">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-white">{msg.sender_name}</span>
                          <span className="text-xs text-zinc-500">
                            {format(new Date(msg.created_at), "h:mm a")}
                          </span>
                        </div>
                        <p className="text-zinc-300">{msg.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>

              <div className="p-3 border-t border-zinc-800">
                <div className="flex gap-2">
                  <Input
                    placeholder="Type a message..."
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                  <Button size="icon" onClick={sendMessage} disabled={!chatMessage.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
