import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Scissors, ShieldCheck, Folder, Share2, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const ClipsSection = () => {
  const navigate = useNavigate();

  return (
    <section className="py-24 bg-gradient-to-b from-secondary/10 to-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Scissors className="h-12 w-12 text-primary" />
            <h2 className="text-5xl md:text-6xl font-black bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              AI Clips With On-Chain Certificates
            </h2>
          </div>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto font-medium">
            Create, organize, certify, and share professional clips instantly.
          </p>
        </div>

        <div className="max-w-5xl mx-auto mb-12">
          <Card className="p-8 bg-gradient-to-br from-primary/5 to-secondary/5 border-2 border-primary/20">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                    <Sparkles className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold mb-1">11+ Professional Templates</h3>
                    <p className="text-sm text-muted-foreground">
                      Choose from pre-designed templates optimized for social media platforms
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold mb-1">Blockchain Clip Certificates</h3>
                    <p className="text-sm text-muted-foreground">
                      Every clip can be certified on-chain proving authenticity and ownership
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                    <Folder className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold mb-1">Media Vault Organization</h3>
                    <p className="text-sm text-muted-foreground">
                      Organize clips into collections with folder-based management system
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                    <Scissors className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold mb-1">Automatic Shotstack Renders</h3>
                    <p className="text-sm text-muted-foreground">
                      AI-powered rendering with vertical and thumbnail format outputs
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                    <Share2 className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold mb-1">Ready for Advertisers & Sponsors</h3>
                    <p className="text-sm text-muted-foreground">
                      Certified clips signal trust to brands looking for authentic content
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <Badge className="mb-2">New Feature</Badge>
                  <p className="text-sm font-medium">
                    Clips automatically include certification watermarks when identity is verified
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="text-center">
          <Button 
            size="lg" 
            onClick={() => navigate("/auth?mode=signup")}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg px-10 py-7 h-auto hover:scale-105 transition-transform"
          >
            <Scissors className="h-5 w-5 mr-2" />
            Create a Clip
          </Button>
        </div>
      </div>
    </section>
  );
};
