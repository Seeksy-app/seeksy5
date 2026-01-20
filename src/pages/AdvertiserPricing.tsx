import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Phone, Zap } from "lucide-react";

const AdvertiserPricing = () => {
  const { data: tiers, isLoading } = useQuery({
    queryKey: ['advertiser-pricing-tiers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('advertiser_pricing_tiers')
        .select('*')
        .eq('is_active', true)
        .order('display_order');
      
      if (error) throw error;
      return data;
    }
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading pricing...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Advertiser Pricing Plans</h1>
        <p className="text-xl text-muted-foreground">
          Choose the plan that fits your advertising needs
        </p>
      </div>

      {/* Pricing Tiers */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {tiers?.map((tier) => (
          <Card key={tier.id} className="p-6 relative hover:shadow-lg transition-shadow">
            {tier.tier_name === 'Professional' && (
              <Badge className="absolute top-4 right-4">Popular</Badge>
            )}
            
            <h3 className="text-2xl font-bold mb-2">{tier.tier_name}</h3>
            <div className="mb-4">
              <div className="text-3xl font-bold">${tier.min_deposit}</div>
              <div className="text-sm text-muted-foreground">Minimum Deposit</div>
            </div>

            <div className="mb-6">
              <div className="text-lg font-semibold">
                ${tier.cpm_min} - ${tier.cpm_max} CPM
              </div>
              <div className="text-sm text-muted-foreground">Cost per 1,000 impressions</div>
            </div>

            {tier.conversational_ad_discount > 0 && (
              <div className="mb-4 p-3 bg-primary/10 rounded-lg">
                <div className="flex items-center gap-2 text-primary">
                  <Zap className="h-4 w-4" />
                  <span className="font-semibold">
                    {tier.conversational_ad_discount}% off conversational ads
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {(tier.features as string[]).map((feature, index) => (
                <div key={index} className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-primary mt-0.5" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>

      {/* Conversational Ads Pricing */}
      <div className="mb-12">
        <h2 className="text-3xl font-bold mb-6 text-center">Conversational AI Ads</h2>
        <div className="grid md:grid-cols-4 gap-6">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold">Agent Setup</h3>
            </div>
            <div className="text-3xl font-bold mb-2">$50</div>
            <div className="text-sm text-muted-foreground mb-4">One-time fee per campaign</div>
            <p className="text-sm">
              AI-powered conversational agent creation with custom training and configuration
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Phone className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold">Phone Number</h3>
            </div>
            <div className="space-y-2 mb-4">
              <div>
                <div className="text-2xl font-bold">FREE</div>
                <div className="text-sm text-muted-foreground">Shared Demo Number</div>
              </div>
              <div>
                <div className="text-2xl font-bold">$10/mo</div>
                <div className="text-sm text-muted-foreground">Custom Phone Number</div>
              </div>
            </div>
            <p className="text-sm">
              Choose between a free shared number or get your own dedicated line
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Check className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold">Usage</h3>
            </div>
            <div className="text-3xl font-bold mb-2">$0.25/min</div>
            <div className="text-sm text-muted-foreground mb-4">Billed per conversation minute</div>
            <p className="text-sm">
              Pay only for actual conversation time. Minimum 1 minute per call. Real-time billing.
            </p>
            <div className="mt-4 p-3 bg-muted rounded-lg text-xs">
              <strong>Tier Discounts:</strong> Growth 10% • Professional 15% • Enterprise 20%
            </div>
          </Card>

          <Card className="p-6 border-2 border-primary/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Phone className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold">Pay Per Query</h3>
            </div>
            <div className="space-y-3 mb-4">
              <div>
                <div className="text-2xl font-bold">$25 - $75</div>
                <div className="text-sm text-muted-foreground">Per inquiry</div>
              </div>
              <div>
                <div className="text-2xl font-bold">$40 - $120</div>
                <div className="text-sm text-muted-foreground">Per qualified call</div>
              </div>
              <div>
                <div className="text-2xl font-bold">$150 - $300</div>
                <div className="text-sm text-muted-foreground">Per completed intake form</div>
              </div>
            </div>
            <p className="text-sm">
              Performance-based pricing model. Only pay when leads convert to specific actions.
            </p>
          </Card>
        </div>
      </div>

      {/* Additional Info */}
      <Card className="p-6 bg-muted">
        <h3 className="text-xl font-bold mb-4">How It Works</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold mb-2">Standard Audio Ads</h4>
            <ul className="space-y-2 text-sm">
              <li>• Pay per impression (CPM model)</li>
              <li>• Set your own CPM bid based on your tier</li>
              <li>• Track performance in real-time</li>
              <li>• 70/30 revenue split with creators</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Conversational AI Ads</h4>
            <ul className="space-y-2 text-sm">
              <li>• $50 one-time agent setup fee</li>
              <li>• Choose shared number (free) or custom ($10/mo)</li>
              <li>• $0.25/minute for actual conversations</li>
              <li>• Earn tier-based discounts (10-20% off)</li>
              <li>• Real-time billing from your account balance</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AdvertiserPricing;