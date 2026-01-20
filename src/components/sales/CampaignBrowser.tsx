import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, TrendingUp, Calendar, DollarSign, Target, Zap } from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

export function CampaignBrowser() {
  const [matchedCount, setMatchedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  // Get current user's podcast categories
  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const { data: userCategories } = useQuery({
    queryKey: ['user-podcast-categories', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('podcasts')
        .select('category')
        .eq('user_id', user.id);
      
      if (error) throw error;
      // Get unique categories
      const categories = [...new Set(data.map(p => p.category).filter(Boolean))];
      return categories;
    },
    enabled: !!user,
  });

  // Get ad campaigns with targeting
  const { data: adCampaigns } = useQuery({
    queryKey: ['available-ad-campaigns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ad_campaigns')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const { data: campaigns, isLoading } = useQuery({
    queryKey: ['available-campaigns'],
    queryFn: async () => {
      // Get campaigns that are active and have properties with pending status
      const { data, error } = await supabase
        .from('multi_channel_campaigns')
        .select(`
          *,
          campaign_properties (
            id,
            property_type,
            property_name,
            allocated_impressions,
            cpm_rate,
            allocated_budget,
            status
          )
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Calculate matching campaigns
  useEffect(() => {
    if (!adCampaigns || !userCategories) return;
    
    const matchingCampaigns = adCampaigns.filter(campaign => {
      const targetingRules = campaign.targeting_rules as any;
      if (!targetingRules?.categories) return false;
      
      const targetCategories = targetingRules.categories as string[];
      return targetCategories.some(cat => userCategories.includes(cat));
    });

    setTotalCount(adCampaigns.length);
    setMatchedCount(matchingCampaigns.length);
  }, [adCampaigns, userCategories]);

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!campaigns || campaigns.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            No available campaigns at this time
          </p>
        </CardContent>
      </Card>
    );
  }

  const AnimatedCounter = ({ value }: { value: number }) => {
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
      let start = 0;
      const duration = 1000;
      const increment = value / (duration / 16);
      
      const timer = setInterval(() => {
        start += increment;
        if (start >= value) {
          setDisplayValue(value);
          clearInterval(timer);
        } else {
          setDisplayValue(Math.floor(start));
        }
      }, 16);

      return () => clearInterval(timer);
    }, [value]);

    return <span>{displayValue}</span>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Available Campaigns</h2>
        <p className="text-muted-foreground">
          Browse and bid on campaigns that match your content
        </p>
      </div>

      {/* Match Statistics */}
      {userCategories && userCategories.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">Campaign Matches</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Based on your podcast categories: {userCategories.join(", ")}
                  </p>
                </div>
                <motion.div 
                  className="text-right"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                >
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-primary">
                      <AnimatedCounter value={matchedCount} />
                    </span>
                    <span className="text-2xl text-muted-foreground">/ {totalCount}</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Zap className="h-3 w-3" />
                    Matching campaigns
                  </div>
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <div className="grid gap-4">
        {/* Ad Campaigns with Category Targeting */}
        {adCampaigns?.map((campaign) => {
          const targetingRules = campaign.targeting_rules as any;
          const targetCategories = targetingRules?.categories as string[] || [];
          const isMatched = userCategories?.some(cat => targetCategories.includes(cat));

          return (
            <motion.div
              key={campaign.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Card className={`hover:shadow-md transition-shadow ${isMatched ? 'border-primary/50 bg-primary/5' : ''}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-xl">{campaign.name}</CardTitle>
                        {isMatched && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 500 }}
                          >
                            <Badge className="bg-primary">
                              <Zap className="h-3 w-3 mr-1" />
                              Match!
                            </Badge>
                          </motion.div>
                        )}
                      </div>
                      <CardDescription>
                        Campaign ID: {campaign.id.slice(0, 8)}
                      </CardDescription>
                    </div>
                    <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>
                      {campaign.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <DollarSign className="h-4 w-4" />
                        <span className="text-sm">Budget</span>
                      </div>
                      <p className="text-2xl font-bold">${Number(campaign.total_budget).toLocaleString()}</p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <TrendingUp className="h-4 w-4" />
                        <span className="text-sm">CPM Bid</span>
                      </div>
                      <p className="text-2xl font-bold">${Number(campaign.cpm_bid).toFixed(2)}</p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <TrendingUp className="h-4 w-4" />
                        <span className="text-sm">Impressions</span>
                      </div>
                      <p className="text-2xl font-bold">{campaign.total_impressions?.toLocaleString() || 0}</p>
                    </div>
                  </div>

                  {targetCategories.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        Target Categories:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {targetCategories.map((category) => {
                          const isUserCategory = userCategories?.includes(category);
                          return (
                            <Badge 
                              key={category} 
                              variant={isUserCategory ? "default" : "outline"}
                              className={isUserCategory ? "bg-primary" : ""}
                            >
                              {isUserCategory && <Zap className="h-3 w-3 mr-1" />}
                              {category}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {format(new Date(campaign.start_date), 'MMM d')} - {format(new Date(campaign.end_date), 'MMM d, yyyy')}
                    </span>
                  </div>

                  <Button className="w-full">
                    View Details & Bid
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}

        {/* Multi-Channel Campaigns */}
        {campaigns.map((campaign) => {
          const totalBudget = campaign.total_budget || 0;
          const totalImpressions = campaign.impression_goal || 0;
          const avgCPM = totalBudget && totalImpressions ? (totalBudget / totalImpressions) * 1000 : 0;

          return (
            <Card key={campaign.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-xl">{campaign.campaign_name}</CardTitle>
                    <CardDescription>
                      Campaign ID: {campaign.id.slice(0, 8)}
                    </CardDescription>
                  </div>
                  <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>
                    {campaign.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <DollarSign className="h-4 w-4" />
                      <span className="text-sm">Budget</span>
                    </div>
                    <p className="text-2xl font-bold">${totalBudget.toLocaleString()}</p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <TrendingUp className="h-4 w-4" />
                      <span className="text-sm">Target Impressions</span>
                    </div>
                    <p className="text-2xl font-bold">{totalImpressions.toLocaleString()}</p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <DollarSign className="h-4 w-4" />
                      <span className="text-sm">Avg CPM</span>
                    </div>
                    <p className="text-2xl font-bold">${avgCPM.toFixed(2)}</p>
                  </div>
                </div>

                {campaign.campaign_properties && campaign.campaign_properties.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Available Properties:</p>
                    <div className="flex flex-wrap gap-2">
                      {campaign.campaign_properties.map((prop) => (
                        <Badge key={prop.id} variant="outline">
                          {prop.property_type}: {prop.property_name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {format(new Date(campaign.start_date), 'MMM d')} - {format(new Date(campaign.end_date), 'MMM d, yyyy')}
                  </span>
                </div>

                <Button className="w-full">
                  View Details & Bid
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
