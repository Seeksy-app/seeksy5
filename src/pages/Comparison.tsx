import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { Check, X, Sparkles, ArrowLeft } from "lucide-react";

const Comparison = () => {
  const navigate = useNavigate();

  const features = [
    { name: "AI Video Editing", seeksy: true, descript: true, capcut: true, opusclip: true, premiere: false },
    { name: "AI B-Roll Generation", seeksy: true, descript: false, capcut: false, opusclip: false, premiere: false },
    { name: "AI Thumbnail Generation", seeksy: true, descript: false, capcut: false, opusclip: false, premiere: false },
    { name: "Smart Camera Focus", seeksy: true, descript: true, capcut: false, opusclip: false, premiere: false },
    { name: "Auto Filler Word Removal", seeksy: true, descript: true, capcut: false, opusclip: false, premiere: false },
    { name: "AI Clip Suggestions", seeksy: true, descript: false, capcut: true, opusclip: true, premiere: false },
    { name: "Live Streaming Studio", seeksy: true, descript: false, capcut: false, opusclip: false, premiere: false },
    { name: "Podcast Hosting", seeksy: true, descript: true, capcut: false, opusclip: false, premiere: false },
    { name: "CRM & Contacts", seeksy: true, descript: false, capcut: false, opusclip: false, premiere: false },
    { name: "Email Marketing", seeksy: true, descript: false, capcut: false, opusclip: false, premiere: false },
    { name: "Event Management", seeksy: true, descript: false, capcut: false, opusclip: false, premiere: false },
    { name: "Project Management", seeksy: true, descript: false, capcut: false, opusclip: false, premiere: false },
    { name: "Creator Portfolio", seeksy: true, descript: false, capcut: false, opusclip: false, premiere: false },
    { name: "Ad Monetization", seeksy: true, descript: false, capcut: false, opusclip: false, premiere: false },
    { name: "Mobile App", seeksy: false, descript: true, capcut: true, opusclip: false, premiere: false },
  ];

  const pricing = [
    { tool: "Seeksy", price: "Pay as you go", subtext: "$9.99 for 10 credits", highlight: true },
    { tool: "Descript", price: "$30-50/mo", subtext: "Monthly subscription", highlight: false },
    { tool: "CapCut", price: "Free (limited)", subtext: "Paid tiers available", highlight: false },
    { tool: "OpusClip", price: "$29-129/mo", subtext: "Monthly subscription", highlight: false },
    { tool: "Adobe Premiere", price: "$55/mo", subtext: "Monthly subscription", highlight: false },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              onClick={() => navigate("/")}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
            <Button 
              onClick={() => navigate("/auth?mode=signup")}
              className="bg-gradient-to-r from-brand-gold to-brand-orange hover:opacity-90 text-black font-bold"
            >
              Get Started Free
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-gradient-to-r from-brand-gold to-brand-orange text-black">
            <Sparkles className="h-3 w-3 mr-1" />
            Feature Comparison
          </Badge>
          <h1 className="text-5xl md:text-7xl font-black mb-6">
            How <span className="bg-gradient-to-r from-brand-gold to-brand-orange bg-clip-text text-transparent">Seeksy</span> Compares
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            The only all-in-one creator platform with AI-powered video editing, live streaming, and complete business tools
          </p>
        </div>

        {/* Pricing Comparison */}
        <Card className="p-8 mb-12 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <h2 className="text-3xl font-bold mb-6 text-center">Pricing Comparison</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {pricing.map((item) => (
              <div 
                key={item.tool}
                className={`text-center p-6 rounded-lg ${
                  item.highlight 
                    ? 'bg-gradient-to-br from-brand-gold to-brand-orange text-black' 
                    : 'bg-card'
                }`}
              >
                <div className={`text-lg font-bold mb-2 ${item.highlight ? 'text-black' : ''}`}>
                  {item.tool}
                </div>
                <div className={`text-2xl font-black mb-1 ${item.highlight ? 'text-black' : 'text-primary'}`}>
                  {item.price}
                </div>
                <div className={`text-xs ${item.highlight ? 'text-black/70' : 'text-muted-foreground'}`}>
                  {item.subtext}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Feature Comparison Table */}
        <Card className="p-8">
          <h2 className="text-3xl font-bold mb-8 text-center">Feature Breakdown</h2>
          
          {/* Table Header */}
          <div className="grid grid-cols-6 gap-4 pb-4 border-b font-bold text-center">
            <div className="text-left">Feature</div>
            <div>
              <div className="font-black text-primary">Seeksy</div>
              <div className="text-xs text-muted-foreground">All-in-One</div>
            </div>
            <div>
              <div>Descript</div>
              <div className="text-xs text-muted-foreground">Video Editor</div>
            </div>
            <div>
              <div>CapCut</div>
              <div className="text-xs text-muted-foreground">Mobile First</div>
            </div>
            <div>
              <div>OpusClip</div>
              <div className="text-xs text-muted-foreground">Clip Tool</div>
            </div>
            <div>
              <div>Premiere</div>
              <div className="text-xs text-muted-foreground">Pro Editor</div>
            </div>
          </div>

          {/* Feature Rows */}
          <div className="space-y-2 mt-4">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="grid grid-cols-6 gap-4 py-3 hover:bg-muted/30 rounded-lg transition-colors items-center"
              >
                <div className="font-medium">{feature.name}</div>
                <div className="flex justify-center">
                  {feature.seeksy ? (
                    <div className="h-8 w-8 rounded-full bg-gradient-to-r from-brand-gold to-brand-orange flex items-center justify-center">
                      <Check className="h-5 w-5 text-black" />
                    </div>
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                      <X className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex justify-center">
                  {feature.descript ? (
                    <Check className="h-5 w-5 text-green-500" />
                  ) : (
                    <X className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex justify-center">
                  {feature.capcut ? (
                    <Check className="h-5 w-5 text-green-500" />
                  ) : (
                    <X className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex justify-center">
                  {feature.opusclip ? (
                    <Check className="h-5 w-5 text-green-500" />
                  ) : (
                    <X className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex justify-center">
                  {feature.premiere ? (
                    <Check className="h-5 w-5 text-green-500" />
                  ) : (
                    <X className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Key Differentiators */}
        <div className="grid md:grid-cols-3 gap-6 mt-12">
          <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <Sparkles className="h-10 w-10 mb-4 text-primary" />
            <h3 className="text-xl font-bold mb-2">AI-First Approach</h3>
            <p className="text-muted-foreground">
              Generate B-roll, thumbnails, and edit suggestions automatically. Other tools require manual work or stock libraries.
            </p>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <Sparkles className="h-10 w-10 mb-4 text-primary" />
            <h3 className="text-xl font-bold mb-2">Complete Creator Suite</h3>
            <p className="text-muted-foreground">
              Not just editing. Live streaming, podcasting, CRM, marketing, and monetization all in one platform.
            </p>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <Sparkles className="h-10 w-10 mb-4 text-primary" />
            <h3 className="text-xl font-bold mb-2">Credit-Based Pricing</h3>
            <p className="text-muted-foreground">
              No subscriptions. 1 credit = 1 activity. Buy credits in bulk and use them when you need them. Credits never expire.
            </p>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16 p-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 border-2 border-primary/30">
          <h2 className="text-4xl font-black mb-4">
            Ready to <span className="bg-gradient-to-r from-brand-gold to-brand-orange bg-clip-text text-transparent">Switch?</span>
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of creators who've made the switch to the most comprehensive creator platform
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg"
              onClick={() => navigate("/auth?mode=signup")}
              className="bg-gradient-to-r from-brand-gold to-brand-orange hover:opacity-90 text-black text-lg px-10 py-7 h-auto font-black shadow-lg"
            >
              Get Started Free
            </Button>
            <Button 
              size="lg"
              variant="outline"
              onClick={() => navigate("/pricing")}
              className="text-lg px-10 py-7 h-auto font-bold"
            >
              View Pricing
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Comparison;
