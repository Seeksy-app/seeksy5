import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Target, ArrowLeft } from "lucide-react";

interface PropertyAllocation {
  property_type: string;
  property_id: string;
  property_name: string;
  allocated_impressions: number;
  cpm_rate: number;
  creator_id?: string;
}

export default function CreateMultiChannelCampaign() {
  const navigate = useNavigate();
  const [campaignName, setCampaignName] = useState("");
  const [advertiserId, setAdvertiserId] = useState("");
  const [impressionGoal, setImpressionGoal] = useState("");
  const [budget, setBudget] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [properties, setProperties] = useState<PropertyAllocation[]>([]);
  const [selectedPropertyType, setSelectedPropertyType] = useState<string>("podcast");
  const [selectedProperty, setSelectedProperty] = useState<{
    type: string;
    id: string;
    name: string;
    creator_id?: string;
  } | null>(null);
  const [impressionAllocation, setImpressionAllocation] = useState("");
  const [cpmRate, setCpmRate] = useState("");

  // Fetch advertisers
  const { data: advertisers } = useQuery({
    queryKey: ["advertisers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("advertisers")
        .select("id, company_name")
        .eq("status", "approved");
      if (error) throw error;
      return data;
    },
  });

  // Fetch available podcasts
  const { data: podcasts } = useQuery({
    queryKey: ["podcasts-for-campaigns"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("podcasts")
        .select("id, title, user_id");
      if (error) throw error;
      return data;
    },
  });

  // Fetch creator profiles (for influencer/creator pages)
  const { data: creators } = useQuery({
    queryKey: ["creators-for-campaigns"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, full_name")
        .not("username", "is", null);
      if (error) throw error;
      return data;
    },
  });

  // Fetch events (for event sponsorships)
  const { data: events } = useQuery({
    queryKey: ["events-for-campaigns"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("id, title, user_id, event_date")
        .eq("is_published", true)
        .order("event_date", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const createCampaignMutation = useMutation({
    mutationFn: async () => {
      // Insert campaign
      const { data: campaign, error: campaignError } = await supabase
        .from("multi_channel_campaigns")
        .insert({
          campaign_name: campaignName,
          advertiser_id: advertiserId,
          impression_goal: parseInt(impressionGoal),
          total_budget: parseFloat(budget),
          start_date: startDate,
          end_date: endDate,
          status: "draft",
        })
        .select()
        .single();

      if (campaignError) throw campaignError;

      // Insert property allocations
      const propertyInserts = properties.map((prop) => ({
        multi_channel_campaign_id: campaign.id,
        property_type: prop.property_type,
        property_id: prop.property_id,
        property_name: prop.property_name,
        allocated_impressions: prop.allocated_impressions,
        allocated_budget: (prop.allocated_impressions * prop.cpm_rate) / 1000,
        cpm_rate: prop.cpm_rate,
        creator_id: prop.creator_id,
        status: "pending",
      }));

      const { error: propertiesError } = await supabase
        .from("campaign_properties")
        .insert(propertyInserts);

      if (propertiesError) throw propertiesError;

      // Create alerts for creators
      const alertInserts = properties
        .filter((p) => p.creator_id)
        .map((prop) => ({
          creator_id: prop.creator_id!,
          multi_channel_campaign_id: campaign.id,
          property_type: prop.property_type,
          property_id: prop.property_id,
          alert_type: "invitation",
        }));

      if (alertInserts.length > 0) {
        const { error: alertsError } = await supabase
          .from("creator_campaign_alerts")
          .insert(alertInserts);

        if (alertsError) throw alertsError;
      }

      return campaign;
    },
    onSuccess: () => {
      toast.success("Campaign created successfully!");
      navigate("/sales-dashboard");
    },
    onError: (error) => {
      toast.error(`Failed to create campaign: ${error.message}`);
    },
  });

  const addProperty = () => {
    if (!selectedProperty || !impressionAllocation || !cpmRate) {
      toast.error("Please fill in all property details");
      return;
    }

    const newProperty: PropertyAllocation = {
      property_type: selectedProperty.type,
      property_id: selectedProperty.id,
      property_name: selectedProperty.name,
      allocated_impressions: parseInt(impressionAllocation),
      cpm_rate: parseFloat(cpmRate),
      creator_id: selectedProperty.creator_id,
    };

    setProperties([...properties, newProperty]);
    setSelectedProperty(null);
    setImpressionAllocation("");
    setCpmRate("");
    toast.success("Property added to campaign");
  };

  const removeProperty = (index: number) => {
    setProperties(properties.filter((_, i) => i !== index));
  };

  const totalAllocated = properties.reduce(
    (sum, prop) => sum + prop.allocated_impressions,
    0
  );
  const totalBudgetAllocated = properties.reduce(
    (sum, prop) => sum + (prop.allocated_impressions * prop.cpm_rate) / 1000,
    0
  );

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Button
        variant="ghost"
        onClick={() => navigate("/advertiser/dashboard")}
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>
      
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Create Multi-Channel Campaign</h1>
        <p className="text-muted-foreground">
          Set impression goals and distribute across multiple properties
        </p>
      </div>

      <div className="space-y-6">
        {/* Campaign Details */}
        <Card>
          <CardHeader>
            <CardTitle>Campaign Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="campaignName">Campaign Name</Label>
              <Input
                id="campaignName"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                placeholder="Summer Product Launch"
              />
            </div>

            <div>
              <Label htmlFor="advertiser">Advertiser</Label>
              <Select value={advertiserId} onValueChange={setAdvertiserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select advertiser" />
                </SelectTrigger>
                <SelectContent>
                  {advertisers?.map((adv) => (
                    <SelectItem key={adv.id} value={adv.id}>
                      {adv.company_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="impressionGoal">Impression Goal</Label>
                <Input
                  id="impressionGoal"
                  type="number"
                  value={impressionGoal}
                  onChange={(e) => setImpressionGoal(e.target.value)}
                  placeholder="1000000"
                />
              </div>
              <div>
                <Label htmlFor="budget">Total Budget ($)</Label>
                <Input
                  id="budget"
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="25000"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Property Allocation */}
        <Card>
          <CardHeader>
            <CardTitle>Property Allocation</CardTitle>
            <p className="text-sm text-muted-foreground">
              Add properties and allocate impressions to each
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-4 gap-4">
              <div>
                <Label>Property Type</Label>
                <Select
                  value={selectedPropertyType}
                  onValueChange={(value) => {
                    setSelectedPropertyType(value);
                    setSelectedProperty(null); // Reset selection when type changes
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="podcast">Podcast</SelectItem>
                    <SelectItem value="creator_page">Creator/Influencer Page</SelectItem>
                    <SelectItem value="social_media">Social Media Account</SelectItem>
                    <SelectItem value="event">Event</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Property</Label>
                {selectedPropertyType === "podcast" ? (
                  <Select
                    value={selectedProperty?.id}
                    onValueChange={(value) => {
                      const podcast = podcasts?.find((p) => p.id === value);
                      if (podcast) {
                        setSelectedProperty({
                          type: "podcast",
                          id: podcast.id,
                          name: podcast.title,
                          creator_id: podcast.user_id,
                        });
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select podcast" />
                    </SelectTrigger>
                    <SelectContent>
                      {podcasts?.map((podcast) => (
                        <SelectItem key={podcast.id} value={podcast.id}>
                          {podcast.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : selectedPropertyType === "creator_page" ? (
                  <Select
                    value={selectedProperty?.id}
                    onValueChange={(value) => {
                      const creator = creators?.find((c) => c.id === value);
                      if (creator) {
                        setSelectedProperty({
                          type: "creator_page",
                          id: creator.id,
                          name: creator.full_name || creator.username || '',
                          creator_id: creator.id,
                        });
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select creator" />
                    </SelectTrigger>
                    <SelectContent>
                      {creators?.map((creator) => (
                        <SelectItem key={creator.id} value={creator.id}>
                          {creator.full_name || creator.username}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : selectedPropertyType === "event" ? (
                  <Select
                    value={selectedProperty?.id}
                    onValueChange={(value) => {
                      const event = events?.find((e) => e.id === value);
                      if (event) {
                        setSelectedProperty({
                          type: "event",
                          id: event.id,
                          name: event.title,
                          creator_id: event.user_id,
                        });
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select event" />
                    </SelectTrigger>
                    <SelectContent>
                      {events?.map((event) => (
                        <SelectItem key={event.id} value={event.id}>
                          {event.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input disabled placeholder="Coming soon" />
                )}
              </div>
              <div>
                <Label>Impressions</Label>
                <Input
                  type="number"
                  value={impressionAllocation}
                  onChange={(e) => setImpressionAllocation(e.target.value)}
                  placeholder="100000"
                />
              </div>
              <div>
                <Label>CPM ($)</Label>
                <Input
                  type="number"
                  value={cpmRate}
                  onChange={(e) => setCpmRate(e.target.value)}
                  placeholder="25"
                />
              </div>
            </div>
            <Button onClick={addProperty} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Add Property
            </Button>

            {/* Added Properties */}
            {properties.length > 0 && (
              <div className="space-y-2 mt-4">
                {properties.map((prop, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{prop.property_type}</Badge>
                        <span className="font-medium">{prop.property_name}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {prop.allocated_impressions.toLocaleString()} impressions @ ${prop.cpm_rate} CPM
                        = ${((prop.allocated_impressions * prop.cpm_rate) / 1000).toFixed(2)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeProperty(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Summary */}
            {properties.length > 0 && (
              <div className="mt-4 p-4 bg-muted rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span>Total Allocated Impressions:</span>
                  <span className="font-semibold">
                    {totalAllocated.toLocaleString()} /{" "}
                    {impressionGoal ? parseInt(impressionGoal).toLocaleString() : "0"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Total Budget Allocated:</span>
                  <span className="font-semibold">
                    ${totalBudgetAllocated.toFixed(2)} / ${budget || "0"}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={() => navigate("/sales-dashboard")}>
            Cancel
          </Button>
          <Button
            onClick={() => createCampaignMutation.mutate()}
            disabled={
              !campaignName ||
              !advertiserId ||
              !impressionGoal ||
              !budget ||
              !startDate ||
              !endDate ||
              properties.length === 0 ||
              createCampaignMutation.isPending
            }
          >
            <Target className="w-4 h-4 mr-2" />
            Create Campaign
          </Button>
        </div>
      </div>
    </div>
  );
}
