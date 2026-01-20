import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Clock, Video, ArrowLeft, Check } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const meetingTypeDetails: Record<string, { name: string; duration: string; description: string }> = {
  demo: {
    name: "Demo Call",
    duration: "30 minutes",
    description: "Book a live demo of Seeksy with our team. We'll walk you through all features and answer your questions."
  },
  sales: {
    name: "Sales Discovery",
    duration: "45 minutes",
    description: "Discuss your needs and explore how Seeksy can help grow your business."
  },
  support: {
    name: "Support Session",
    duration: "30 minutes",
    description: "Get help with technical issues or questions about using Seeksy."
  }
};

const availableTimes = [
  { date: "Dec 6, 2024", day: "Friday", slots: ["9:00 AM", "10:00 AM", "11:00 AM", "2:00 PM", "3:00 PM"] },
  { date: "Dec 9, 2024", day: "Monday", slots: ["9:00 AM", "10:30 AM", "1:00 PM", "3:30 PM", "4:00 PM"] },
  { date: "Dec 10, 2024", day: "Tuesday", slots: ["10:00 AM", "11:30 AM", "2:00 PM", "4:00 PM"] },
  { date: "Dec 11, 2024", day: "Wednesday", slots: ["9:00 AM", "11:00 AM", "1:00 PM", "2:30 PM", "4:00 PM"] },
];

export default function ScheduleMeeting() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const type = searchParams.get("type") || "demo";
  const meetingInfo = meetingTypeDetails[type] || meetingTypeDetails.demo;

  const [step, setStep] = useState<"time" | "details" | "confirmed">("time");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", email: "", company: "", notes: "" });

  const handleTimeSelect = (date: string, time: string) => {
    setSelectedDate(date);
    setSelectedTime(time);
    setStep("details");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      toast({ title: "Please fill in required fields", variant: "destructive" });
      return;
    }
    setStep("confirmed");
    toast({ title: "Meeting scheduled!", description: `${meetingInfo.name} on ${selectedDate} at ${selectedTime}` });
  };

  if (step === "confirmed") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-8 pb-8">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">You're all set!</h2>
            <p className="text-muted-foreground mb-6">
              Your {meetingInfo.name} has been scheduled for {selectedDate} at {selectedTime}.
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              A confirmation email has been sent to {formData.email} with the meeting details and video link.
            </p>
            <Button onClick={() => navigate("/")} className="w-full">
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Button variant="ghost" onClick={() => step === "details" ? setStep("time") : navigate(-1)} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Meeting Info */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Video className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>{meetingInfo.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">{meetingInfo.description}</p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                {meetingInfo.duration}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                <Video className="h-4 w-4" />
                Video call
              </div>
              {selectedDate && selectedTime && (
                <div className="mt-4 p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <p className="text-sm font-medium text-primary">Selected Time</p>
                  <p className="text-sm text-foreground">{selectedDate} at {selectedTime}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Time Selection or Details Form */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>{step === "time" ? "Select a Time" : "Your Details"}</CardTitle>
            </CardHeader>
            <CardContent>
              {step === "time" ? (
                <div className="space-y-6">
                  {availableTimes.map((daySlots) => (
                    <div key={daySlots.date}>
                      <p className="font-medium text-foreground mb-3">
                        <Calendar className="h-4 w-4 inline mr-2" />
                        {daySlots.day}, {daySlots.date}
                      </p>
                      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                        {daySlots.slots.map((time) => (
                          <Button
                            key={`${daySlots.date}-${time}`}
                            variant="outline"
                            size="sm"
                            onClick={() => handleTimeSelect(daySlots.date, time)}
                            className="hover:bg-primary hover:text-primary-foreground"
                          >
                            {time}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Name *</Label>
                      <Input
                        placeholder="Your full name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email *</Label>
                      <Input
                        type="email"
                        placeholder="you@company.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Company</Label>
                    <Input
                      placeholder="Your company name (optional)"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Additional Notes</Label>
                    <Textarea
                      placeholder="Anything specific you'd like to discuss?"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <Button type="submit" className="w-full" size="lg">
                    Schedule Meeting
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
