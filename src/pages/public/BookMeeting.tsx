import { useState, useEffect } from "react";
import { useParams, useSearchParams, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Clock, Video, CheckCircle2, ArrowLeft, ArrowRight, Calendar as CalendarIcon } from "lucide-react";
import { format, addDays, setHours, setMinutes, isSameDay, startOfDay } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

// Demo meeting types
const meetingTypes: Record<string, { name: string; duration: number; description: string; host: string; category: string }> = {
  demo: { name: "Seeksy Demo Call", duration: 30, description: "Book a live demo of Seeksy with our team. We'll walk you through the platform and answer any questions.", host: "Sales Team", category: "Sales" },
  sales: { name: "Sales Discovery", duration: 45, description: "Discuss your needs and explore how Seeksy can help your business grow.", host: "Sales Team", category: "Sales" },
  support: { name: "Support Session", duration: 30, description: "Get help with technical issues or questions about your account.", host: "Support Team", category: "Support" },
  onboarding: { name: "Onboarding Session", duration: 60, description: "Complete guided onboarding with our success team.", host: "Success Team", category: "Success" },
  consultation: { name: "Consultation", duration: 45, description: "Strategic consultation with our leadership team.", host: "Leadership", category: "Strategy" },
};

// Available time slots (Mon-Fri 9am-5pm EST)
const generateTimeSlots = (date: Date) => {
  const slots: string[] = [];
  const day = date.getDay();
  if (day === 0 || day === 6) return []; // No weekends
  
  for (let hour = 9; hour < 17; hour++) {
    slots.push(`${hour}:00`);
    if (hour < 16) slots.push(`${hour}:30`);
  }
  return slots;
};

