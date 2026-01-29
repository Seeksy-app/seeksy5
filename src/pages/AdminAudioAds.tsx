import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clapperboard, Play, Phone, Clock, User } from "lucide-react";
import { format } from "date-fns";

export default function AdminAudioAds() {
  const { data: audioAds, isLoading } = useQuery({
    queryKey: ["admin-audio-ads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audio_ads")
        .select(`
          *,
          advertiser:advertiser_id(company_name),
          campaign:campaign_id(name, status)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      generating: "bg-blue-500",
      ready: "bg-green-500",
      failed: "bg-red-500",
    };
    return variants[status] || "bg-gray-500";
  };

  const getAdTypeBadge = (adType: string) => {
    return adType === "conversational" 
      ? "bg-purple-500 text-white" 
      : "bg-blue-500 text-white";
  };

  return (
    <div className="container mx-auto py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Audio Ads Library</h1>
          <p className="text-muted-foreground mt-2">
            View all audio ads created by advertisers
          </p>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading ads...</div>
        ) : audioAds && audioAds.length > 0 ? (
          <div className="grid gap-4">
            {audioAds.map((ad) => (
              <Card key={ad.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">
                          {(ad as any).advertiser?.company_name || "Unknown Advertiser"}
                        </CardTitle>
                        <Badge className={getAdTypeBadge(ad.ad_type)}>
                          {ad.ad_type === "conversational" ? "Conversational AI" : "Standard Audio"}
                        </Badge>
                        <Badge className={getStatusBadge(ad.status)}>
                          {ad.status}
                        </Badge>
                      </div>
                      <CardDescription>
                        Created {format(new Date(ad.created_at), "MMM d, yyyy 'at' h:mm a")}
                      </CardDescription>
                    </div>
                    {(ad as any).campaign && (
                      <Badge variant="outline">
                        Campaign: {(ad as any).campaign.name}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Script Preview */}
                  <div>
                    <div className="text-sm font-medium mb-1">Script</div>
                    <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                      {ad.script.length > 200 ? `${ad.script.substring(0, 200)}...` : ad.script}
                    </div>
                  </div>

                  {/* Ad Details */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    {ad.duration_seconds && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="text-muted-foreground">Duration</div>
                          <div className="font-medium">{ad.duration_seconds}s</div>
                        </div>
                      </div>
                    )}
                    
                    {ad.voice_name && (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="text-muted-foreground">Voice</div>
                          <div className="font-medium">{ad.voice_name}</div>
                        </div>
                      </div>
                    )}

                    {ad.phone_number && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="text-muted-foreground">Phone</div>
                          <div className="font-medium">{ad.phone_number}</div>
                        </div>
                      </div>
                    )}

                    {ad.phone_number_type && (
                      <div>
                        <div className="text-muted-foreground">Number Type</div>
                        <div className="font-medium capitalize">{ad.phone_number_type}</div>
                      </div>
                    )}
                  </div>

                  {/* Audio Player */}
                  {ad.audio_url && (
                    <div>
                      <div className="text-sm font-medium mb-2">Audio Preview</div>
                      <audio controls className="w-full" src={ad.audio_url}>
                        Your browser does not support the audio element.
                      </audio>
                    </div>
                  )}

                  {/* Conversational Config */}
                  {ad.ad_type === "conversational" && ad.conversation_config && (
                    <div>
                      <div className="text-sm font-medium mb-1">Conversational Settings</div>
                      <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                        {JSON.stringify(ad.conversation_config, null, 2)}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Clapperboard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No audio ads yet</h3>
              <p className="text-muted-foreground">
                Audio ads created by advertisers will appear here
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
