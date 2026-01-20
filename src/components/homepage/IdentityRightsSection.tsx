import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Shield, CheckCircle, Lock, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const IdentityRightsSection = () => {
  const navigate = useNavigate();

  return (
    <section className="py-24 bg-gradient-to-b from-background via-secondary/10 to-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Shield className="h-12 w-12 text-primary" />
            <h2 className="text-5xl md:text-6xl font-black bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Your Identity, Verified.
            </h2>
          </div>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto font-medium">
            Creators control how their face, voice, and likeness are used.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto mb-12">
          <Card className="p-6 hover:shadow-lg transition-shadow border-2 border-primary/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-bold text-lg">Face Identity Verification</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Cryptographic face fingerprinting with blockchain-secured proof of ownership
            </p>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow border-2 border-primary/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-bold text-lg">Voice Identity Verification</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Voice fingerprinting that travels with your audio across all platforms
            </p>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow border-2 border-primary/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Lock className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-bold text-lg">Blockchain Identity Certificates</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              On-chain certificates proving authenticity and ownership via Polygon network
            </p>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow border-2 border-primary/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Eye className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-bold text-lg">Granular Permissions</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Control AI use, advertiser access, clip usage, and training data permissions
            </p>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow border-2 border-primary/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-bold text-lg">Public Creator Identity Page</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Shareable verification page showing your certified identity assets
            </p>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow border-2 border-primary/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-bold text-lg">Transparent Audit Logs</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Every identity use is recorded on-chain for transparency and security
            </p>
          </Card>
        </div>

        <div className="text-center">
          <Button 
            size="lg" 
            onClick={() => navigate("/auth?mode=signup")}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg px-10 py-7 h-auto hover:scale-105 transition-transform"
          >
            Verify Your Identity
          </Button>
        </div>
      </div>
    </section>
  );
};
