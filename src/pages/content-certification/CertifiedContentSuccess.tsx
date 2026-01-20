import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle, Shield, ExternalLink, Tag } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import confetti from "canvas-confetti";

interface AdReadEvent {
  timestamp: number;
  adScriptId: string;
  adScriptTitle: string;
  duration: number;
}

const CertifiedContentSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showConfetti, setShowConfetti] = useState(false);
  
  const voiceData = location.state?.voiceData?.selectedVoice || {
    voiceName: "Christy Louis"
  };
  const authenticityData = location.state?.authenticityData || {
    overallScore: 88
  };
  const certificateId = location.state?.certificateId || "cert_1234567890";
  const tokenId = location.state?.tokenId || "87654321";
  const blockchain = location.state?.blockchain || "Polygon";
  const adReadEvents: AdReadEvent[] = location.state?.adReadEvents || [];

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    // Trigger confetti animation
    setShowConfetti(true);
    
    const duration = 3000;
    const animationEnd = Date.now() + duration;

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        clearInterval(interval);
        return;
      }

      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#2C6BED', '#00D4FF', '#FFD700', '#FF6B9D']
      });
      
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#2C6BED', '#00D4FF', '#FFD700', '#FF6B9D']
      });
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-brand-navy flex items-center justify-center p-4 relative overflow-hidden">
      {/* Confetti background effect */}
      <div className="absolute inset-0 pointer-events-none">
        {showConfetti && (
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent animate-pulse"></div>
        )}
      </div>

      <Card className="max-w-xl w-full bg-card p-8 space-y-6 relative z-10">
        {/* Success Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center animate-scale-in">
            <CheckCircle className="h-12 w-12 text-primary" />
          </div>
        </div>

        <h1 className="text-4xl font-bold text-center">Success: Content Certified!</h1>

        {/* Certificate Card */}
        <Card className="bg-muted/50 p-6 space-y-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
              <Shield className="h-8 w-8 text-white" />
            </div>
            
            <div className="flex-1">
              <h3 className="text-xl font-bold mb-1">Content Authenticity Certificate</h3>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-primary">Blockchain Verified</span>
              </div>
            </div>
          </div>

          {/* Certificate Details */}
          <div className="space-y-3 border-t border-border pt-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Primary Voice:</span>
              <span className="font-medium">{voiceData.voiceName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Authenticity Score:</span>
              <span className={`font-bold ${
                authenticityData.overallScore >= 80 ? "text-green-500" : 
                authenticityData.overallScore >= 60 ? "text-yellow-500" : "text-red-500"
              }`}>
                {authenticityData.overallScore}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Certificate ID:</span>
              <span className="font-mono text-xs font-semibold">{certificateId}</span>
            </div>
          </div>

          {/* Blockchain Info */}
          <div className="text-center pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground mb-2">
              NFT Certificate Minted on {blockchain}
            </p>
            <p className="text-xs">
              Token ID: <span className="font-mono font-semibold text-foreground">{tokenId}</span>
            </p>
            
            <Button
              variant="ghost"
              size="sm"
              className="mt-3 text-primary hover:text-primary/80"
            >
              <ExternalLink className="mr-2 h-3 w-3" />
              View on Blockchain
            </Button>
          </div>
        </Card>

        {/* Ad Read Events Section */}
        {adReadEvents.length > 0 && (
          <Card className="bg-muted/50 p-6 space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Tag className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-bold">Certified Ad Reads in This Episode</h3>
            </div>

            <p className="text-sm text-muted-foreground mb-4">
              The following ad reads are now part of this certified content:
            </p>

            <div className="space-y-3">
              {adReadEvents.map((adRead, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center p-3 rounded-lg bg-background/50 border border-border"
                >
                  <div className="space-y-1">
                    <p className="font-semibold text-sm">{adRead.adScriptTitle}</p>
                    <p className="text-xs text-muted-foreground">
                      Duration: {adRead.duration}s
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono font-semibold text-primary">
                      {formatTime(adRead.timestamp)}
                    </p>
                    <p className="text-xs text-green-600 font-medium">✓ Certified</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* View Profile Button */}
        <div className="flex justify-center pt-4">
          <Button
            size="lg"
            onClick={() => navigate("/voice-credentials")}
            className="bg-primary hover:bg-primary/90 text-lg px-12 py-6"
          >
            View My Certificates
          </Button>
        </div>

        <div className="text-center pt-6">
          <p className="text-foreground font-bold">Seeksy</p>
          <p className="text-muted-foreground text-xs mt-1">Content Authenticity Platform</p>
        </div>
      </Card>
    </div>
  );
};

export default CertifiedContentSuccess;
