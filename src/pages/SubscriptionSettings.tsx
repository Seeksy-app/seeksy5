import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Check, Sparkles, Loader2, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PlanLimits {
  ai_messages: number;
  podcast_storage_gb: number;
}

const PLAN_LIMITS: Record<string, PlanLimits> = {
  free: {
    ai_messages: 50,
    podcast_storage_gb: 1,
  },
  creator: {
    ai_messages: 500,
    podcast_storage_gb: 10,
  },
  pro: {
    ai_messages: 2000,
    podcast_storage_gb: 50,
  },
};

const PLAN_PRICES: Record<string, { name: string; price: string; priceId: string; productId: string }> = {
  creator: {
    name: "Creator",
    price: "$19",
    priceId: "price_1SVeWDE5HHYxGhYSTXC0VfJO",
    productId: "prod_TSZfxYwRKGg7Kc",
  },
  pro: {
    name: "Pro",
    price: "$49",
    priceId: "price_1SVe32E5HHYxGhYSIEPK8gNj",
    productId: "prod_TSZBbYgPWx7I0v",
  },
};

export default function SubscriptionSettings() {
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSubscription, setIsCheckingSubscription] = useState(false);

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const { data: subscription, refetch: refetchSubscription } = useQuery({
    queryKey: ["subscription", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: aiUsage } = useQuery({
    queryKey: ["ai-usage", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase.rpc('get_current_usage', {
        _user_id: user.id,
        _feature_type: 'ai_messages'
      });
      
      if (error) throw error;
      return data as number;
    },
    enabled: !!user,
  });

  const { data: storageUsage } = useQuery({
    queryKey: ["storage-usage", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase.rpc('get_current_usage', {
        _user_id: user.id,
        _feature_type: 'podcast_storage_mb'
      });
      
      if (error) throw error;
      return data as number;
    },
    enabled: !!user,
  });

  const checkSubscription = async () => {
    setIsCheckingSubscription(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please log in to check your subscription");
        return;
      }

      const { data, error } = await supabase.functions.invoke("check-subscription", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      
      await refetchSubscription();
      toast.success("Subscription status updated");
    } catch (error) {
      console.error("Failed to check subscription:", error);
      toast.error("Failed to check subscription status");
    } finally {
      setIsCheckingSubscription(false);
    }
  };

  const handleUpgrade = async (priceId: string) => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please log in to upgrade");
        return;
      }

      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      if (data.url) {
        window.open(data.url, "_blank");
      }
    } catch (error) {
      console.error("Failed to create checkout:", error);
      toast.error("Failed to start checkout process");
    } finally {
      setIsLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please log in to manage your subscription");
        return;
      }

      const { data, error } = await supabase.functions.invoke("customer-portal", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      if (data.url) {
        window.open(data.url, "_blank");
      }
    } catch (error) {
      console.error("Failed to open customer portal:", error);
      toast.error("Failed to open customer portal");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Check subscription status on mount
    if (user) {
      checkSubscription();
    }
  }, [user]);

  const currentPlan = subscription?.plan_name || "free";
  const limits = PLAN_LIMITS[currentPlan];
  const aiUsagePercent = aiUsage && limits ? (aiUsage / limits.ai_messages) * 100 : 0;
  const storageUsagePercent = storageUsage && limits ? (storageUsage / (limits.podcast_storage_gb * 1024)) * 100 : 0;

  return (
    <div className="container max-w-6xl py-8">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Subscription & Usage</h1>
          <p className="text-muted-foreground mt-2">
            Manage your subscription plan and monitor your usage
          </p>
        </div>

        {/* Current Plan & Usage */}
        <Card className="p-6 border-2 border-primary/20 shadow-glow">
          <div className="flex items-center justify-between mb-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold flex items-center gap-2">
                    {currentPlan === "free" ? "Free Plan" : PLAN_PRICES[currentPlan]?.name}
                    {currentPlan !== "free" && (
                      <Badge variant="default" className="bg-accent text-accent-foreground">Active</Badge>
                    )}
                  </h2>
                  {subscription?.current_period_end && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Renews {new Date(subscription.current_period_end).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={checkSubscription}
                disabled={isCheckingSubscription}
              >
                {isCheckingSubscription ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Refresh Status"
                )}
              </Button>
              {currentPlan !== "free" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleManageSubscription}
                  disabled={isLoading}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Manage
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium">AI Messages</span>
                <span className={`${
                  aiUsagePercent >= 90 ? "text-destructive font-semibold" : 
                  aiUsagePercent >= 80 ? "text-accent font-medium" : 
                  "text-muted-foreground"
                }`}>
                  {aiUsage || 0} / {limits.ai_messages} used
                </span>
              </div>
              <Progress 
                value={Math.min(aiUsagePercent, 100)} 
                className={
                  aiUsagePercent >= 90 ? "[&>div]:bg-destructive" :
                  aiUsagePercent >= 80 ? "[&>div]:bg-accent" : ""
                }
              />
              {aiUsagePercent >= 90 && (
                <p className="text-xs text-destructive mt-2 font-medium">
                  ⚠️ You've used over 90% of your AI messages. Consider upgrading your plan.
                </p>
              )}
              {aiUsagePercent >= 80 && aiUsagePercent < 90 && (
                <p className="text-xs text-accent mt-2 font-medium">
                  ⚠️ You're approaching your AI message limit.
                </p>
              )}
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium">Podcast Storage</span>
                <span className={`${
                  storageUsagePercent >= 90 ? "text-destructive font-semibold" : 
                  storageUsagePercent >= 80 ? "text-accent font-medium" : 
                  "text-muted-foreground"
                }`}>
                  {((storageUsage || 0) / 1024).toFixed(2)} GB / {limits.podcast_storage_gb} GB used
                </span>
              </div>
              <Progress 
                value={Math.min(storageUsagePercent, 100)} 
                className={
                  storageUsagePercent >= 90 ? "[&>div]:bg-destructive" :
                  storageUsagePercent >= 80 ? "[&>div]:bg-accent" : ""
                }
              />
              {storageUsagePercent >= 90 && (
                <p className="text-xs text-destructive mt-2 font-medium">
                  ⚠️ You've used over 90% of your storage. Consider upgrading your plan.
                </p>
              )}
              {storageUsagePercent >= 80 && storageUsagePercent < 90 && (
                <p className="text-xs text-accent mt-2 font-medium">
                  ⚠️ You're approaching your storage limit.
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* Pricing Plans */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Free Plan */}
          <Card className={`p-6 ${currentPlan === "free" ? "border-primary" : ""}`}>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold">Free</h3>
                <div className="mt-2">
                  <span className="text-3xl font-bold">$0</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </div>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  50 AI messages/month
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  Unlimited meetings & events
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  1GB podcast storage
                </li>
              </ul>
              {currentPlan === "free" && (
                <div className="w-full py-3 px-4 rounded-lg bg-primary text-primary-foreground font-semibold text-center shadow-soft">
                  ✓ Current Plan
                </div>
              )}
            </div>
          </Card>

          {/* Creator */}
          <Card className={`p-6 ${currentPlan === "creator" ? "border-primary" : ""}`}>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  Creator
                  <Badge variant="secondary">Popular</Badge>
                </h3>
                <div className="mt-2">
                  <span className="text-3xl font-bold">$19</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </div>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  10 AI Post-Productions per month
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  20 AI-Generated Clips per month
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  Advanced AI Features
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  Filler Word Removal
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  Noise Reduction
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  Priority Email Support
                </li>
              </ul>
              {currentPlan === "creator" ? (
                <div className="w-full py-3 px-4 rounded-lg bg-primary text-primary-foreground font-semibold text-center shadow-soft">
                  ✓ Current Plan
                </div>
              ) : (
                <Button
                  className="w-full"
                  onClick={() => handleUpgrade(PLAN_PRICES.creator.priceId)}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Upgrade
                    </>
                  )}
                </Button>
              )}
            </div>
          </Card>

          {/* Pro */}
          <Card className={`p-6 ${currentPlan === "pro" ? "border-primary" : ""}`}>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold">Pro</h3>
                <div className="mt-2">
                  <span className="text-3xl font-bold">$49</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </div>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  Unlimited AI Post-Productions
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  Unlimited AI-Generated Clips
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  Multi-Track Handling
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  Speaker Separation
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  Custom Branding
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  API Access
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  Priority Support (24/7)
                </li>
              </ul>
              {currentPlan === "pro" ? (
                <div className="w-full py-3 px-4 rounded-lg bg-primary text-primary-foreground font-semibold text-center shadow-soft">
                  ✓ Current Plan
                </div>
              ) : (
                <Button
                  className="w-full"
                  onClick={() => handleUpgrade(PLAN_PRICES.pro.priceId)}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Upgrade
                    </>
                  )}
                </Button>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
