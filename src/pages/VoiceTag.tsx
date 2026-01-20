import { Shield, CheckCircle2, Lock, Globe, Waves, Fingerprint } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function VoiceTag() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <Shield className="h-4 w-4" />
            Certified Voice Technology
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
            Your Voice.<br />
            <span className="text-primary">Verified Forever.</span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Voice Tag uses blockchain technology and cryptographic voice fingerprinting 
            to prove authenticity and protect your content across all platforms.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => navigate('/signup')}>
              Get Started Free
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/login')}>
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Certified Voice Badge Preview */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto">
          <div className="relative rounded-2xl bg-card border-2 border-primary/20 p-8 shadow-2xl">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold shadow-lg">
                <CheckCircle2 className="h-4 w-4" />
                Certified Voice
              </div>
            </div>
            
            <div className="mt-8 space-y-4">
              <div className="flex items-start gap-3">
                <Fingerprint className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold">Unique Voice Fingerprint</h3>
                  <p className="text-sm text-muted-foreground">Cryptographically secured identity verification</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Lock className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold">Blockchain Certified</h3>
                  <p className="text-sm text-muted-foreground">Tamper-proof ownership and licensing records</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Globe className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold">Cross-Platform Protection</h3>
                  <p className="text-sm text-muted-foreground">Verified authenticity on Spotify, YouTube, and beyond</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">How Voice Tag Works</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="space-y-4 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Waves className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">1. Record Your Voice</h3>
              <p className="text-muted-foreground">
                Create content in Seeksy Studio with automatic voice fingerprint capture
              </p>
            </div>
            
            <div className="space-y-4 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Lock className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">2. Blockchain Certification</h3>
              <p className="text-muted-foreground">
                Your voice fingerprint is hashed and stored on-chain with licensing terms
              </p>
            </div>
            
            <div className="space-y-4 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">3. Universal Verification</h3>
              <p className="text-muted-foreground">
                Content carries your "Certified Voice" badge across all platforms
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why It Matters */}
      <section className="container mx-auto px-4 py-20 bg-muted/30">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-bold">Why Voice Tag Matters</h2>
            <p className="text-xl text-muted-foreground">
              In a world of deepfakes and synthetic content, authenticity is everything
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-3 p-6 rounded-xl bg-card border">
              <h3 className="text-xl font-semibold">Combat Deepfakes</h3>
              <p className="text-muted-foreground">
                By 2026, 90% of online content could be synthetic. Voice Tag proves your content is authentically yours.
              </p>
            </div>
            
            <div className="space-y-3 p-6 rounded-xl bg-card border">
              <h3 className="text-xl font-semibold">Protect Licensing</h3>
              <p className="text-muted-foreground">
                Control how your voice is used, with clear licensing terms embedded in blockchain certificates.
              </p>
            </div>
            
            <div className="space-y-3 p-6 rounded-xl bg-card border">
              <h3 className="text-xl font-semibold">Build Trust</h3>
              <p className="text-muted-foreground">
                Audiences see your "Certified Voice" badge and know they're hearing the real you.
              </p>
            </div>
            
            <div className="space-y-3 p-6 rounded-xl bg-card border">
              <h3 className="text-xl font-semibold">Future-Proof</h3>
              <p className="text-muted-foreground">
                Built on C2PA standards, compatible with industry initiatives from Adobe, BBC, and OpenAI.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto text-center space-y-8 p-12 rounded-2xl bg-primary/5 border-2 border-primary/20">
          <h2 className="text-4xl font-bold">Start Protecting Your Voice Today</h2>
          <p className="text-xl text-muted-foreground">
            Join creators who are taking control of their content authenticity
          </p>
          <Button size="lg" onClick={() => navigate('/signup')}>
            Create Free Account
          </Button>
        </div>
      </section>
    </div>
  );
}
