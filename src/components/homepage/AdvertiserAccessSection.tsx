import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Briefcase, CheckSquare, Shield, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const AdvertiserAccessSection = () => {
  const navigate = useNavigate();

  return (
    <section className="py-24 bg-gradient-to-b from-background via-secondary/10 to-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Briefcase className="h-12 w-12 text-primary" />
            <h2 className="text-5xl md:text-6xl font-black bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Trusted Access for Advertisers
            </h2>
          </div>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto font-medium">
            Brands can request licensed use of a creator's identity, face, or voice — with creator approval every time.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto mb-12">
          <Card className="p-6 hover:shadow-lg transition-shadow border-2 border-primary/20">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckSquare className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-bold">Identity Request Workflow</h3>
              <p className="text-sm text-muted-foreground">
                Brands submit formal requests for identity usage rights through the platform
              </p>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow border-2 border-primary/20">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-bold">Licensing Permissions Hub</h3>
              <p className="text-sm text-muted-foreground">
                Creators manage all identity licenses and permissions in one centralized dashboard
              </p>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow border-2 border-primary/20">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Briefcase className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-bold">Creator-Approved AI Ads</h3>
              <p className="text-sm text-muted-foreground">
                AI-generated ads using creator identity require explicit approval before use
              </p>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow border-2 border-primary/20">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-bold">Transparent Audit Logs</h3>
              <p className="text-sm text-muted-foreground">
                Every identity request and approval is logged on-chain for full transparency
              </p>
            </div>
          </Card>
        </div>

        <div className="max-w-3xl mx-auto mb-12">
          <Card className="p-8 bg-gradient-to-br from-primary/5 to-secondary/5 border-2 border-primary/20">
            <h3 className="text-2xl font-bold mb-4 text-center">The Seeksy Identity Promise</h3>
            <p className="text-center text-lg mb-6">
              Your likeness is yours. Seeksy will never sell, license, or use your face, voice, or identity without your explicit permission.
            </p>
            <p className="text-center text-muted-foreground">
              Every use of your identity — whether in clips, AI generation, or advertising — requires your consent, recorded on-chain for transparency and security.
            </p>
          </Card>
        </div>

        <div className="text-center">
          <Button 
            size="lg" 
            onClick={() => navigate("/auth?mode=signup")}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg px-10 py-7 h-auto hover:scale-105 transition-transform"
          >
            Creator Identity for Advertisers
          </Button>
        </div>
      </div>
    </section>
  );
};
