import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Instagram, Loader2, Lock, ShoppingCart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Module {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  icon: string | null;
  route: string;
  tier: string;
  price: number | null;
  purchased?: boolean;
}

export default function ModuleSelector() {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchUserModules();
  }, []);

  const fetchUserModules = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("user_modules")
        .select(`
          modules (
            id,
            name,
            display_name,
            description,
            icon,
            route,
            tier,
            price
          )
        `)
        .eq("user_id", user.id);

      if (error) throw error;

      // Get user's purchases for premium modules
      const { data: purchases } = await supabase
        .from("module_purchases")
        .select("module_id")
        .eq("user_id", user.id)
        .eq("status", "completed");

      const purchasedModuleIds = purchases?.map(p => p.module_id) || [];

      const userModules = data
        .map((item: any) => item.modules)
        .filter(Boolean)
        .map(module => ({
          ...module,
          purchased: module.tier === "free" || purchasedModuleIds.includes(module.id),
        }));
      
      // If user has modules, redirect to the first one's route
      if (userModules.length > 0) {
        navigate(userModules[0].route);
        return;
      }
      
      setModules(userModules);
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
        return <Instagram className="h-12 w-12" />;
      case "Calendar":
      default:
        return <Calendar className="h-12 w-12" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Choose Your Module</h1>
          <p className="text-muted-foreground text-lg">
            Select which platform you'd like to use
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {modules.map((module) => {
            const isLocked = module.tier === "premium" && !module.purchased;
            
            return (
              <Card
                key={module.id}
                className={`relative ${
                  isLocked 
                    ? "opacity-75" 
                    : "cursor-pointer hover:shadow-lg transition-all hover:border-primary"
                }`}
                onClick={() => !isLocked && navigate(module.route)}
              >
                <CardHeader className="text-center">
                  <div className="flex justify-center mb-4 text-primary relative">
                    {getIcon(module.icon)}
                    {isLocked && (
                      <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-full">
                        <Lock className="h-6 w-6" />
                      </div>
                    )}
                  </div>
                  <CardTitle className="text-2xl flex items-center justify-center gap-2">
                    {module.display_name}
                    {module.tier === "premium" && (
                      <Badge variant="default" className="text-xs">Premium</Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="text-base">
                    {module.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center space-y-3">
                  {module.tier === "premium" && (
                    <div className="text-lg font-semibold">
                      ${module.price} one-time
                    </div>
                  )}
                  
                  {isLocked ? (
                    <Button 
                      className="w-full" 
                      size="lg"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePurchase(module.id);
                      }}
                      disabled={purchasing === module.id}
                    >
                      {purchasing === module.id ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          Purchase & Activate
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button className="w-full" size="lg">
                      Launch {module.display_name}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {modules.length === 0 && (
          <div className="text-center text-muted-foreground">
            <p>No modules available. Please visit the Settings to add modules.</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => navigate("/modules")}
            >
              Browse Available Modules
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