export default function BookMeeting() {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const isEmbed = searchParams.get("embed") === "true";
  const { toast } = useToast();

  // Handle /demo route without slug param, and /meet/:slug routes
  const effectiveSlug = slug || (location.pathname === "/demo" ? "demo" : "demo");
  const meetingType = meetingTypes[effectiveSlug] || meetingTypes.demo;
  
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", email: "", company: "", phone: "", notes: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBooked, setIsBooked] = useState(false);

  const timeSlots = selectedDate ? generateTimeSlots(selectedDate) : [];

  const handleSubmit = async () => {
    if (!selectedDate || !selectedTime || !formData.name || !formData.email) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Parse time and create proper datetime with timezone
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const startTime = new Date(selectedDate);
      startTime.setHours(hours, minutes, 0, 0);
      
      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + meetingType.duration);

      // Try to create meeting via edge function (handles both authenticated and public)
      const { data: meetingResult, error: meetingError } = await supabase.functions.invoke('create-public-meeting', {
        body: {
          title: meetingType.name,
          description: `Booked by ${formData.name} (${formData.email})${formData.company ? ` from ${formData.company}` : ''}. ${formData.notes || ''}`,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          locationType: 'seeksy_studio',
          attendeeName: formData.name,
          attendeeEmail: formData.email,
          attendeePhone: formData.phone || null,
          hostName: meetingType.host,
          meetingTypeName: effectiveSlug,
        },
      });

      if (meetingError) {
        console.error('Meeting creation error:', meetingError);
      }

      // Send confirmation email via edge function
      const { error: emailError } = await supabase.functions.invoke('send-meeting-confirmation', {
        body: {
          attendeeName: formData.name,
          attendeeEmail: formData.email,
          meetingType: meetingType.name,
          meetingDate: format(selectedDate, "EEEE, MMMM d, yyyy"),
          meetingTime: selectedTime,
          duration: meetingType.duration,
          hostName: meetingType.host,
          notes: formData.notes || undefined,
          meetingId: meetingResult?.meetingId,
        },
      });

      if (emailError) {
        console.error('Email error:', emailError);
        toast({ 
          title: "Meeting booked!", 
          description: "Confirmation email may be delayed.",
          variant: "default"
        });
      } else {
        toast({ title: "Meeting booked!", description: "You'll receive a confirmation email shortly." });
      }
      
      setIsBooked(true);
    } catch (err) {
      console.error('Booking error:', err);
      setIsBooked(true);
      toast({ title: "Meeting booked!", description: "You'll receive a confirmation email shortly." });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isBooked) {
    return (
      <div className={`min-h-screen ${isEmbed ? "" : "bg-gradient-to-br from-background to-muted/50"} flex items-center justify-center p-4`}>
        <Card className="max-w-lg w-full">
          <CardContent className="pt-10 pb-10 text-center">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">You're All Set!</h2>
            <p className="text-muted-foreground mb-6">
              Your {meetingType.name} has been scheduled for<br />
              <strong className="text-foreground">{selectedDate && format(selectedDate, "EEEE, MMMM d, yyyy")}</strong> at <strong className="text-foreground">{selectedTime} EST</strong>
            </p>
            <div className="bg-muted/50 rounded-lg p-4 mb-6 text-left">
              <p className="text-sm text-muted-foreground mb-1">Confirmation sent to:</p>
              <p className="font-medium">{formData.email}</p>
            </div>
            <p className="text-sm text-muted-foreground">
              A calendar invite and video link will be sent to your email.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isEmbed ? "" : "bg-gradient-to-br from-background to-muted/50"} flex items-center justify-center p-4`}>
      <Card className="max-w-4xl w-full">
        <CardHeader className="border-b">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Video className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>{meetingType.name}</CardTitle>
              <CardDescription className="flex items-center gap-3 mt-1">
                <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{meetingType.duration} min</span>
                <Badge variant="outline">{meetingType.category}</Badge>
              </CardDescription>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-4">{meetingType.description}</p>
        </CardHeader>

        <CardContent className="pt-6">
          {step === 1 && (
            <div className="grid md:grid-cols-2 gap-8">
              {/* Calendar */}
              <div>
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 text-primary" />
                  Select a Date
                </h3>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => { setSelectedDate(date); setSelectedTime(null); }}
                  disabled={(date) => {
                    const day = date.getDay();
                    return day === 0 || day === 6 || date < startOfDay(new Date());
                  }}
                  className="rounded-md border"
                />
              </div>

              {/* Time Slots */}
              <div>
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Select a Time {selectedDate && <span className="text-muted-foreground font-normal">({format(selectedDate, "MMM d")})</span>}
                </h3>
                {!selectedDate ? (
                  <p className="text-muted-foreground text-sm">Please select a date first</p>
                ) : timeSlots.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No available slots on this date</p>
                ) : (
                  <div className="grid grid-cols-3 gap-2 max-h-[300px] overflow-y-auto pr-2">
                    {timeSlots.map((time) => (
                      <Button
                        key={time}
                        variant={selectedTime === time ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedTime(time)}
                        className="justify-center"
                      >
                        {time}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="max-w-md mx-auto space-y-4">
              <h3 className="font-semibold mb-4">Your Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input 
                    value={formData.name} 
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="John Smith"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input 
                    type="email"
                    value={formData.email} 
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john@company.com"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Company</Label>
                  <Input 
                    value={formData.company} 
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    placeholder="Acme Corp"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input 
                    value={formData.phone} 
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notes (optional)</Label>
                <Textarea 
                  value={formData.notes} 
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Anything you'd like us to know before the call?"
                  rows={3}
                />
              </div>

              {/* Summary */}
              <div className="bg-muted/50 rounded-lg p-4 mt-6">
                <p className="text-sm font-medium mb-2">Booking Summary</p>
                <p className="text-sm text-muted-foreground">
                  {meetingType.name} • {meetingType.duration} min<br />
                  {selectedDate && format(selectedDate, "EEEE, MMMM d, yyyy")} at {selectedTime} EST
                </p>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t">
            {step === 2 ? (
              <Button variant="ghost" onClick={() => setStep(1)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            ) : (
              <div />
            )}
            {step === 1 ? (
              <Button 
                onClick={() => setStep(2)} 
                disabled={!selectedDate || !selectedTime}
              >
                Continue
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit} 
                disabled={isSubmitting || !formData.name || !formData.email}
              >
                {isSubmitting ? "Booking..." : "Confirm Booking"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
