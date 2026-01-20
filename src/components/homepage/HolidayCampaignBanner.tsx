import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Gift, ShieldCheck, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const HolidayCampaignBanner = () => {
  const navigate = useNavigate();

  return (
    <section className="py-16 bg-gradient-to-r from-red-500/10 via-green-500/10 to-red-500/10">
      <div className="container mx-auto px-4">
        <Card className="max-w-4xl mx-auto p-8 bg-gradient-to-br from-background/95 to-secondary/20 border-2 border-primary/30 backdrop-blur-sm">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Gift className="h-10 w-10 text-red-500" />
              <h2 className="text-4xl font-black bg-gradient-to-r from-red-500 via-green-500 to-red-500 bg-clip-text text-transparent">
                Holiday Certified Creator Campaign
              </h2>
              <Sparkles className="h-10 w-10 text-green-500" />
            </div>
            
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
              Creators can certify clips & identity to unlock special promotions with advertisers during the holiday ad season.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
              <div className="flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <span className="font-semibold">Limited Time: Nov 25 - Jan 2</span>
              </div>
              <div className="flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full">
                <Gift className="h-5 w-5 text-red-500" />
                <span className="font-semibold">Exclusive Holiday Rates</span>
              </div>
            </div>

            <Button 
              size="lg" 
              onClick={() => navigate("/auth?mode=signup")}
              className="bg-gradient-to-r from-red-600 to-green-600 hover:opacity-90 text-white font-bold text-lg px-10 py-7 h-auto hover:scale-105 transition-transform"
            >
              Get Certified for the Holiday Campaign
            </Button>
          </div>
        </Card>
      </div>
    </section>
  );
};
