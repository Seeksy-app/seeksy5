import { useState } from "react";
import { format, addDays, setHours, setMinutes } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Calendar as CalendarIcon, CheckCircle, ArrowRight, Clock, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScheduleDemoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const timeSlots = [
  "9:00 AM",
  "9:30 AM",
  "10:00 AM",
  "10:30 AM",
  "11:00 AM",
  "11:30 AM",
  "1:00 PM",
  "1:30 PM",
  "2:00 PM",
  "2:30 PM",
  "3:00 PM",
  "3:30 PM",
  "4:00 PM",
  "4:30 PM",
];

export function ScheduleDemoDialog({ open, onOpenChange }: ScheduleDemoDialogProps) {
  const [step, setStep] = useState<"qualify" | "schedule" | "confirmed">("qualify");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [leadId, setLeadId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    phone: "",
    role: "",
    teamSize: "",
    message: "",
  });

  const handleQualifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email) {
      toast.error("Name and email are required");
      return;
    }

    setIsSubmitting(true);

    try {
      // Insert into CRM sales leads
      const { data, error } = await supabase.from("crm_sales_leads").insert({
        title: `Demo Request: ${formData.name}`,
        email: formData.email,
        company: formData.company || null,
        phone: formData.phone || null,
        source: "website_demo_request",
        notes: `Role: ${formData.role || "Not specified"}\nTeam Size: ${formData.teamSize || "Not specified"}\n\nMessage: ${formData.message || "No message provided"}`,
        status: "qualified",
      }).select("id").single();

      if (error) throw error;

      setLeadId(data.id);
      setStep("schedule");
      toast.success("Great! Now pick a time for your demo.");
    } catch (error) {
      console.error("Error submitting demo request:", error);
      toast.error("Failed to submit request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleScheduleSubmit = async () => {
    if (!selectedDate || !selectedTime) {
      toast.error("Please select a date and time");
      return;
    }

    setIsSubmitting(true);

    try {
      // Parse time and combine with date
      const [time, period] = selectedTime.split(" ");
      const [hours, minutes] = time.split(":").map(Number);
      let hour24 = hours;
      if (period === "PM" && hours !== 12) hour24 += 12;
      if (period === "AM" && hours === 12) hour24 = 0;

      const scheduledDateTime = setMinutes(setHours(selectedDate, hour24), minutes);

      // Update the lead with scheduled time
      if (leadId) {
        const { error } = await supabase.from("crm_sales_leads").update({
          notes: `Role: ${formData.role || "Not specified"}\nTeam Size: ${formData.teamSize || "Not specified"}\n\nMessage: ${formData.message || "No message provided"}\n\n📅 Scheduled Demo: ${format(scheduledDateTime, "EEEE, MMMM d, yyyy 'at' h:mm a")}`,
          status: "scheduled",
        }).eq("id", leadId);

        if (error) throw error;
      }

      setStep("confirmed");
      toast.success("Demo scheduled successfully!");
    } catch (error) {
      console.error("Error scheduling demo:", error);
      toast.error("Failed to schedule. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset form after dialog closes
    setTimeout(() => {
      setStep("qualify");
      setLeadId(null);
      setSelectedDate(undefined);
      setSelectedTime("");
      setFormData({
        name: "",
        email: "",
        company: "",
        phone: "",
        role: "",
        teamSize: "",
        message: "",
      });
    }, 200);
  };

  // Confirmed state
  if (step === "confirmed") {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="mb-4 rounded-full bg-green-100 p-3">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <DialogTitle className="text-xl mb-2">Demo Scheduled!</DialogTitle>
            <DialogDescription className="mb-4">
              Your demo is confirmed for:
            </DialogDescription>
            <div className="bg-muted rounded-lg p-4 mb-6 text-center">
              <p className="font-semibold text-lg">
                {selectedDate && format(selectedDate, "EEEE, MMMM d, yyyy")}
              </p>
              <p className="text-primary font-medium">{selectedTime} (EST)</p>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              We've sent a calendar invite to <strong>{formData.email}</strong>
            </p>
            <Button onClick={handleClose}>Done</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Schedule step
  if (step === "schedule") {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1">
              <CalendarIcon className="h-5 w-5 text-primary" />
              <DialogTitle>Pick a Date & Time</DialogTitle>
            </div>
            <DialogDescription>
              Select a convenient time for your 30-minute demo with our team.
            </DialogDescription>
          </DialogHeader>

          <div className="grid md:grid-cols-2 gap-6 py-4">
            {/* Calendar */}
            <div>
              <Label className="mb-2 block">Select a Date</Label>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => {
                  // Disable weekends and past dates
                  const day = date.getDay();
                  return date < new Date() || day === 0 || day === 6;
                }}
                initialFocus
                className={cn("rounded-md border pointer-events-auto")}
              />
            </div>

            {/* Time slots */}
            <div>
              <Label className="mb-2 block">Select a Time (EST)</Label>
              <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-2">
                {timeSlots.map((time) => (
                  <Button
                    key={time}
                    type="button"
                    variant={selectedTime === time ? "default" : "outline"}
                    className={cn(
                      "justify-start",
                      selectedTime === time && "bg-primary text-primary-foreground"
                    )}
                    onClick={() => setSelectedTime(time)}
                    disabled={!selectedDate}
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    {time}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setStep("qualify")}>
              Back
            </Button>
            <Button 
              onClick={handleScheduleSubmit} 
              disabled={isSubmitting || !selectedDate || !selectedTime}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Scheduling...
                </>
              ) : (
                <>
                  Confirm Demo
                  <CheckCircle className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Qualify step (default)
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <User className="h-5 w-5 text-primary" />
            <DialogTitle>Schedule a Demo</DialogTitle>
          </div>
          <DialogDescription>
            Tell us a bit about yourself, then pick a time that works for you.
          </DialogDescription>
          {/* Step indicator */}
          <div className="flex items-center gap-2 pt-2">
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-primary" />
              <span className="text-xs font-medium text-primary">Your Info</span>
            </div>
            <div className="h-px flex-1 bg-border" />
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-muted" />
              <span className="text-xs text-muted-foreground">Pick a Time</span>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleQualifySubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                placeholder="John Smith"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Work Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@company.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                placeholder="Acme Inc."
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="role">Your Role</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="creator">Creator / Podcaster</SelectItem>
                  <SelectItem value="agency">Agency / Marketing</SelectItem>
                  <SelectItem value="brand">Brand / Advertiser</SelectItem>
                  <SelectItem value="event_planner">Event Planner</SelectItem>
                  <SelectItem value="business">Business Owner</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="teamSize">Team Size</Label>
              <Select
                value={formData.teamSize}
                onValueChange={(value) => setFormData({ ...formData, teamSize: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Just me</SelectItem>
                  <SelectItem value="2-5">2-5 people</SelectItem>
                  <SelectItem value="6-20">6-20 people</SelectItem>
                  <SelectItem value="21-50">21-50 people</SelectItem>
                  <SelectItem value="50+">50+ people</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">What are you hoping to accomplish? (Optional)</Label>
            <Textarea
              id="message"
              placeholder="Tell us about your goals or challenges..."
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
