import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Calendar, Clock, MapPin, Check, X } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface MeetingData {
  meeting_id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  location_type: string;
  location_details: string;
  attendee_name: string;
  attendee_email: string;
  attendee_id: string;
  current_rsvp_status: string;
}

const MeetingRSVP = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");
  
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState(false);
  const [meetingData, setMeetingData] = useState<MeetingData | null>(null);
  const [responded, setResponded] = useState(false);
  const [responseType, setResponseType] = useState<'attending' | 'not_attending' | 'maybe'>('attending');

  useEffect(() => {
    if (token) {
      loadMeetingData();
    } else {
      toast.error("Invalid RSVP link");
      navigate("/");
    }
  }, [token]);

  const loadMeetingData = async () => {
    try {
      const { data: attendeeData, error: attendeeError } = await supabase
        .from("meeting_attendees")
        .select(`
          id,
          attendee_name,
          attendee_email,
          rsvp_status,
          meeting_id,
          meetings (
            id,
            title,
            description,
            start_time,
            end_time,
            location_type,
            location_details
          )
        `)
        .eq("rsvp_token", token)
        .single();

      if (attendeeError) throw attendeeError;

      const meeting = (attendeeData as any).meetings;
      setMeetingData({
        meeting_id: meeting.id,
        title: meeting.title,
        description: meeting.description,
        start_time: meeting.start_time,
        end_time: meeting.end_time,
        location_type: meeting.location_type,
        location_details: meeting.location_details,
        attendee_name: attendeeData.attendee_name,
        attendee_email: attendeeData.attendee_email,
        attendee_id: attendeeData.id,
        current_rsvp_status: attendeeData.rsvp_status || 'awaiting',
      });
    } catch (error: any) {
      console.error("Error loading meeting:", error);
      toast.error("Failed to load meeting details");
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const handleRSVP = async (status: 'attending' | 'not_attending' | 'maybe') => {
    if (!meetingData || !token) return;
    
    setResponding(true);
    setResponseType(status);

    try {
      const { error } = await supabase
        .from("meeting_attendees")
        .update({
          rsvp_status: status,
          rsvp_timestamp: new Date().toISOString(),
          rsvp_method: 'email',
        })
        .eq("rsvp_token", token);

      if (error) throw error;

      setResponded(true);
      toast.success(`You have responded: ${status === 'attending' ? 'Attending' : status === 'not_attending' ? 'Not Attending' : 'Maybe'}`);
    } catch (error: any) {
      console.error("Error updating RSVP:", error);
      toast.error("Failed to update RSVP");
    } finally {
      setResponding(false);
    }
  };

  const getLocationLabel = (locationType: string) => {
    const labels: Record<string, string> = {
      phone: "Phone Call",
      zoom: "Zoom",
      teams: "Microsoft Teams",
      meet: "Google Meet",
      "in-person": "In-Person",
      custom: "Custom Link",
      seeksy_studio: "Seeksy Studio",
    };
    return labels[locationType] || locationType;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!meetingData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Meeting Not Found</CardTitle>
            <CardDescription>This meeting invitation is invalid or has expired.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (responded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <div className="flex flex-col items-center">
              <div className={`h-16 w-16 rounded-full flex items-center justify-center mb-4 ${
                responseType === 'attending' ? 'bg-green-100' : 
                responseType === 'not_attending' ? 'bg-red-100' : 
                'bg-yellow-100'
              }`}>
                {responseType === 'attending' ? (
                  <Check className="h-8 w-8 text-green-600" />
                ) : responseType === 'not_attending' ? (
                  <X className="h-8 w-8 text-red-600" />
                ) : (
                  <span className="text-2xl">🤔</span>
                )}
              </div>
              <CardTitle className="text-center">Response Recorded!</CardTitle>
              <CardDescription className="text-center mt-2">
                Your RSVP has been sent to the meeting host.
                {responseType === 'attending' && " We look forward to seeing you!"}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{format(new Date(meetingData.start_time), "EEEE, MMMM d, yyyy")}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>
                  {format(new Date(meetingData.start_time), "h:mm a")} - {format(new Date(meetingData.end_time), "h:mm a")}
                </span>
              </div>
              {meetingData.location_details && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="break-all">{meetingData.location_details}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader>
          <CardTitle className="text-2xl">{meetingData.title}</CardTitle>
          <CardDescription>
            Hi {meetingData.attendee_name}, please respond to this meeting invitation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {meetingData.description && (
            <p className="text-sm text-muted-foreground">{meetingData.description}</p>
          )}

          <div className="space-y-3 bg-muted p-4 rounded-lg">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">{format(new Date(meetingData.start_time), "EEEE, MMMM d, yyyy")}</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(meetingData.start_time), "h:mm a")} - {format(new Date(meetingData.end_time), "h:mm a")}
                  {" "}
                  {new Date(meetingData.start_time).toLocaleTimeString('en-US', { 
                    timeZoneName: 'short' 
                  }).split(' ').pop()}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">{getLocationLabel(meetingData.location_type)}</p>
                {meetingData.location_details && (
                  <p className="text-sm text-muted-foreground break-all">{meetingData.location_details}</p>
                )}
              </div>
            </div>
          </div>

          {meetingData.current_rsvp_status !== 'awaiting' && (
            <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
              <p className="text-sm text-blue-800">
                You previously responded: <strong>{meetingData.current_rsvp_status}</strong>
              </p>
              <p className="text-xs text-blue-600 mt-1">You can update your response below</p>
            </div>
          )}

          <div className="space-y-3">
            <p className="font-medium">Will you attend this meeting?</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Button
                size="lg"
                variant="default"
                className="bg-green-600 hover:bg-green-700"
                onClick={() => handleRSVP('attending')}
                disabled={responding}
              >
                {responding && responseType === 'attending' ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Check className="h-4 w-4 mr-2" />
                )}
                Yes
              </Button>
              <Button
                size="lg"
                variant="destructive"
                onClick={() => handleRSVP('not_attending')}
                disabled={responding}
              >
                {responding && responseType === 'not_attending' ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <X className="h-4 w-4 mr-2" />
                )}
                No
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => handleRSVP('maybe')}
                disabled={responding}
              >
                {responding && responseType === 'maybe' ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <span className="mr-2">🤔</span>
                )}
                Maybe
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MeetingRSVP;
