import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Video, Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { StudioPreferenceModal } from "@/components/meetings/StudioPreferenceModal";

export default function MeetNow() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [attendees, setAttendees] = useState<{ name: string; email: string }[]>([]);
  const [currentName, setCurrentName] = useState("");
  const [currentEmail, setCurrentEmail] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [showStudioModal, setShowStudioModal] = useState(false);
  const [studioPreference, setStudioPreference] = useState<"simple" | "podcast" | null>(null);
  const [pendingMeetingId, setPendingMeetingId] = useState<string | null>(null);

  // Check if user has a studio preference on load
  useEffect(() => {
    const checkPreference = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("user_preferences")
        .select("meeting_studio_preference")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data?.meeting_studio_preference) {
        setStudioPreference(data.meeting_studio_preference as "simple" | "podcast");
      }
    };
    checkPreference();
  }, []);

  const addAttendee = () => {
    if (!currentName.trim() || !currentEmail.trim()) {
      toast.error("Please enter both name and email");
      return;
    }

    if (!/\S+@\S+\.\S+/.test(currentEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setAttendees([...attendees, { name: currentName, email: currentEmail }]);
    setCurrentName("");
    setCurrentEmail("");
  };

  const removeAttendee = (index: number) => {
    setAttendees(attendees.filter((_, i) => i !== index));
  };

  const navigateToStudio = (meetingId: string, preference: "simple" | "podcast") => {
    if (preference === "podcast") {
      navigate(`/meeting-studio/${meetingId}`);
    } else {
      navigate(`/meetings/studio/${meetingId}`);
    }
  };

  const handleStudioSelect = (preference: "simple" | "podcast") => {
    setStudioPreference(preference);
    setShowStudioModal(false);
    if (pendingMeetingId) {
      navigateToStudio(pendingMeetingId, preference);
    }
  };

  const handleStartMeeting = async () => {
    if (!title.trim()) {
      toast.error("Please enter a meeting title");
      return;
    }

    setIsCreating(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const now = new Date();
      const endTime = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now

      // Create meeting
      const { data: meeting, error: meetingError } = await supabase
        .from("meetings")
        .insert([{
          user_id: user.id,
          title,
          start_time: now.toISOString(),
          end_time: endTime.toISOString(),
          status: "scheduled",
          location_type: "seeksy_studio",
          location_details: "Seeksy Meeting Studio",
        }])
        .select()
        .single();

      if (meetingError) throw meetingError;

      // Add attendees if any
      if (attendees.length > 0) {
        const { error: attendeesError } = await supabase
          .from("meeting_attendees")
          .insert(
            attendees.map(attendee => ({
              meeting_id: meeting.id,
              attendee_name: attendee.name,
              attendee_email: attendee.email,
              rsvp_status: "awaiting"
            }))
          );

        if (attendeesError) throw attendeesError;

        // Send invitations via edge function
        try {
          await supabase.functions.invoke("send-meeting-invitation", {
            body: {
              meetingId: meeting.id,
              hostEmail: user.email,
              attendees: attendees.map(a => ({
                name: a.name,
                email: a.email
              })),
              meetingDetails: {
                title,
                startTime: now.toISOString(),
                endTime: endTime.toISOString()
              }
            }
          });
        } catch (inviteError) {
          console.error("Failed to send invitations:", inviteError);
          toast.warning("Meeting created but invitations may not have been sent");
        }
      }

      toast.success("Meeting created! Starting...");
      
      // If no preference set, show modal
      if (!studioPreference) {
        setPendingMeetingId(meeting.id);
        setShowStudioModal(true);
      } else {
        navigateToStudio(meeting.id, studioPreference);
      }
      
    } catch (error: any) {
      console.error("Error creating meeting:", error);
      toast.error("Failed to create meeting: " + error.message);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="container max-w-3xl mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-6 w-6" />
            Meet Now
          </CardTitle>
          <CardDescription>
            Start an instant meeting with just a title and attendees
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Meeting Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Meeting Title *</Label>
            <Input
              id="title"
              placeholder="Quick sync, Team standup, etc."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Add Attendees */}
          <div className="space-y-4">
            <Label>Attendees (Optional)</Label>
            
            {/* Current Attendee List */}
            {attendees.length > 0 && (
              <div className="space-y-2">
                {attendees.map((attendee, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-muted rounded-md"
                  >
                    <div>
                      <p className="font-medium">{attendee.name}</p>
                      <p className="text-sm text-muted-foreground">{attendee.email}</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeAttendee(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Add New Attendee Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                placeholder="Attendee name"
                value={currentName}
                onChange={(e) => setCurrentName(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && addAttendee()}
              />
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="Email address"
                  value={currentEmail}
                  onChange={(e) => setCurrentEmail(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && addAttendee()}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  onClick={addAttendee}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => navigate("/meetings")}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleStartMeeting}
              disabled={isCreating}
              className="flex-1"
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating Meeting...
                </>
              ) : (
                <>
                  <Video className="h-4 w-4 mr-2" />
                  Start Meeting Now
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Studio Preference Modal */}
      <StudioPreferenceModal 
        open={showStudioModal} 
        onSelect={handleStudioSelect}
      />
    </div>
  );
}
