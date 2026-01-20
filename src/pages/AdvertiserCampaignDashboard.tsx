import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Phone, DollarSign, Users, Clock, TrendingUp } from "lucide-react";
import { AudioWaveform } from "@/components/AudioWaveform";

const AdvertiserCampaignDashboard = () => {
  const { adId } = useParams();

  // Fetch campaign details
  const { data: campaign, isLoading } = useQuery({
    queryKey: ['campaign-details', adId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audio_ads')
        .select(`
          *,
          advertiser:advertisers(company_name)
        `)
        .eq('id', adId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Fetch call inquiries
  const { data: inquiries } = useQuery({
    queryKey: ['campaign-inquiries', adId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ad_call_inquiries')
        .select('*')
        .eq('audio_ad_id', adId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading campaign...</div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Campaign not found</div>
      </div>
    );
  }

  const totalInquiries = inquiries?.length || 0;
  const qualifiedInquiries = inquiries?.filter((i) => i.is_qualified).length || 0;
  const totalDuration = inquiries?.reduce((sum, i) => sum + (i.call_duration_seconds || 0), 0) || 0;
  const avgDuration = totalInquiries > 0 ? Math.round(totalDuration / totalInquiries) : 0;

  const advertiserCost = inquiries?.reduce((sum, i) => {
    if (!i.is_billable || !campaign.payout_amount) return sum;
    if (campaign.payout_type === 'ppi') return sum + campaign.payout_amount;
    if (campaign.payout_type === 'ppc' && i.is_qualified) return sum + campaign.payout_amount;
    return sum;
  }, 0) || 0;

  const creatorPayout = advertiserCost * 0.75; // 75% to creator

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{campaign.campaign_name}</h1>
        <p className="text-muted-foreground">
          Track your campaign performance and call inquiries
        </p>
      </div>

      {/* Campaign Overview */}
      <div className="grid gap-6 md:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Inquiries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalInquiries}</div>
            <div className="flex items-center gap-1 mt-1">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {qualifiedInquiries} qualified
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg Call Duration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{avgDuration}s</div>
            <div className="flex items-center gap-1 mt-1">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                Total: {Math.round(totalDuration / 60)}min
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Advertiser Cost
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${advertiserCost.toFixed(2)}</div>
            <div className="flex items-center gap-1 mt-1">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {campaign.payout_type === 'ppi' ? 'Per Inquiry' : 'Per Call'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Creator Payout
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${creatorPayout.toFixed(2)}</div>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">75% share</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaign Details */}
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Campaign Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Tracking Phone</span>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span className="font-medium">{campaign.tracking_phone_number}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Promo Code</span>
              <Badge variant="secondary">{campaign.promo_code}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Payout Model</span>
              <span className="font-medium">
                ${campaign.payout_amount} {campaign.payout_type === 'ppi' ? 'per inquiry' : 'per call'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Audio Previews</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {campaign.audio_url && (
              <div>
                <div className="text-sm font-medium mb-2">Podcast Ad</div>
                <AudioWaveform audioUrl={campaign.audio_url} />
              </div>
            )}
            {campaign.greeting_audio_url && (
              <div>
                <div className="text-sm font-medium mb-2">Call Greeting</div>
                <AudioWaveform audioUrl={campaign.greeting_audio_url} />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Call Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Call Log</CardTitle>
          <CardDescription>Recent inquiries for this campaign</CardDescription>
        </CardHeader>
        <CardContent>
          {inquiries && inquiries.length > 0 ? (
            <div className="space-y-2">
              {inquiries.map((inquiry) => (
                <div
                  key={inquiry.id}
                  className="flex items-center justify-between p-3 border rounded"
                >
                  <div className="flex-1">
                    <div className="font-medium">
                      {inquiry.caller_number.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3')}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(inquiry.call_start).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {inquiry.call_duration_seconds}s
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {inquiry.is_qualified ? 'Qualified' : 'Standard'}
                      </div>
                    </div>
                    {inquiry.is_billable && (
                      <Badge variant="default">Billable</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No calls yet. Share your campaign to start tracking inquiries!
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdvertiserCampaignDashboard;
