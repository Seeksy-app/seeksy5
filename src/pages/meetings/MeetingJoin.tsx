import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Video, Loader2, Users } from "lucide-react";
import { toast } from "sonner";
import DailyIframe from "@daily-co/daily-js";

export default function MeetingJoin() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [inMeeting, setInMeeting] = useState(false);
  const [roomUrl, setRoomUrl] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [meetingTitle, setMeetingTitle] = useState<string>("");
  const [meetingError, setMeetingError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const callFrameRef = useRef<any>(null);

  // Check if user is authenticated
  const { data: user } = useQuery({
    queryKey: ["current-user-join"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  // Fetch meeting via edge function (bypasses RLS for guests)
  useEffect(() => {
    const fetchMeeting = async () => {
      if (!id) return;
      
      try {
        // Try to get meeting info via the join function with a "check" mode
        const { data, error } = await supabase.functions.invoke("daily-get-meeting-info", {
          body: { meetingId: id },
        });

        if (error || data?.error) {
          // Fallback: try direct query for authenticated users
          const { data: meeting, error: dbError } = await supabase
            .from("meetings")
            .select("id, title, room_name, is_active")
            .eq("id", id)
            .maybeSingle();

          if (dbError || !meeting) {
            setMeetingError("Meeting not found");
          } else {
            setMeetingTitle(meeting.title || "Meeting");
            if (!meeting.room_name) {
              setMeetingError("Waiting for host to start the meeting");
            }
          }
        } else {
          setMeetingTitle(data.title || "Meeting");
          if (!data.roomName) {
            setMeetingError("Waiting for host to start the meeting");
          }
        }
      } catch (err) {
        // Final fallback - show join form anyway
        setMeetingTitle("Meeting");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMeeting();
  }, [id]);

  const handleJoin = async () => {
    if (!user && (!guestName.trim() || !guestEmail.trim())) {
      toast.error("Please enter your name and email");
      return;
    }

    setIsJoining(true);
    try {
      const { data, error } = await supabase.functions.invoke("daily-join-meeting", {
        body: {
          meetingId: id,
          guestName: guestName.trim(),
          guestEmail: guestEmail.trim(),
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setRoomUrl(data.roomUrl);
      setToken(data.token);
      setMeetingTitle(data.meetingTitle || meetingTitle);
      setInMeeting(true);
    } catch (error: any) {
      console.error("Join error:", error);
      toast.error(error.message || "Failed to join meeting");
    } finally {
      setIsJoining(false);
    }
  };

  // Initialize Daily.co when we have room URL and token
  useEffect(() => {
    if (!inMeeting || !roomUrl || !token || !containerRef.current) return;

    const initDaily = async () => {
      try {
        const callFrame = DailyIframe.createFrame(containerRef.current!, {
          iframeStyle: {
            width: "100%",
            height: "100%",
            border: "0",
            borderRadius: "12px",
          },
          showLeaveButton: true,
          showFullscreenButton: true,
        });

        callFrameRef.current = callFrame;

        callFrame.on("left-meeting", () => {
          callFrame.destroy();
          navigate("/");
          toast.success("You left the meeting");
        });

        await callFrame.join({
          url: roomUrl,
          token: token,
        });
      } catch (error) {
        console.error("Daily error:", error);
        toast.error("Failed to connect to meeting");
      }
    };

    initDaily();

    return () => {
      if (callFrameRef.current) {
        callFrameRef.current.destroy();
      }
    };
  }, [inMeeting, roomUrl, token, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (meetingError === "Meeting not found") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">Meeting not found</p>
            <Button className="mt-4" onClick={() => navigate("/")}>
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show video meeting view
  if (inMeeting) {
    return (
      <div className="fixed inset-0 bg-zinc-950 z-50">
        <div ref={containerRef} className="w-full h-full" />
      </div>
    );
  }

  // Show join form
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Video className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">{meetingTitle}</CardTitle>
          <CardDescription>
            You're about to join this meeting
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!user && (
            <>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Your Name
                </label>
                <Input
                  placeholder="Enter your name"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Your Email
                </label>
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                />
              </div>
            </>
          )}

          {user && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Joining as</p>
              <p className="font-medium">{user.email}</p>
            </div>
          )}

          <Button
            className="w-full"
            size="lg"
            onClick={handleJoin}
            disabled={isJoining || (!user && (!guestName.trim() || !guestEmail.trim()))}
          >
            {isJoining ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Joining...
              </>
            ) : (
              <>
                <Users className="h-4 w-4 mr-2" />
                Join Meeting
              </>
            )}
          </Button>

          {meetingError === "Waiting for host to start the meeting" && (
            <p className="text-sm text-amber-500 text-center">
              Waiting for host to start the meeting...
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
