import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Calendar as CalendarIcon, MessageSquare } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { format } from "date-fns";
import { ContactSelector } from "@/components/meetings/ContactSelector";
import { Checkbox } from "@/components/ui/checkbox";
import { useCredits } from "@/hooks/useCredits";

interface MeetingType {
  id: string;
  name: string;
  duration: number;
  location_type: string;
  custom_location_url: string | null;
}

interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string | null;
}

const CreateMeeting = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const { deductCredit, isDeducting } = useCredits();
  const [meetingTypes, setMeetingTypes] = useState<MeetingType[]>([]);
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [microsoftConnected, setMicrosoftConnected] = useState(false);
  const [zoomConnected, setZoomConnected] = useState(false);
  
  const [selectedMeetingType, setSelectedMeetingType] = useState<string>("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState("30");
  const [locationType, setLocationType] = useState("zoom");
  const [locationDetails, setLocationDetails] = useState("");
  const [attendeeName, setAttendeeName] = useState("");
  const [attendeeEmail, setAttendeeEmail] = useState("");
  const [attendeePhone, setAttendeePhone] = useState("");
  const [smsConsent, setSmsConsent] = useState(false);
  const [createCalendarEvent, setCreateCalendarEvent] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState<Contact[]>([]);
  const [sendSmsToAll, setSendSmsToAll] = useState(false);
  const [smsMessage, setSmsMessage] = useState("");
  
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        loadMeetingTypes(session.user.id);
      }
    });
  }, [navigate]);

  const loadMeetingTypes = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("meeting_types")
        .select("*")
        .eq("user_id", userId)
        .eq("is_active", true);

      if (error) throw error;
      setMeetingTypes(data || []);

      // Check calendar connection
      const { data: calendarData } = await supabase
        .from("calendar_connections")
        .select("*")
        .eq("user_id", userId)
        .eq("provider", "google")
        .single();

      if (calendarData) {
        setCalendarConnected(true);
        setCreateCalendarEvent(true); // Default to creating calendar event if connected
      }

      // Check Zoom connection
      const { data: zoomData } = await supabase
        .from("zoom_connections")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (zoomData) {
        setZoomConnected(true);
      }

      // Check Microsoft connection
      const { data: microsoftData } = await supabase
        .from("microsoft_connections")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (microsoftData) {
        setMicrosoftConnected(true);
      }
    } catch (error: any) {
      toast({
        title: "Error loading meeting types",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleMeetingTypeChange = (typeId: string) => {
    setSelectedMeetingType(typeId);
    
    if (typeId === "custom") {
      setTitle("");
      setDuration("30");
      setLocationType("zoom");
      setLocationDetails("");
      return;
    }

    const selectedType = meetingTypes.find(t => t.id === typeId);
    if (selectedType) {
      setTitle(selectedType.name);
      setDuration(selectedType.duration.toString());
      setLocationType(selectedType.location_type);
      setLocationDetails(selectedType.custom_location_url || "");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate that we have either selected contacts or manual attendee info
    const hasAttendees = selectedContacts.length > 0 || (attendeeName && attendeeEmail);
    
    if (!date || !time || !hasAttendees) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields and add at least one attendee",
        variant: "destructive",
      });
      return;
    }

    // Combine date and time - CRITICAL: Handle timezone properly
    const [hours, minutes] = time.split(':');
    const startTime = new Date(date);
    startTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    // Check if meeting is in the past
    const now = new Date();
    if (startTime < now) {
      toast({
        title: "Invalid time",
        description: "Cannot schedule a meeting in the past. Please select a future date and time.",
        variant: "destructive",
      });
      return;
    }
    
    // Calculate end time by adding duration
    const endTime = new Date(startTime);
    endTime.setMinutes(endTime.getMinutes() + parseInt(duration));
    
    // Log for debugging with timezone info
    console.log("Creating meeting:", {
      localTime: startTime.toString(),
      utcTime: startTime.toISOString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timezoneOffset: startTime.getTimezoneOffset(),
      nowLocal: now.toString(),
      nowUTC: now.toISOString(),
    });

    setLoading(true);

    try {
      // Deduct credit for creating meeting
      await deductCredit("create_meeting", `Created meeting: ${title}`);

      // Build attendee list
      const attendees = selectedContacts.length > 0 
        ? selectedContacts 
        : [{ name: attendeeName, email: attendeeEmail, phone: attendeePhone }];

      // Create a meeting for each attendee
      const meetingPromises = attendees.map(async (attendee) => {
        let finalLocationDetails = locationDetails;

        // Create Zoom meeting if locationType is zoom and Zoom is connected
        if (locationType === 'zoom' && zoomConnected) {
          try {
            const { data: zoomData, error: zoomError } = await supabase.functions.invoke('zoom-create-meeting', {
              body: {
                title,
                description,
                startTime: startTime.toISOString(),
                duration: parseInt(duration),
                attendeeEmail: attendee.email,
                attendeeName: attendee.name,
              },
            });

            if (zoomError) throw zoomError;

            if (zoomData?.joinUrl) {
              finalLocationDetails = zoomData.joinUrl;
            }
          } catch (zoomError) {
            console.error('Zoom meeting creation failed:', zoomError);
          }
        }

        // Create meeting first
        const { data: meetingData, error } = await supabase.from("meetings").insert([
          {
            user_id: user?.id,
            title,
            description: description || null,
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
            location_type: locationType as "phone" | "zoom" | "teams" | "meet" | "in-person" | "custom" | "seeksy_studio",
            location_details: finalLocationDetails || null,
            meeting_type_id: selectedMeetingType && selectedMeetingType !== "custom" ? selectedMeetingType : null,
            status: "scheduled",
          },
        ])
        .select()
        .single();

        if (error) throw error;

        // Insert attendee record
        const { error: attendeeError } = await supabase
          .from("meeting_attendees")
          .insert({
            meeting_id: meetingData.id,
            attendee_name: attendee.name,
            attendee_email: attendee.email,
            attendee_phone: attendee.phone || null,
            rsvp_status: 'awaiting',
          });

        if (attendeeError) throw attendeeError;

        // Store SMS consent if phone provided (contacts from DB already have implicit consent)
        if (attendee.phone) {
          const isFromContactList = selectedContacts.some(c => c.email === attendee.email);
          try {
            await supabase.from("sms_consent_records").insert({
              phone_number: attendee.phone,
              consent_given: true,
              consent_text: isFromContactList 
                ? "Contact from admin contact list" 
                : "Manual entry for admin meeting creation",
              consent_method: isFromContactList 
                ? "admin_contact_selection" 
                : "admin_meeting_form",
              ip_address: null,
              user_agent: navigator.userAgent,
            });
          } catch (consentError) {
            console.error("Error storing SMS consent:", consentError);
          }
        }

        // Send email confirmation to attendee
        if (attendee.email && meetingData?.id) {
          try {
            await supabase.functions.invoke("send-meeting-confirmation-email", {
              body: {
                attendeeEmail: attendee.email,
                attendeeName: attendee.name,
                meetingTitle: title,
                startTime: startTime.toISOString(),
                endTime: endTime.toISOString(),
                locationType: locationType,
                locationDetails: finalLocationDetails,
                description: description,
                userId: user?.id,
                meetingId: meetingData.id,
              },
            });
            console.log("Meeting confirmation email sent to:", attendee.email);
          } catch (emailError) {
            console.error("Error sending email:", emailError);
          }
        }

        // Send SMS if requested and phone available
        if (sendSmsToAll && attendee.phone && meetingData?.id) {
          try {
            // Send custom SMS message if provided, otherwise send confirmation
            if (smsMessage) {
              await supabase.functions.invoke("send-sms", {
                body: { 
                  phoneNumber: attendee.phone,
                  message: smsMessage,
                },
              });
            } else {
              await supabase.functions.invoke("send-meeting-confirmation-sms", {
                body: { meetingId: meetingData.id },
              });
            }
          } catch (smsError) {
            console.error("Error sending SMS:", smsError);
          }
        }

        // Create calendar event if requested and calendar is connected
        if ((createCalendarEvent && calendarConnected) || (locationType === 'meet' && calendarConnected)) {
          try {
            await supabase.functions.invoke('google-calendar-create-event', {
              headers: {
                Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
              },
              body: {
                title,
                description,
                startTime: startTime.toISOString(),
                endTime: endTime.toISOString(),
                attendeeEmail: attendee.email,
                attendeeName: attendee.name,
                location: finalLocationDetails || locationType,
                userId: user?.id,
              },
            });
          } catch (calendarError) {
            console.error("Calendar event creation failed:", calendarError);
          }
        }

        return meetingData;
      });

      await Promise.all(meetingPromises);

      toast({
        title: "Success!",
        description: `${attendees.length} meeting(s) created successfully`,
      });

      navigate("/meetings");
    } catch (error: any) {
      console.error("Error creating meeting:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create meeting",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-12 max-w-3xl">
        <Button
          variant="ghost"
          onClick={() => navigate("/meetings")}
          className="mb-4"
        >
          ← Back to Meetings
        </Button>

        <Card className="p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">Schedule Meeting</h1>
            <p className="text-muted-foreground mt-1">
              Create a new meeting using a template or customize your own
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="meetingType">Meeting Type (Optional)</Label>
              <Select value={selectedMeetingType} onValueChange={handleMeetingTypeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a meeting type or customize" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom">Custom Meeting</SelectItem>
                  {meetingTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name} ({type.duration} min)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Meeting Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Quick Sync Call"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add meeting details or agenda"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="time">Time *</Label>
                <Input
                  id="time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="45">45 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="90">1.5 hours</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="locationType">Location Type</Label>
              <Select value={locationType} onValueChange={setLocationType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="seeksy_studio">Seeksy Studio</SelectItem>
                  <SelectItem value="zoom">
                    Zoom {zoomConnected && '✓ Connected'}
                  </SelectItem>
                  <SelectItem value="meet">
                    Google Meet {calendarConnected && '✓ Connected'}
                  </SelectItem>
                  <SelectItem value="teams">
                    Microsoft Teams {microsoftConnected && '✓ Connected'}
                  </SelectItem>
                  <SelectItem value="phone">Phone Call</SelectItem>
                  <SelectItem value="in-person">In-Person</SelectItem>
                  <SelectItem value="custom">Custom Link</SelectItem>
                </SelectContent>
              </Select>
              {locationType === 'zoom' && !zoomConnected && (
                <p className="text-sm text-muted-foreground">
                  Connect Zoom in <button onClick={() => navigate('/integrations')} className="text-primary underline">Integrations</button> to auto-generate meeting links
                </p>
              )}
              {locationType === 'zoom' && zoomConnected && (
                <p className="text-sm text-green-600 dark:text-green-400">
                  Zoom link will be automatically generated
                </p>
              )}
              {locationType === 'meet' && !calendarConnected && (
                <p className="text-sm text-muted-foreground">
                  Connect Google Calendar in <button onClick={() => navigate('/integrations')} className="text-primary underline">Integrations</button> to auto-generate Meet links
                </p>
              )}
              {locationType === 'meet' && calendarConnected && (
                <p className="text-sm text-green-600 dark:text-green-400">
                  Google Meet link will be automatically generated
                </p>
              )}
              {locationType === 'teams' && !microsoftConnected && (
                <p className="text-sm text-muted-foreground">
                  Connect Microsoft in <button onClick={() => navigate('/integrations')} className="text-primary underline">Integrations</button> to auto-generate Teams links
                </p>
              )}
              {locationType === 'teams' && microsoftConnected && (
                <p className="text-sm text-green-600 dark:text-green-400">
                  Microsoft Teams link will be automatically generated
                </p>
              )}
            </div>

            {((locationType === "custom" || locationType === "in-person") || (locationType === "zoom" && !zoomConnected) || (locationType === "meet" && !calendarConnected) || (locationType === "teams" && !microsoftConnected)) && (
              <div className="space-y-2">
                <Label htmlFor="locationDetails">
                  {locationType === "in-person" ? "Location Address" : 
                   locationType === "zoom" ? "Zoom Link" :
                   locationType === "meet" ? "Google Meet Link" :
                   locationType === "teams" ? "Microsoft Teams Link" :
                   "Meeting Link"}
                </Label>
                <Input
                  id="locationDetails"
                  value={locationDetails}
                  onChange={(e) => setLocationDetails(e.target.value)}
                  placeholder={
                    locationType === "in-person"
                      ? "Enter address"
                      : locationType === "zoom"
                      ? "Enter your Zoom link"
                      : locationType === "meet"
                      ? "Enter your Google Meet link"
                      : locationType === "teams"
                      ? "Enter your Microsoft Teams link"
                      : "Enter meeting link"
                  }
                />
              </div>
            )}

            <div className="border-t pt-6 mt-6">
              <h3 className="text-lg font-semibold mb-4">Attendee Information</h3>
              
              <div className="space-y-4">
                {/* Contact Selector for multiple attendees */}
                {user && (
                  <ContactSelector
                    userId={user.id}
                    selectedContacts={selectedContacts}
                    onSelectContacts={setSelectedContacts}
                  />
                )}

                {/* Optional manual entry if no contacts selected */}
                {selectedContacts.length === 0 && (
                  <>
                    <div className="text-sm text-muted-foreground text-center py-2">
                      Or manually enter attendee information
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="attendeeName">Attendee Name *</Label>
                      <Input
                        id="attendeeName"
                        value={attendeeName}
                        onChange={(e) => setAttendeeName(e.target.value)}
                        placeholder="Enter attendee name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="attendeeEmail">Attendee Email *</Label>
                      <Input
                        id="attendeeEmail"
                        type="email"
                        value={attendeeEmail}
                        onChange={(e) => setAttendeeEmail(e.target.value)}
                        placeholder="attendee@example.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="attendeePhone">Attendee Phone</Label>
                      <Input
                        id="attendeePhone"
                        type="tel"
                        value={attendeePhone}
                        onChange={(e) => setAttendeePhone(e.target.value)}
                        placeholder="(Optional)"
                      />
                    </div>
                  </>
                )}

                {/* SMS Messaging Options */}
                {(selectedContacts.some(c => c.phone) || attendeePhone) && (
                  <div className="border-t pt-4 mt-4 space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="send-sms"
                        checked={sendSmsToAll}
                        onCheckedChange={(checked) => setSendSmsToAll(checked as boolean)}
                      />
                      <Label htmlFor="send-sms" className="cursor-pointer">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4" />
                          Send SMS notification to attendees
                        </div>
                      </Label>
                    </div>

                    {sendSmsToAll && (
                      <div className="space-y-2">
                        <Label htmlFor="smsMessage">Custom SMS Message (Optional)</Label>
                        <Textarea
                          id="smsMessage"
                          value={smsMessage}
                          onChange={(e) => setSmsMessage(e.target.value)}
                          placeholder="Leave blank for default meeting confirmation SMS, or enter a custom message..."
                          rows={3}
                        />
                        <p className="text-xs text-muted-foreground">
                          If left blank, attendees will receive a standard meeting confirmation SMS.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {calendarConnected && (
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg border">
                <div className="space-y-0.5">
                  <Label htmlFor="create-calendar-event">Create Calendar Event</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically add this meeting to your Google Calendar
                  </p>
                </div>
                <Switch
                  id="create-calendar-event"
                  checked={createCalendarEvent}
                  onCheckedChange={setCreateCalendarEvent}
                />
              </div>
            )}

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/meetings")}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading || isDeducting} className="flex-1">
                {loading || isDeducting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Scheduling...
                  </>
                ) : (
                  "Schedule Meeting"
                )}
              </Button>
            </div>
          </form>
        </Card>
      </main>
    </div>
  );
};

export default CreateMeeting;
