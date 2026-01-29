import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Clock, MapPin, Calendar, ArrowLeft, Check } from "lucide-react";
import { format, addDays, startOfDay, setHours, setMinutes } from "date-fns";

interface MeetingType {
  id: string;
  user_id: string;
  name: string;
  description: string;
  duration: number;
  location_type: string;
  custom_location_url: string;
  pre_meeting_questions: any;
}

interface Profile {
  id: string;
  username: string;
  full_name: string;
  theme_color: string;
}

const BookMeetingSlot = () => {
  const { username, meetingTypeId } = useParams();
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [meetingType, setMeetingType] = useState<MeetingType | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [busySlots, setBusySlots] = useState<Array<{start: string, end: string}>>([]);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  
  // Form fields
  const [attendeeName, setAttendeeName] = useState("");
  const [attendeeEmail, setAttendeeEmail] = useState("");
  const [attendeePhone, setAttendeePhone] = useState("");
  const [notes, setNotes] = useState("");
  const [questionResponses, setQuestionResponses] = useState<Record<string, string>>({});
  const [smsConsent, setSmsConsent] = useState(false);
  
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (username && meetingTypeId) {
      loadData();
    }
  }, [username, meetingTypeId]);

  useEffect(() => {
    if (meetingType && profile) {
      generateAvailableSlots();
    }
  }, [selectedDate, meetingType, profile]);

  const loadData = async () => {
    try {
      // Load profile
      const profileResult = await (supabase as any)
        .from("profiles")
        .select("*")
        .eq("username", username)
        .single();

      if (profileResult.error) throw profileResult.error;
      const profileData = profileResult.data as any;
      setProfile({
        id: profileData.id,
        username: profileData.username,
        full_name: profileData.full_name,
        theme_color: profileData.theme_color || "#3b82f6",
      });

      // Load meeting type
      const typeResult = await (supabase as any)
        .from("meeting_types")
        .select("*")
        .eq("id", meetingTypeId)
        .eq("user_id", profileData.id)
        .eq("is_active", true)
        .single();

      if (typeResult.error) throw typeResult.error;
      setMeetingType(typeResult.data as MeetingType);
    } catch (error: any) {
      toast({
        title: "Error loading meeting type",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateAvailableSlots = async () => {
    if (!meetingType || !profile) return;

    // Generate base slots from 9 AM to 5 PM every 30 minutes
    const slots: string[] = [];
    let currentTime = setMinutes(setHours(startOfDay(selectedDate), 9), 0);
    const endTime = setMinutes(setHours(startOfDay(selectedDate), 17), 0);

    while (currentTime <= endTime) {
      slots.push(currentTime.toISOString());
      currentTime = new Date(currentTime.getTime() + 30 * 60000); // Add 30 minutes
    }

    // Check Google Calendar availability
    setCheckingAvailability(true);
    try {
      const { data, error } = await supabase.functions.invoke('google-calendar-check-availability', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: {
          userId: profile.id,
          date: selectedDate.toISOString(),
        },
      });

      if (error) throw error;

      if (data?.busySlots && data.busySlots.length > 0) {
        setBusySlots(data.busySlots);
        
        // Filter out busy slots
        const filteredSlots = slots.filter(slot => {
          const slotStart = new Date(slot);
          const slotEnd = new Date(slotStart.getTime() + meetingType.duration * 60000);
          
          // Check if this slot overlaps with any busy time
          return !data.busySlots.some((busy: {start: string, end: string}) => {
            const busyStart = new Date(busy.start);
            const busyEnd = new Date(busy.end);
            
            // Check for overlap
            return (slotStart < busyEnd && slotEnd > busyStart);
          });
        });
        
        setAvailableSlots(filteredSlots);
      } else {
        setBusySlots([]);
        setAvailableSlots(slots);
      }
    } catch (error) {
      console.error('Error checking availability:', error);
      // Fallback to showing all slots if calendar check fails
      setAvailableSlots(slots);
      setBusySlots([]);
    } finally {
      setCheckingAvailability(false);
    }
  };

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedSlot || !meetingType || !profile) return;
    
    setBooking(true);

    try {
      const startTime = new Date(selectedSlot);
      const endTime = new Date(startTime.getTime() + meetingType.duration * 60000);

      let finalLocationDetails = 
        meetingType.location_type === "custom" 
          ? meetingType.custom_location_url
          : meetingType.location_type === "phone"
          ? attendeePhone
          : "Link will be sent via email";

      // Create Zoom meeting if location type is Zoom
      if (meetingType.location_type === "zoom") {
        try {
          const { data: zoomData, error: zoomError } = await supabase.functions.invoke('zoom-create-meeting-public', {
            body: {
              userId: meetingType.user_id,
              title: `${meetingType.name} with ${attendeeName}`,
              description: notes,
              startTime: startTime.toISOString(),
              duration: meetingType.duration,
              attendeeEmail,
              attendeeName,
            },
          });

          if (!zoomError && zoomData?.joinUrl) {
            finalLocationDetails = zoomData.joinUrl;
          }
        } catch (zoomError) {
          console.error('Zoom meeting creation failed:', zoomError);
          // Continue with booking even if Zoom fails
        }
      }

      // Store SMS consent if phone provided and consent given
      if (attendeePhone && smsConsent) {
        await (supabase as any).from('sms_consent_records').insert({
          user_id: null, // Public booking, no auth user
          phone_number: attendeePhone,
          consent_given: true,
          consent_text: 'I agree to receive SMS notifications about my meeting booking. Message and data rates may apply.',
          ip_address: null,
          user_agent: navigator.userAgent,
        });
      }

      console.log('=== BOOKING DEBUG START ===');
      console.log('Profile ID:', profile.id);
      console.log('Meeting Type ID:', meetingType.id);
      console.log('Meeting Type User ID:', meetingType.user_id);
      console.log('Selected Slot:', selectedSlot);
      console.log('Start Time:', startTime.toISOString());
      console.log('End Time:', endTime.toISOString());

      // Create meeting first
      const { data: meetingData, error: meetingError } = await supabase
        .from("meetings")
        .insert({
          user_id: meetingType.user_id,
          meeting_type_id: meetingType.id,
          title: `${meetingType.name} with ${attendeeName}`,
          description: notes,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          location_type: meetingType.location_type as "phone" | "zoom" | "teams" | "meet" | "in-person" | "custom" | "seeksy_studio",
          location_details: finalLocationDetails,
          status: "scheduled" as const,
        })
        .select()
        .single();

      if (meetingError) throw meetingError;
      const meetingId = meetingData.id;

      // Insert attendee record
      const attendeeResult = await (supabase as any)
        .from("meeting_attendees")
        .insert({
          meeting_id: meetingId,
          attendee_name: attendeeName,
          attendee_email: attendeeEmail,
          attendee_phone: attendeePhone || null,
          rsvp_status: 'awaiting',
        });

      if (attendeeResult.error) throw attendeeResult.error;

      console.log('Meeting inserted successfully! ID:', meetingId);
      console.log('=== BOOKING DEBUG END ===');

      // Send confirmation email
      try {
        await supabase.functions.invoke("send-meeting-confirmation-email", {
          body: {
            attendeeName,
            attendeeEmail,
            meetingTitle: `${meetingType.name} with ${attendeeName}`,
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            locationType: meetingType.location_type,
            locationDetails: finalLocationDetails,
            description: notes,
            userId: meetingType.user_id,
            meetingId: meetingId,
          },
        });
        console.log("Confirmation email sent successfully");
      } catch (emailError) {
        console.error("Error sending confirmation email:", emailError);
      }

      // Send SMS confirmation if phone provided and consent given
      if (attendeePhone && smsConsent && meetingId) {
        try {
          await supabase.functions.invoke("send-meeting-confirmation-sms", {
            body: { meetingId },
          });
          console.log("SMS confirmation sent successfully");
        } catch (smsError) {
          console.error("Error sending SMS confirmation:", smsError);
        }
      }

      // Create calendar event for the meeting owner
      try {
        await supabase.functions.invoke("google-calendar-create-event", {
          headers: {
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
          },
          body: {
            title: `${meetingType.name} with ${attendeeName}`,
            description: notes,
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            attendeeEmail,
            attendeeName,
            location: finalLocationDetails || getLocationLabel(meetingType.location_type),
            userId: meetingType.user_id,
          },
        });
        console.log("Calendar event created successfully");
      } catch (calendarError) {
        console.error("Error creating calendar event:", calendarError);
      }

      setBookingConfirmed(true);
    } catch (error: any) {
      toast({
        title: "Error booking meeting",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setBooking(false);
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

  if (!profile || !meetingType) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-12 text-center max-w-md">
          <h2 className="text-2xl font-bold mb-2">Meeting Type Not Found</h2>
          <p className="text-muted-foreground">
            The meeting type you're looking for doesn't exist.
          </p>
        </Card>
      </div>
    );
  }

  if (bookingConfirmed) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-12 text-center max-w-md">
          <div
            className="h-16 w-16 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{ backgroundColor: `${profile.theme_color}20` }}
          >
            <Check className="h-8 w-8" style={{ color: profile.theme_color }} />
          </div>
          <h2 className="text-2xl font-bold mb-2">Meeting Booked!</h2>
          <p className="text-muted-foreground mb-6">
            Your meeting with {profile.full_name} has been scheduled for{" "}
            {format(new Date(selectedSlot!), "MMMM d, yyyy 'at' h:mm a")}. Check your email for confirmation details.
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            A confirmation email has been sent to {attendeeEmail}
          </p>
          <Button onClick={() => navigate(`/book/${username}`)}>
            Book Another Meeting
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-12 max-w-5xl">
        <Button
          variant="ghost"
          onClick={() => navigate(`/book/${username}`)}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Meeting Types
        </Button>

        <div className="grid md:grid-cols-5 gap-8">
          {/* Left Side - Meeting Info */}
          <div className="md:col-span-2">
            <Card className="p-6 sticky top-6">
              <h2 className="text-2xl font-bold mb-4">{meetingType.name}</h2>
              {meetingType.description && (
                <p className="text-muted-foreground mb-6">{meetingType.description}</p>
              )}

              <div className="space-y-3">
                <div className="flex items-center text-sm">
                  <Clock className="h-4 w-4 mr-3 text-muted-foreground" />
                  <span>{meetingType.duration} minutes</span>
                </div>
                <div className="flex items-center text-sm">
                  <MapPin className="h-4 w-4 mr-3 text-muted-foreground" />
                  <span>{getLocationLabel(meetingType.location_type)}</span>
                </div>
                {selectedSlot && (
                  <div className="flex items-center text-sm">
                    <Calendar className="h-4 w-4 mr-3 text-muted-foreground" />
                    <span>{format(new Date(selectedSlot), "MMMM d, yyyy 'at' h:mm a")}</span>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Right Side - Booking Form */}
          <div className="md:col-span-3">
            <Card className="p-8">
              <h3 className="text-xl font-semibold mb-6">Select a Date & Time</h3>

              {/* Date Selection */}
              <div className="mb-6">
                <Label>Select Date</Label>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {Array.from({ length: 7 }).map((_, i) => {
                    const date = addDays(new Date(), i);
                    const isSelected = format(date, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd");
                    return (
                      <Button
                        key={i}
                        variant={isSelected ? "default" : "outline"}
                        onClick={() => setSelectedDate(date)}
                        className="flex flex-col h-auto py-3"
                        style={
                          isSelected
                            ? { backgroundColor: profile.theme_color }
                            : {}
                        }
                      >
                        <span className="text-xs">{format(date, "EEE")}</span>
                        <span className="text-lg font-bold">{format(date, "d")}</span>
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Time Slot Selection */}
              <div className="mb-6">
                <Label>Select Time</Label>
                {checkingAvailability && (
                  <p className="text-sm text-muted-foreground mt-1 mb-2">
                    <Loader2 className="inline h-3 w-3 animate-spin mr-1" />
                    Checking calendar availability...
                  </p>
                )}
                <div className="grid grid-cols-3 gap-2 mt-2 max-h-64 overflow-y-auto">
                  {availableSlots.length === 0 && !checkingAvailability ? (
                    <p className="col-span-3 text-center text-muted-foreground py-4">
                      No available slots for this date
                    </p>
                  ) : (
                    availableSlots.map((slot) => {
                      const isSelected = slot === selectedSlot;
                      return (
                        <Button
                          key={slot}
                          variant={isSelected ? "default" : "outline"}
                          onClick={() => setSelectedSlot(slot)}
                          style={
                            isSelected
                              ? { backgroundColor: profile.theme_color }
                              : {}
                          }
                        >
                          {format(new Date(slot), "h:mm a")}
                        </Button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Attendee Form */}
              {selectedSlot && (
                <form onSubmit={handleBooking} className="space-y-4 pt-6 border-t">
                  <h3 className="text-xl font-semibold mb-4">Your Information</h3>

                  <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      value={attendeeName}
                      onChange={(e) => setAttendeeName(e.target.value)}
                      required
                      placeholder="John Doe"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={attendeeEmail}
                      onChange={(e) => setAttendeeEmail(e.target.value)}
                      required
                      placeholder="john@example.com"
                    />
                  </div>

                  {meetingType.location_type === "phone" && (
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={attendeePhone}
                        onChange={(e) => setAttendeePhone(e.target.value)}
                        required
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                  )}

                  {meetingType.location_type !== "phone" && (
                    <div className="space-y-3">
                      <Label htmlFor="phone-optional">Phone Number (optional for SMS)</Label>
                      <Input
                        id="phone-optional"
                        type="tel"
                        value={attendeePhone}
                        onChange={(e) => setAttendeePhone(e.target.value)}
                        placeholder="+1 (555) 123-4567"
                      />
                      {attendeePhone && (
                        <div className="flex items-start space-x-3 p-4 bg-muted/30 rounded-lg border border-border">
                          <input
                            type="checkbox"
                            id="sms-consent-meeting"
                            checked={smsConsent}
                            onChange={(e) => setSmsConsent(e.target.checked)}
                            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary focus:ring-2 focus:ring-primary cursor-pointer"
                          />
                          <label htmlFor="sms-consent-meeting" className="text-sm leading-relaxed cursor-pointer select-none">
                            <span className="font-medium">I agree to receive SMS notifications</span> about my meeting booking, including confirmations and reminders. Message and data rates may apply.
                          </label>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="notes">Additional Notes</Label>
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Anything you'd like to share..."
                      rows={3}
                    />
                  </div>

                  {meetingType.pre_meeting_questions && Array.isArray(meetingType.pre_meeting_questions) && meetingType.pre_meeting_questions.length > 0 && (
                    <div className="space-y-4 pt-4 border-t">
                      <h4 className="font-semibold">Pre-Meeting Questions</h4>
                      {meetingType.pre_meeting_questions.map((q: any, index: number) => (
                        <div key={index} className="space-y-2">
                          <Label>{q.question} {q.required && "*"}</Label>
                          <Textarea
                            value={questionResponses[q.question] || ""}
                            onChange={(e) =>
                              setQuestionResponses({
                                ...questionResponses,
                                [q.question]: e.target.value,
                              })
                            }
                            required={q.required}
                            rows={2}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={booking}
                    className="w-full"
                    size="lg"
                    style={{ backgroundColor: profile.theme_color }}
                  >
                    {booking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Confirm Booking
                  </Button>
                </form>
              )}
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default BookMeetingSlot;
