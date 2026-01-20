import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CampaignLayout } from "@/components/campaigns/CampaignLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Calendar, 
  MapPin, 
  Video,
  Plus,
  Mail,
  MessageSquare,
  Sparkles,
  Copy,
  Users,
  Clock
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import { toast } from "sonner";
import { format } from "date-fns";

interface CampaignEvent {
  id: string;
  title: string;
  event_type: string;
  datetime: string;
  location: string | null;
  is_virtual: boolean;
  virtual_link: string | null;
  notes: string | null;
}

const recipientGroups = [
  { id: "volunteers", label: "Volunteers" },
  { id: "donors", label: "Donors" },
  { id: "voters", label: "General Voters" },
  { id: "supporters", label: "Supporters" },
];

export default function CampaignOutreachPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [events, setEvents] = useState<CampaignEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [candidateId, setCandidateId] = useState<string | null>(null);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [eventForm, setEventForm] = useState({
    title: "",
    event_type: "town_hall",
    datetime: "",
    location: "",
    is_virtual: false,
    virtual_link: "",
    notes: ""
  });
  const [emailForm, setEmailForm] = useState({
    recipientGroup: "supporters",
    subject: "",
    purpose: ""
  });
  const [generatedEmail, setGeneratedEmail] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (!data.user) navigate("/auth");
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) navigate("/auth");
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    let { data: candidate } = await supabase
      .from("campaign_candidates")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!candidate) {
      const { data: newCandidate } = await supabase
        .from("campaign_candidates")
        .insert({ user_id: user.id, display_name: "My Campaign" })
        .select("id")
        .single();
      candidate = newCandidate;
    }

    if (candidate) {
      setCandidateId(candidate.id);
      
      const { data: eventsData } = await supabase
        .from("campaign_events")
        .select("*")
        .eq("candidate_id", candidate.id)
        .order("datetime", { ascending: true });

      setEvents(eventsData || []);
    }
    setLoading(false);
  };

  const createEvent = async () => {
    if (!candidateId || !eventForm.title || !eventForm.datetime) {
      toast.error("Please fill in required fields");
      return;
    }

    try {
      const { error } = await supabase
        .from("campaign_events")
        .insert({
          candidate_id: candidateId,
          ...eventForm
        });

      if (error) throw error;
      
      toast.success("Event created!");
      setShowEventDialog(false);
      setEventForm({
        title: "",
        event_type: "town_hall",
        datetime: "",
        location: "",
        is_virtual: false,
        virtual_link: "",
        notes: ""
      });
      loadData();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to create event");
    }
  };

  const generateEmail = async () => {
    if (!emailForm.purpose) {
      toast.error("Please describe the purpose of your email");
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("campaign-chat", {
        body: {
          messages: [{
            role: "user",
            content: `Write a campaign outreach email with these details:
- Target audience: ${recipientGroups.find(g => g.id === emailForm.recipientGroup)?.label}
- Subject line: ${emailForm.subject || "Suggest a compelling subject"}
- Purpose: ${emailForm.purpose}

Write a persuasive, warm email that:
- Opens with a personal connection
- Clearly states the ask
- Includes a clear call-to-action
- Ends with gratitude

Keep it under 250 words and write at an 8th grade reading level.`
          }],
          systemPrompt: "You are an expert political email copywriter. Write emails that feel personal, urgent, and motivating.",
          candidateId: user?.id
        }
      });

      if (error) throw error;
      setGeneratedEmail(data.response || "");
    } catch (error) {
      console.error("Generation error:", error);
      toast.error("Failed to generate email");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyEmail = () => {
    navigator.clipboard.writeText(generatedEmail);
    toast.success("Email copied to clipboard!");
  };

  return (
    <CampaignLayout>
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Events Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Events & Town Halls</h2>
            <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
              <DialogTrigger asChild>
                <Button className="bg-[#d4af37] hover:bg-[#b8962e] text-[#0a1628]">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Event
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white border-gray-200 text-gray-900">
                <DialogHeader>
                  <DialogTitle>Create Campaign Event</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-500 mb-1 block">Event Title *</label>
                    <Input
                      value={eventForm.title}
                      onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                      placeholder="e.g., Downtown Town Hall"
                      className="bg-gray-50 border-gray-200 text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-500 mb-1 block">Date & Time *</label>
                    <Input
                      type="datetime-local"
                      value={eventForm.datetime}
                      onChange={(e) => setEventForm({ ...eventForm, datetime: e.target.value })}
                      className="bg-gray-50 border-gray-200 text-gray-900"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-gray-700">Virtual Event?</label>
                    <Switch
                      checked={eventForm.is_virtual}
                      onCheckedChange={(checked) => setEventForm({ ...eventForm, is_virtual: checked })}
                    />
                  </div>
                  {eventForm.is_virtual ? (
                    <div>
                      <label className="text-sm text-gray-500 mb-1 block">Virtual Link</label>
                      <Input
                        value={eventForm.virtual_link}
                        onChange={(e) => setEventForm({ ...eventForm, virtual_link: e.target.value })}
                        placeholder="https://zoom.us/..."
                        className="bg-gray-50 border-gray-200 text-gray-900"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="text-sm text-gray-500 mb-1 block">Location</label>
                      <Input
                        value={eventForm.location}
                        onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                        placeholder="Address or venue name"
                        className="bg-gray-50 border-gray-200 text-gray-900"
                      />
                    </div>
                  )}
                  <div>
                    <label className="text-sm text-gray-500 mb-1 block">Notes</label>
                    <Textarea
                      value={eventForm.notes}
                      onChange={(e) => setEventForm({ ...eventForm, notes: e.target.value })}
                      placeholder="Any additional details..."
                      className="bg-gray-50 border-gray-200 text-gray-900"
                    />
                  </div>
                  <Button 
                    onClick={createEvent}
                    className="w-full bg-[#d4af37] hover:bg-[#b8962e] text-[#0a1628]"
                  >
                    Create Event
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {events.length === 0 ? (
            <Card className="bg-white border-gray-200">
              <CardContent className="p-12 text-center">
                <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No events scheduled yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {events.map((event) => (
                <Card key={event.id} className="bg-white border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-lg bg-[#d4af37]/20 flex items-center justify-center flex-shrink-0">
                        {event.is_virtual ? (
                          <Video className="h-6 w-6 text-[#d4af37]" />
                        ) : (
                          <MapPin className="h-6 w-6 text-[#d4af37]" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{event.title}</h3>
                        <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                          <Clock className="h-4 w-4" />
                          {format(new Date(event.datetime), "PPP p")}
                        </div>
                        {event.location && (
                          <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                            <MapPin className="h-4 w-4" />
                            {event.location}
                          </div>
                        )}
                        {event.is_virtual && (
                          <Badge className="mt-2 bg-blue-500/20 text-blue-600">Virtual</Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Email & Message Drafts Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Email & Message Drafts</h2>
          </div>

          <Card className="bg-white border-gray-200">
            <CardHeader>
              <CardTitle className="text-gray-900 text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-[#d4af37]" />
                Generate Outreach Email
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm text-gray-500 mb-1 block">Recipient Group</label>
                <div className="flex flex-wrap gap-2">
                  {recipientGroups.map((group) => (
                    <Button
                      key={group.id}
                      variant="outline"
                      size="sm"
                      onClick={() => setEmailForm({ ...emailForm, recipientGroup: group.id })}
                      className={`border-gray-300 ${
                        emailForm.recipientGroup === group.id
                          ? "bg-[#d4af37] text-[#0a1628] border-[#d4af37]"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {group.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-500 mb-1 block">Subject Line (optional)</label>
                <Input
                  value={emailForm.subject}
                  onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
                  placeholder="Leave blank to auto-generate..."
                  className="bg-gray-50 border-gray-200 text-gray-900"
                />
              </div>

              <div>
                <label className="text-sm text-gray-500 mb-1 block">What&apos;s the purpose of this email?</label>
                <Textarea
                  value={emailForm.purpose}
                  onChange={(e) => setEmailForm({ ...emailForm, purpose: e.target.value })}
                  placeholder="e.g., Ask for donations for our final push, invite to town hall, recruit volunteers for door-knocking..."
                  className="bg-gray-50 border-gray-200 text-gray-900"
                />
              </div>

              <Button 
                onClick={generateEmail}
                disabled={isGenerating}
                className="w-full bg-[#d4af37] hover:bg-[#b8962e] text-[#0a1628]"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                {isGenerating ? "Generating..." : "Generate Email"}
              </Button>

              {generatedEmail && (
                <div className="space-y-3 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">Generated Email</span>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={copyEmail}
                      className="text-[#d4af37] hover:text-[#d4af37]/80"
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </Button>
                  </div>
                  <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                    <p className="text-gray-700 whitespace-pre-wrap text-sm">{generatedEmail}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </CampaignLayout>
  );
}