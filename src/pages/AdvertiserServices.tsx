import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Target, Phone, Image, TrendingUp, Shield, Zap } from "lucide-react";
import heroVirtualStudio from "@/assets/hero-virtual-studio.jpg";

const AdvertiserServices = () => {
  const navigate = useNavigate();

  // Check if user has already seen this page
  useEffect(() => {
    const hasSeenAdvertiserServices = localStorage.getItem("hasSeenAdvertiserServices");
    if (hasSeenAdvertiserServices === "true") {
      // Redirect to advertiser signup if they've already seen this page
      navigate("/advertiser/signup", { replace: true });
    } else {
      // Mark as seen
      localStorage.setItem("hasSeenAdvertiserServices", "true");
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-gradient-to-r from-brand-navy via-brand-blue to-brand-navy backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white cursor-pointer" onClick={() => navigate("/")}>
              Seeksy
            </h2>
            
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                onClick={() => navigate("/")} 
                className="text-white hover:bg-white/10 border border-white/20"
              >
                Back to Home
              </Button>
              <Button 
                onClick={() => navigate("/advertiser/signup")} 
                className="bg-brand-gold hover:bg-brand-gold/90 text-brand-navy font-bold"
              >
                Apply for Pricing
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img 
              src={heroVirtualStudio} 
              alt="Advertising Services" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-brand-red/95 via-brand-darkRed/90 to-brand-navy/95" />
          </div>
          
          <div className="container relative z-10 mx-auto px-4 py-32 md:py-40">
            <div className="max-w-4xl mx-auto text-center text-white">
              <h1 className="text-6xl md:text-7xl font-black mb-6 leading-tight">
                Reach Engaged <span className="text-brand-gold">Audiences</span>
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-white/90 max-w-3xl mx-auto">
                Connect with podcast listeners and content consumers through our premium advertising platform. 
                Multiple formats, transparent pricing, real-time tracking.
              </p>
              <Button 
                size="lg" 
                onClick={() => navigate("/advertiser/signup")} 
                className="bg-brand-gold hover:bg-brand-gold/90 text-brand-navy text-lg px-10 py-7 h-auto font-bold shadow-xl hover:scale-105 transition-transform"
              >
                Apply for Pricing <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </section>

        {/* Why Advertise Section */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-black mb-4 bg-gradient-to-r from-brand-red to-brand-darkRed bg-clip-text text-transparent">
                Why Choose Seeksy?
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Premium podcast advertising with unprecedented transparency
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <Card className="p-8 text-center bg-gradient-to-br from-background to-brand-red/5 border-brand-red/20 hover:border-brand-red hover:shadow-xl transition-all">
                <div className="h-16 w-16 mx-auto mb-6 bg-gradient-to-br from-brand-red to-brand-darkRed rounded-2xl flex items-center justify-center shadow-lg">
                  <Target className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4">70% Creator Share</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Industry-leading revenue split ensures quality content and engaged audiences
                </p>
              </Card>

              <Card className="p-8 text-center bg-gradient-to-br from-background to-brand-gold/5 border-brand-gold/20 hover:border-brand-gold hover:shadow-xl transition-all">
                <div className="h-16 w-16 mx-auto mb-6 bg-gradient-to-br from-brand-gold to-brand-gold/60 rounded-2xl flex items-center justify-center shadow-lg">
                  <TrendingUp className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Real-Time Tracking</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Monitor impressions, clicks, and conversions as they happen
                </p>
              </Card>

              <Card className="p-8 text-center bg-gradient-to-br from-background to-brand-navy/5 border-brand-navy/20 hover:border-brand-navy hover:shadow-xl transition-all">
                <div className="h-16 w-16 mx-auto mb-6 bg-gradient-to-br from-brand-navy to-brand-blue rounded-2xl flex items-center justify-center shadow-lg">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4">CPM-Based Pricing</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Pay only for delivered impressions with transparent, tiered pricing
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* Ad Formats Section */}
        <section className="py-20 bg-gradient-to-br from-brand-navy/5 to-brand-blue/5">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-black mb-4 bg-gradient-to-r from-brand-blue to-brand-navy bg-clip-text text-transparent">
                Flexible Ad Formats
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Choose the format that best fits your brand and campaign goals
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {/* Standard Audio Ads */}
              <Card className="p-10 bg-white dark:bg-background border-2 hover:border-brand-gold hover:shadow-2xl transition-all group">
                <div className="h-20 w-20 mx-auto mb-6 bg-gradient-to-br from-brand-gold to-brand-gold/60 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Zap className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-center">Standard Audio Ads</h3>
                <p className="text-muted-foreground mb-6 text-center leading-relaxed">
                  Traditional podcast advertising with pre-roll, mid-roll, and post-roll placement options
                </p>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start gap-2">
                    <span className="text-brand-gold mt-1">✓</span>
                    <span className="text-sm">AI-assisted script writing</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand-gold mt-1">✓</span>
                    <span className="text-sm">Professional voice generation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand-gold mt-1">✓</span>
                    <span className="text-sm">15s, 30s, 60s durations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand-gold mt-1">✓</span>
                    <span className="text-sm">CPM-based pricing</span>
                  </li>
                </ul>
                <p className="text-center font-bold text-brand-navy dark:text-brand-gold text-lg">
                  Starting at $12-25 CPM
                </p>
              </Card>

              {/* Conversational AI Ads */}
              <Card className="p-10 bg-gradient-to-br from-brand-blue/10 to-brand-navy/10 border-2 border-brand-blue hover:border-brand-gold hover:shadow-2xl transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-brand-gold text-brand-navy text-xs font-bold px-3 py-1 rounded-bl-lg">
                  PREMIUM
                </div>
                <div className="h-20 w-20 mx-auto mb-6 bg-gradient-to-br from-brand-blue to-brand-navy rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Phone className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-center">Conversational AI Ads</h3>
                <p className="text-muted-foreground mb-6 text-center leading-relaxed">
                  Interactive phone-based ads powered by AI that engage listeners in real conversations
                </p>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start gap-2">
                    <span className="text-brand-blue mt-1">✓</span>
                    <span className="text-sm">AI-powered conversations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand-blue mt-1">✓</span>
                    <span className="text-sm">Shared or custom phone number</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand-blue mt-1">✓</span>
                    <span className="text-sm">Real-time lead qualification</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand-blue mt-1">✓</span>
                    <span className="text-sm">Pay per conversation minute</span>
                  </li>
                </ul>
                <p className="text-center font-bold text-brand-navy dark:text-brand-gold text-lg">
                  $50 setup + $0.25/min
                </p>
              </Card>

              {/* Digital Ads */}
              <Card className="p-10 bg-white dark:bg-background border-2 hover:border-brand-red hover:shadow-2xl transition-all group">
                <div className="h-20 w-20 mx-auto mb-6 bg-gradient-to-br from-brand-red to-brand-darkRed rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Image className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-center">Digital Ads</h3>
                <p className="text-muted-foreground mb-6 text-center leading-relaxed">
                  Visual ads for websites and social media platforms with full customization
                </p>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start gap-2">
                    <span className="text-brand-red mt-1">✓</span>
                    <span className="text-sm">Multiple ad sizes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand-red mt-1">✓</span>
                    <span className="text-sm">Social media formats</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand-red mt-1">✓</span>
                    <span className="text-sm">Custom CTA links</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand-red mt-1">✓</span>
                    <span className="text-sm">Hashtag & mention support</span>
                  </li>
                </ul>
                <p className="text-center font-bold text-brand-navy dark:text-brand-gold text-lg">
                  Custom Pricing
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-black mb-4">How It Works</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Start advertising in four simple steps
              </p>
            </div>

            <div className="grid md:grid-cols-4 gap-8 max-w-6xl mx-auto">
              <div className="text-center">
                <div className="h-16 w-16 mx-auto mb-4 bg-brand-gold rounded-full flex items-center justify-center text-2xl font-black text-brand-navy">
                  1
                </div>
                <h3 className="text-xl font-bold mb-2">Apply</h3>
                <p className="text-muted-foreground">
                  Submit your application and get approved
                </p>
              </div>

              <div className="text-center">
                <div className="h-16 w-16 mx-auto mb-4 bg-brand-blue rounded-full flex items-center justify-center text-2xl font-black text-white">
                  2
                </div>
                <h3 className="text-xl font-bold mb-2">Create</h3>
                <p className="text-muted-foreground">
                  Design your ad with our AI-powered tools
                </p>
              </div>

              <div className="text-center">
                <div className="h-16 w-16 mx-auto mb-4 bg-brand-navy rounded-full flex items-center justify-center text-2xl font-black text-white">
                  3
                </div>
                <h3 className="text-xl font-bold mb-2">Launch</h3>
                <p className="text-muted-foreground">
                  Set your budget and targeting preferences
                </p>
              </div>

              <div className="text-center">
                <div className="h-16 w-16 mx-auto mb-4 bg-brand-red rounded-full flex items-center justify-center text-2xl font-black text-white">
                  4
                </div>
                <h3 className="text-xl font-bold mb-2">Track</h3>
                <p className="text-muted-foreground">
                  Monitor performance in real-time
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-32 bg-gradient-to-br from-brand-navy via-brand-blue to-brand-navy relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE0YzMuMzEzIDAgNiAyLjY4NyA2IDZzLTIuNjg3IDYtNiA2LTYtMi42ODctNi02IDIuNjg3LTYgNi02ek0yMCA0MGMzLjMxMyAwIDYgMi42ODcgNiA2cy0yLjY4NyA2LTYgNi02LTIuNjg3LTYtNiAyLjY4Ny02IDYtNnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30" />
          
          <div className="container relative z-10 mx-auto px-4 text-center max-w-4xl">
            <h2 className="text-5xl md:text-6xl font-black mb-6 text-white">
              Ready to Get Started?
            </h2>
            <p className="text-2xl text-white/90 mb-10 leading-relaxed">
              Apply for pricing and join brands already reaching engaged audiences on Seeksy
            </p>
            <Button 
              size="lg" 
              onClick={() => navigate("/advertiser/signup")} 
              className="bg-brand-gold hover:bg-brand-gold/90 text-brand-navy font-bold text-xl px-12 py-8 h-auto hover:scale-105 transition-transform shadow-2xl"
            >
              Apply for Pricing <ArrowRight className="ml-2 h-6 w-6" />
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-12 bg-gradient-to-r from-brand-navy/10 to-brand-blue/10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-center items-center gap-6 mb-6">
            <a href="/pricing" className="text-lg hover:text-brand-gold transition-colors font-medium">Pricing</a>
            <span className="hidden md:inline text-brand-gold">•</span>
            <a href="/system-status" className="text-lg hover:text-brand-gold transition-colors font-medium">System Status</a>
            <span className="hidden md:inline text-brand-gold">•</span>
            <a href="/privacy" className="text-lg hover:text-brand-gold transition-colors font-medium">Privacy Policy</a>
            <span className="hidden md:inline text-brand-gold">•</span>
            <a href="/terms" className="text-lg hover:text-brand-gold transition-colors font-medium">Terms & Conditions</a>
          </div>
          <p className="text-center text-muted-foreground text-lg">© 2024 Seeksy. Connecting Your Way.</p>
        </div>
      </footer>
    </div>
  );
};

export default AdvertiserServices;
