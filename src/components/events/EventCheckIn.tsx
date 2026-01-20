import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Search, QrCode, CheckCircle, XCircle, User, Clock, Loader2 } from "lucide-react";
import { format } from "date-fns";

interface EventCheckInProps {
  eventId: string;
}

interface Attendee {
  id: string;
  attendee_name: string;
  attendee_email: string;
  attendee_phone?: string;
  checked_in: boolean;
  registered_at: string;
}

export function EventCheckIn({ eventId }: EventCheckInProps) {
  const [search, setSearch] = useState("");
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadAttendees();
  }, [eventId]);

  const loadAttendees = async () => {
    try {
      const { data, error } = await supabase
        .from("event_registrations")
        .select("*")
        .eq("event_id", eventId)
        .order("attendee_name");

      if (error) throw error;
      setAttendees(data || []);
    } catch (error) {
      console.error("Error loading attendees:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (attendeeId: string, attendeeName: string) => {
    setCheckingIn(attendeeId);
    try {
      // Update registration
      const { error: regError } = await supabase
        .from("event_registrations")
        .update({ checked_in: true })
        .eq("id", attendeeId);

      if (regError) throw regError;

      // Log check-in
      const { error: checkInError } = await supabase
        .from("event_check_ins")
        .insert({
          event_id: eventId,
          ticket_id: attendeeId,
          check_in_method: "manual",
        });

      if (checkInError) console.error("Check-in log error:", checkInError);

      // Update local state
      setAttendees(prev =>
        prev.map(a => (a.id === attendeeId ? { ...a, checked_in: true } : a))
      );

      toast({
        title: "Checked in!",
        description: `${attendeeName} has been checked in.`,
      });
    } catch (error: any) {
      toast({
        title: "Check-in failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setCheckingIn(null);
    }
  };

  const handleQRScan = async (qrCode: string) => {
    // QR code format: eventId-registrationId
    const parts = qrCode.split("-");
    if (parts.length < 2) {
      toast({
        title: "Invalid QR code",
        description: "The scanned code is not valid.",
        variant: "destructive",
      });
      return;
    }

    const registrationId = parts.slice(1).join("-");
    const attendee = attendees.find(a => a.id === registrationId);

    if (!attendee) {
      toast({
        title: "Attendee not found",
        description: "No registration found for this QR code.",
        variant: "destructive",
      });
      return;
    }

    if (attendee.checked_in) {
      toast({
        title: "Already checked in",
        description: `${attendee.attendee_name} is already checked in.`,
      });
      return;
    }

    await handleCheckIn(attendee.id, attendee.attendee_name);
  };

  const filteredAttendees = attendees.filter(a =>
    a.attendee_name.toLowerCase().includes(search.toLowerCase()) ||
    a.attendee_email.toLowerCase().includes(search.toLowerCase())
  );

  const checkedInCount = attendees.filter(a => a.checked_in).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold">{attendees.length}</p>
            <p className="text-sm text-muted-foreground">Registered</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-green-500">{checkedInCount}</p>
            <p className="text-sm text-muted-foreground">Checked In</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-orange-500">
              {attendees.length - checkedInCount}
            </p>
            <p className="text-sm text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
      </div>

      {/* Search & Scan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            Check-In Station
          </CardTitle>
          <CardDescription>
            Search by name/email or scan attendee QR code
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search attendees..."
                className="pl-9"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => {
                // In a real app, this would open camera for QR scanning
                const code = prompt("Enter QR code value:");
                if (code) handleQRScan(code);
              }}
            >
              <QrCode className="w-4 h-4 mr-2" />
              Scan QR
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Attendee List */}
      <Card>
        <CardHeader>
          <CardTitle>Attendees</CardTitle>
          <CardDescription>
            {filteredAttendees.length} attendee{filteredAttendees.length !== 1 ? "s" : ""} 
            {search && ` matching "${search}"`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filteredAttendees.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                {search ? "No matching attendees found" : "No registrations yet"}
              </p>
            ) : (
              filteredAttendees.map((attendee) => (
                <div
                  key={attendee.id}
                  className={`flex items-center justify-between p-4 rounded-lg border ${
                    attendee.checked_in
                      ? "bg-green-500/5 border-green-500/20"
                      : "hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        attendee.checked_in ? "bg-green-500/10" : "bg-muted"
                      }`}
                    >
                      {attendee.checked_in ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <User className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{attendee.attendee_name}</p>
                      <p className="text-sm text-muted-foreground">{attendee.attendee_email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right text-sm hidden md:block">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {format(new Date(attendee.registered_at), "MMM d, h:mm a")}
                      </div>
                    </div>

                    {attendee.checked_in ? (
                      <Badge variant="secondary" className="bg-green-500/10 text-green-600">
                        Checked In
                      </Badge>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleCheckIn(attendee.id, attendee.attendee_name)}
                        disabled={checkingIn === attendee.id}
                      >
                        {checkingIn === attendee.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          "Check In"
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
