import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Zap, CreditCard, ExternalLink } from "lucide-react";
import { UsageMeters } from "@/components/credits/UsageMeters";
import { AutoRenewSettings } from "@/components/credits/AutoRenewSettings";
import { CreditCostList } from "@/components/credits/CreditCostList";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function SettingsBilling() {
  const navigate = useNavigate();

  const { data: credits } = useQuery({
    queryKey: ['user-credits'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;

      const { data, error } = await supabase
        .from('user_credits')
        .select('balance, total_spent, total_purchased')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
  });

  const { data: packages } = useQuery({
    queryKey: ['credit-packages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('credit_packages')
        .select('*')
        .eq('is_active', true)
        .order('display_order');
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="container mx-auto max-w-6xl space-y-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold">Credits & Billing</h1>
          <p className="text-muted-foreground">
            Manage your credits, usage limits, and billing settings
          </p>
        </div>

        {/* Credit Balance Card */}
        <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-background">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Credit Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-8">
              <div>
                <div className="text-5xl font-bold text-primary">
                  {credits?.balance || 0}
                </div>
                <p className="text-muted-foreground">Available credits</p>
              </div>
              <div className="flex gap-6 text-sm">
                <div>
                  <div className="font-semibold">{credits?.total_spent || 0}</div>
                  <div className="text-muted-foreground">Total spent</div>
                </div>
                <div>
                  <div className="font-semibold">{credits?.total_purchased || 0}</div>
                  <div className="text-muted-foreground">Total purchased</div>
                </div>
              </div>
              <div className="ml-auto">
                <Button onClick={() => navigate('/pricing')}>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Buy Credits
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Usage Meters */}
          <UsageMeters />

          {/* Auto-Renew Settings */}
          <AutoRenewSettings />
        </div>

        {/* Credit Packages */}
        <Card>
          <CardHeader>
            <CardTitle>Credit Packages</CardTitle>
            <CardDescription>
              Purchase additional credits. Bulk packages offer better value.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-5 gap-4">
              {packages?.map((pkg) => (
                <div
                  key={pkg.id}
                  className={`p-4 rounded-lg border text-center ${
                    pkg.name === 'Pro' ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : ''
                  }`}
                >
                  {pkg.name === 'Pro' && (
                    <div className="text-xs font-semibold text-primary mb-2">Best Value</div>
                  )}
                  <div className="font-semibold">{pkg.name}</div>
                  <div className="text-2xl font-bold text-primary">{pkg.credits}</div>
                  <div className="text-xs text-muted-foreground mb-2">credits</div>
                  <div className="font-semibold">${pkg.price}</div>
                  <div className="text-xs text-muted-foreground mb-3">
                    ${(pkg.price / pkg.credits).toFixed(3)}/credit
                  </div>
                  <Button size="sm" variant={pkg.name === 'Pro' ? 'default' : 'outline'} className="w-full">
                    Buy
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Credit Costs Reference */}
        <CreditCostList />

        {/* View Full Pricing Link */}
        <div className="text-center">
          <Button variant="link" onClick={() => navigate('/pricing')}>
            View full pricing details
            <ExternalLink className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}