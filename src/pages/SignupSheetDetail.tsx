import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Calendar, MapPin, Clock, Loader2, CheckCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface SignupSheet {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  slot_duration: number;
  location: string;
  is_published: boolean;
  user_id: string;
}

interface Slot {
  id: string;
  slot_start: string;
  slot_end: string;
  volunteer_name: string | null;
  volunteer_email: string | null;
  volunteer_phone: string | null;
  is_filled: boolean;
}

const SignupSheetDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [user, setUser] = useState<User | null>(null);
  const [sheet, setSheet] = useState<SignupSheet | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  
  const [volunteerName, setVolunteerName] = useState("");
  const [volunteerEmail, setVolunteerEmail] = useState("");
  const [volunteerPhone, setVolunteerPhone] = useState("");

  const isOwner = user?.id === sheet?.user_id;

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (id) {
      loadSheet();
      loadSlots();
    }
  }, [id]);

  const loadSheet = async () => {
    try {
      const { data, error } = await supabase
        .from("signup_sheets")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setSheet(data);
    } catch (error: any) {
      toast({
        title: "Error loading sheet",
        description: error.message,
        variant: "destructive",
      });
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const loadSlots = async () => {
    try {
      const { data, error } = await supabase
        .from("signup_slots")
        .select("*")
        .eq("sheet_id", id)
        .order("slot_start", { ascending: true });

      if (error) throw error;
      setSlots(data || []);
    } catch (error: any) {
      console.error("Error loading slots:", error);
    }
  };

  const handleClaimSlot = async () => {
    if (!selectedSlot) return;
    
    setClaiming(true);
    try {
      const { error } = await supabase
        .from("signup_slots")
        .update({
          volunteer_name: volunteerName,
          volunteer_email: volunteerEmail,
          volunteer_phone: volunteerPhone,
          is_filled: true,
          signed_up_at: new Date().toISOString(),
        })
        .eq("id", selectedSlot.id);

      if (error) throw error;

      // Send confirmation email
      try {
        await supabase.functions.invoke("send-signup-confirmation-email", {
          body: {
            volunteerName,
            volunteerEmail,
            sheetTitle: sheet?.title,
            slotStart: selectedSlot.slot_start,
            slotEnd: selectedSlot.slot_end,
            location: sheet?.location,
            description: sheet?.description,
            userId: sheet?.user_id,
            sheetId: sheet?.id,
          },
        });
      } catch (emailError) {
        console.error("Error sending confirmation email:", emailError);
      }

      toast({
        title: "Slot claimed!",
        description: "You're all set for this time slot. Check your email for confirmation.",
      });

      setSelectedSlot(null);
      setVolunteerName("");
      setVolunteerEmail("");
      setVolunteerPhone("");
      loadSlots();
    } catch (error: any) {
      toast({
        title: "Failed to claim slot",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setClaiming(false);
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!sheet) {
    return null;
  }

  const filledSlots = slots.filter(s => s.is_filled).length;

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">{sheet.title}</h1>
          {sheet.description && (
            <p className="text-lg text-muted-foreground">{sheet.description}</p>
          )}
        </div>

        <Card className="p-6 mb-8 space-y-4">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Calendar className="h-5 w-5" />
            <span>
              {formatDate(sheet.start_date)} - {formatDate(sheet.end_date)}
            </span>
          </div>
          
          {sheet.location && (
            <div className="flex items-center gap-3 text-muted-foreground">
              <MapPin className="h-5 w-5" />
              <span>{sheet.location}</span>
            </div>
          )}
          
          <div className="flex items-center gap-3 text-muted-foreground">
            <Clock className="h-5 w-5" />
            <span>{sheet.slot_duration} minute slots</span>
          </div>

          <div className="pt-4 border-t">
            <p className="text-sm">
              <span className="font-semibold">{filledSlots}</span> of{" "}
              <span className="font-semibold">{slots.length}</span> slots filled
            </p>
          </div>
        </Card>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Available Time Slots</h2>
          
          {slots.map((slot) => (
            <Card key={slot.id} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">
                    {formatDate(slot.slot_start)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatTime(slot.slot_start)} - {formatTime(slot.slot_end)}
                  </p>
                  {slot.is_filled && isOwner && (
                    <div className="mt-2 text-sm">
                      <p className="font-medium">{slot.volunteer_name}</p>
                      <p className="text-muted-foreground">{slot.volunteer_email}</p>
                      {slot.volunteer_phone && (
                        <p className="text-muted-foreground">{slot.volunteer_phone}</p>
                      )}
                    </div>
                  )}
                </div>

                {slot.is_filled ? (
                  <div className="flex items-center gap-2 text-secondary">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">Filled</span>
                  </div>
                ) : sheet.is_published ? (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button onClick={() => setSelectedSlot(slot)}>
                        Sign Up
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Claim This Slot</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Your Name *</Label>
                          <Input
                            id="name"
                            value={volunteerName}
                            onChange={(e) => setVolunteerName(e.target.value)}
                            required
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="email">Your Email *</Label>
                          <Input
                            id="email"
                            type="email"
                            value={volunteerEmail}
                            onChange={(e) => setVolunteerEmail(e.target.value)}
                            required
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone Number</Label>
                          <Input
                            id="phone"
                            type="tel"
                            value={volunteerPhone}
                            onChange={(e) => setVolunteerPhone(e.target.value)}
                          />
                        </div>
                        
                        <Button 
                          onClick={handleClaimSlot} 
                          disabled={claiming || !volunteerName || !volunteerEmail}
                          className="w-full"
                        >
                          {claiming && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Confirm Sign Up
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                ) : (
                  <span className="text-sm text-muted-foreground">Not published</span>
                )}
              </div>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};

export default SignupSheetDetail;
