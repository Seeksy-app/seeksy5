import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { InteractiveCard } from "@/components/ui/interactive-card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Clock, MapPin, ArrowRight } from "lucide-react";

interface Profile {
  username: string;
  full_name: string;
  bio: string;
  avatar_url: string;
  theme_color: string;
}

interface MeetingType {
  id: string;
  name: string;
  description: string;
  duration: number;
  location_type: string;
}

const BookMeetings = () => {
  const { username } = useParams();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [meetingTypes, setMeetingTypes] = useState<MeetingType[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (username) {
      loadProfileAndMeetingTypes();
    }
  }, [username]);

  const loadProfileAndMeetingTypes = async () => {
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
        username: profileData.username,
        full_name: profileData.full_name,
        bio: profileData.bio || "",
        avatar_url: profileData.avatar_url,
        theme_color: profileData.theme_color || "#3b82f6",
      });

      // Load active meeting types
      const typesResult = await (supabase as any)
        .from("meeting_types")
        .select("*")
        .eq("user_id", profileData.id)
        .eq("is_active", true)
        .order("created_at", { ascending: true });

      if (typesResult.error) throw typesResult.error;
      const typesData = typesResult.data as any[];
      setMeetingTypes(typesData?.map(t => ({
        id: t.id,
        name: t.name,
        description: t.description,
        duration: t.duration,
        location_type: t.location_type,
      })) || []);
    } catch (error: any) {
      toast({
        title: "Error loading booking page",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-12 text-center max-w-md">
          <h2 className="text-2xl font-bold mb-2">Profile Not Found</h2>
          <p className="text-muted-foreground">
            The booking page you're looking for doesn't exist.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Profile Header */}
        <Card className="p-8 mb-8 text-center">
          <Avatar className="h-24 w-24 mx-auto mb-4">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.full_name} />
            ) : (
              <AvatarFallback className="text-2xl">
                {profile.full_name?.charAt(0) || profile.username.charAt(0)}
              </AvatarFallback>
            )}
          </Avatar>
          <h1 className="text-3xl font-bold mb-2">{profile.full_name}</h1>
          {profile.bio && (
            <p className="text-muted-foreground max-w-2xl mx-auto">{profile.bio}</p>
          )}
        </Card>

        {/* Meeting Types */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">Select a meeting type</h2>
          <p className="text-muted-foreground">
            Choose a meeting type below to see available time slots
          </p>
        </div>

        {meetingTypes.length === 0 ? (
          <Card className="p-12 text-center">
            <Clock className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No meetings available</h3>
            <p className="text-muted-foreground">
              This user hasn't set up any meeting types yet.
            </p>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {meetingTypes.map((type) => (
              <InteractiveCard
                key={type.id}
                className="p-6 group"
                hoverVariant="glow"
                onInteract={() => navigate(`/book/${username}/${type.id}`)}
                style={{
                  borderColor: `${profile.theme_color}20`,
                }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-1 group-hover:text-primary transition-colors">
                      {type.name}
                    </h3>
                    {type.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {type.description}
                      </p>
                    )}
                  </div>
                  <ArrowRight
                    className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="h-4 w-4 mr-2" />
                    {type.duration} minutes
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 mr-2" />
                    {getLocationLabel(type.location_type)}
                  </div>
                </div>

                <Button
                  className="w-full mt-4"
                  style={{
                    backgroundColor: profile.theme_color,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/book/${username}/${type.id}`);
                  }}
                >
                  Book Now
                </Button>
              </InteractiveCard>
            ))}
          </div>
        )}

        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>Powered by Seeksy</p>
        </div>
      </main>
    </div>
  );
};

export default BookMeetings;
