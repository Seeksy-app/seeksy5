import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Instagram, Loader2, Check, Lock, ShoppingCart } from "lucide-react";
import { useSearchParams } from "react-router-dom";

interface Module {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  icon: string | null;
  tier: string;
  price: number | null;
  features: string[];
  stripe_product_id: string | null;
  stripe_price_id: string | null;
  is_active: boolean;
  purchased?: boolean;
  enabled?: boolean;
}

export default function Modules() {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    fetchModules();
    
    // Handle success/canceled redirects from Stripe
    const success = searchParams.get("success");
    const canceled = searchParams.get("canceled");
    const moduleName = searchParams.get("module");

    if (success && moduleName) {
      toast({
        title: "Purchase Successful!",
        description: `${moduleName} has been activated on your account.`,
      });
      // Clean up URL
      window.history.replaceState({}, '', '/modules');
    } else if (canceled) {
      toast({
        title: "Purchase Canceled",
        description: "Your purchase was canceled. No charges were made.",
        variant: "destructive",
      });
      window.history.replaceState({}, '', '/modules');
    }
  }, [searchParams]);

  const fetchModules = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get all modules
      const { data: allModules, error: modulesError } = await supabase
        .from("modules")
        .select("*")
        .eq("is_active", true)
        .order("tier", { ascending: true });

      if (modulesError) throw modulesError;

      // Get user's enabled modules
      const { data: userModules, error: userModulesError } = await supabase
        .from("user_modules")
        .select("module_id")
        .eq("user_id", user.id);

      if (userModulesError) throw userModulesError;

      // Get user's purchases
      const { data: purchases, error: purchasesError } = await supabase
        .from("module_purchases")
        .select("module_id")
        .eq("user_id", user.id)
        .eq("status", "completed");

      if (purchasesError) throw purchasesError;

      const enabledModuleIds = userModules.map(m => m.module_id);
      const purchasedModuleIds = purchases.map(p => p.module_id);

      const modulesWithStatus = allModules.map(module => {
        const features = Array.isArray(module.features) 
          ? (module.features as string[])
          : [];
        
        return {
          ...module,
          features,
          enabled: enabledModuleIds.includes(module.id),
          purchased: module.tier === "free" || purchasedModuleIds.includes(module.id),
        };
      });

      setModules(modulesWithStatus);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (moduleId: string) => {
    setPurchasing(moduleId);
    try {
      const { data, error } = await supabase.functions.invoke("purchase-module", {
        body: { moduleId },
      });

      if (error) throw error;

      if (data.url) {
        window.open(data.url, "_blank");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setPurchasing(null);
    }
  };

  const getIcon = (iconName: string | null) => {
    switch (iconName) {
      case "Instagram":
        return <Instagram className="h-8 w-8" />;
      case "Calendar":
      default:
        return <Calendar className="h-8 w-8" />;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-1">Modules & Add-ons</h1>
          <p className="text-muted-foreground">
            Extend Seeksy with powerful modules for your business
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {modules.map((module) => (
            <Card
              key={module.id}
              className={`relative ${
                module.enabled ? "border-primary shadow-lg" : ""
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex justify-center text-primary">
                    {getIcon(module.icon)}
                  </div>
                  <div className="flex flex-col gap-1 items-end">
                    {module.tier === "free" && (
                      <Badge variant="secondary" className="text-xs">Free</Badge>
                    )}
                    {module.tier === "premium" && (
                      <Badge variant="default" className="text-xs">Premium</Badge>
                    )}
                    {module.enabled && (
                      <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-300 text-xs">
                        <Check className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                    )}
                  </div>
                </div>
                <CardTitle className="text-lg">{module.display_name}</CardTitle>
                <CardDescription className="text-sm">
                  {module.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {module.features && module.features.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm mb-1.5">Features:</h4>
                    <ul className="space-y-0.5 text-xs text-muted-foreground">
                      {module.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-1.5">
                          <Check className="h-3 w-3 text-primary flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {module.tier === "premium" && (
                  <div>
                    <p className="text-xl font-bold">
                      ${module.price}
                      <span className="text-xs font-normal text-muted-foreground">
                        {" "}one-time
                      </span>
                    </p>
                  </div>
                )}

                {!module.enabled && (
                  <>
                    {module.tier === "free" && (
                      <Button className="w-full" size="sm" onClick={() => handlePurchase(module.id)}>
                        Enable Module
                      </Button>
                    )}
                    {module.tier === "premium" && !module.purchased && (
                      <Button
                        className="w-full"
                        size="sm"
                        onClick={() => handlePurchase(module.id)}
                        disabled={purchasing === module.id}
                      >
                        {purchasing === module.id ? (
                          <>
                            <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <ShoppingCart className="h-3 w-3 mr-2" />
                            Purchase Module
                          </>
                        )}
                      </Button>
                    )}
                    {module.tier === "premium" && module.purchased && (
                      <Button variant="outline" className="w-full" size="sm" disabled>
                        <Lock className="h-3 w-3 mr-2" />
                        Purchased (Contact Support)
                      </Button>
                    )}
                  </>
                )}

                {module.enabled && (
                  <Button variant="outline" className="w-full" size="sm" disabled>
                    <Check className="h-3 w-3 mr-2" />
                    Module Active
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h3 className="font-semibold text-sm mb-1">Need Help?</h3>
          <p className="text-xs text-muted-foreground">
            Questions about modules or need custom features? Contact our support team for assistance.
          </p>
        </div>
      </div>
    </div>
  );
}
