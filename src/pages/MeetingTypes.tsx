import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import ShareBookingLinkButton from "@/components/ShareBookingLinkButton";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Clock, MapPin, Edit, Trash2, Send } from "lucide-react";
import { SendInviteDialog } from "@/components/SendInviteDialog";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface MeetingType {
  id: string;
  name: string;
  description: string;
  duration: number;
  location_type: string;
  is_active: boolean;
}

interface Profile {
  username: string;
}

const MeetingTypes = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [meetingTypes, setMeetingTypes] = useState<MeetingType[]>([]);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [selectedMeetingType, setSelectedMeetingType] = useState<{ id: string; name: string } | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        loadProfile(session.user.id);
        loadMeetingTypes(session.user.id);
      }
    });
  }, [navigate]);

  const loadProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error: any) {
      toast({
        title: "Error loading profile",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const loadMeetingTypes = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("meeting_types")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMeetingTypes(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading meeting types",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteMeetingType = async (id: string) => {
    try {
      const { error } = await supabase
        .from("meeting_types")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Meeting type deleted",
        description: "The meeting type has been removed.",
      });

      setMeetingTypes(meetingTypes.filter((type) => type.id !== id));
    } catch (error: any) {
      toast({
        title: "Error deleting meeting type",
        description: error.message,
        variant: "destructive",
      });
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
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-12 max-w-6xl">
        <Breadcrumb className="mb-4">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Meeting Types</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold">Meeting Types</h1>
            <p className="text-muted-foreground mt-2">
              Create templates for different types of meetings
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/availability")}>
              <Clock className="h-4 w-4 mr-2" />
              Set Availability
            </Button>
            <Button onClick={() => navigate("/meeting-types/create")}>
              <Plus className="h-4 w-4 mr-2" />
              Create Meeting Type
            </Button>
          </div>
        </div>

        {profile && (
          <Card className="p-6 mb-8 bg-primary/5">
            <h3 className="font-semibold mb-2">Share Your Booking Page</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Share this link with others so they can book meetings with you
            </p>
            <ShareBookingLinkButton username={profile.username} />
          </Card>
        )}

        {meetingTypes.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="max-w-md mx-auto">
              <Clock className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-2xl font-semibold mb-2">No meeting Seekies yet</h2>
              <p className="text-muted-foreground mb-6">
                Create your first meeting Seeksy and let people book time with you
              </p>
              <Button onClick={() => navigate("/meeting-types/create")}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Meeting Seeksy
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {meetingTypes.map((type) => (
              <Card key={type.id} className="p-6 hover:shadow-lg hover:border-primary/30 hover:-translate-y-1 transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-1">{type.name}</h3>
                    {type.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {type.description}
                      </p>
                    )}
                  </div>
                  {!type.is_active && (
                    <span className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded">
                      Inactive
                    </span>
                  )}
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="h-4 w-4 mr-2" />
                    {type.duration} minutes
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 mr-2" />
                    {getLocationLabel(type.location_type)}
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedMeetingType({ id: type.id, name: type.name });
                      setInviteDialogOpen(true);
                    }}
                    disabled={!type.is_active}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => navigate(`/meeting-types/${type.id}/edit`)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteMeetingType(type.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {selectedMeetingType && (
          <SendInviteDialog
            open={inviteDialogOpen}
            onOpenChange={setInviteDialogOpen}
            meetingTypeId={selectedMeetingType.id}
            meetingTypeName={selectedMeetingType.name}
          />
        )}
      </main>
    </div>
  );
};

export default MeetingTypes;
