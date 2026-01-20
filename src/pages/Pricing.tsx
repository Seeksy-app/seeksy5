import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X, Zap, HardDrive, Video, Radio } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Pricing = () => {
  const navigate = useNavigate();

  const creditPackages = [
    {
      name: "Starter",
      credits: 300,
      price: 19,
      perCredit: "0.063",
      description: "Perfect for casual creators",
      popular: false,
    },
    {
      name: "Creator",
      credits: 600,
      price: 39,
      perCredit: "0.065",
      description: "For regular content production",
      popular: false,
    },
    {
      name: "Pro",
      credits: 1200,
      price: 79,
      perCredit: "0.066",
      description: "Best value for active creators",
      popular: true,
    },
    {
      name: "Power User",
      credits: 2500,
      price: 149,
      perCredit: "0.060",
      description: "For serious content production",
      popular: false,
    },
    {
      name: "Studio Team",
      credits: 5000,
      price: 279,
      perCredit: "0.056",
      description: "Maximum value for teams",
      popular: false,
    },
  ];

  const creditUsageCosts = [
    { action: "Recording", cost: "1 credit/min", icon: Video },
    { action: "Streaming", cost: "1.5 credits/min", icon: Radio },
    { action: "Extra Storage", cost: "10 credits/GB", icon: HardDrive },
    { action: "AI Clips", cost: "3 credits each", icon: Zap },
    { action: "AI Enhancements", cost: "2 credits each", icon: Zap },
    { action: "Transcription", cost: "1 credit/10 min", icon: Zap },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-primary cursor-pointer" onClick={() => navigate("/")}>
            Seeksy
          </h2>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate("/auth?mode=login")}>
              Log In
            </Button>
            <Button onClick={() => navigate("/auth?mode=signup")}>
              Sign Up
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Usage-Based Credit Pricing</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            1 credit = 1 minute of usage. No subscriptions. Pay for what you use.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Badge variant="outline" className="px-4 py-2 text-sm">
              $0.055–$0.065 per credit
            </Badge>
            <Badge variant="secondary" className="px-4 py-2 text-sm">
              🎁 New users get 5 free credits
            </Badge>
          </div>
        </div>

        {/* Free Tier Highlight */}
        <Card className="p-6 mb-12 max-w-4xl mx-auto border-primary/30 bg-primary/5">
          <h3 className="text-xl font-bold mb-4 text-center">Free Monthly Limits for All Creators</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center p-4 rounded-lg bg-background">
              <HardDrive className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="text-3xl font-bold text-primary">25 GB</div>
              <div className="text-muted-foreground">Free Storage</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-background">
              <Video className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="text-3xl font-bold text-primary">10 hours</div>
              <div className="text-muted-foreground">Recording/month</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-background">
              <Radio className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="text-3xl font-bold text-primary">5 hours</div>
              <div className="text-muted-foreground">Livestream/month</div>
            </div>
          </div>
          <p className="text-center text-sm text-muted-foreground mt-4">
            After these limits, usage deducts credits from your balance.
          </p>
        </Card>

        {/* Credit Packages */}
        <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-6 max-w-7xl mx-auto mb-12">
          {creditPackages.map((pkg) => (
            <Card
              key={pkg.name}
              className={`p-6 relative ${
                pkg.popular
                  ? "border-2 border-primary shadow-lg ring-2 ring-primary/20 scale-105"
                  : "border border-border"
              }`}
            >
              {pkg.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-semibold">
                  Best Value
                </div>
              )}
              <div className="text-center mb-4">
                <h3 className="text-xl font-bold mb-1">{pkg.name}</h3>
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Zap className="h-5 w-5 text-primary" />
                  <span className="text-3xl font-bold text-primary">{pkg.credits.toLocaleString()}</span>
                </div>
                <div className="text-xs text-muted-foreground mb-2">credits</div>
                <div className="text-2xl font-bold">${pkg.price}</div>
                <div className="text-xs text-muted-foreground">${pkg.perCredit} per credit</div>
              </div>
              <p className="text-sm text-muted-foreground text-center mb-4">{pkg.description}</p>
              <Button
                className="w-full"
                variant={pkg.popular ? "default" : "outline"}
                onClick={() => navigate("/auth?mode=signup")}
              >
                Buy Credits
              </Button>
            </Card>
          ))}
        </div>

        {/* Credit Usage Costs */}
        <Card className="p-8 mb-20 max-w-4xl mx-auto">
          <h3 className="text-2xl font-bold mb-6 text-center">How Credits Are Used</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {creditUsageCosts.map((item, index) => (
              <div key={index} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                <item.icon className="h-5 w-5 text-primary flex-shrink-0" />
                <div>
                  <div className="font-medium">{item.action}</div>
                  <div className="text-sm text-muted-foreground">{item.cost}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Comparison Table */}
        <section className="max-w-7xl mx-auto mb-20">
          <h2 className="text-3xl font-bold text-center mb-4">How We Compare</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            See how Seeksy stacks up against other podcast and streaming platforms
          </p>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3 font-semibold">Feature</th>
                  <th className="text-center p-3 font-semibold">
                    <div className="text-primary text-base">Seeksy</div>
                  </th>
                  <th className="text-center p-3 font-semibold text-muted-foreground">Riverside</th>
                  <th className="text-center p-3 font-semibold text-muted-foreground">Descript</th>
                  <th className="text-center p-3 font-semibold text-muted-foreground">Anchor</th>
                  <th className="text-center p-3 font-semibold text-muted-foreground">Streamyard</th>
                  <th className="text-center p-3 font-semibold text-muted-foreground">Restream</th>
                  <th className="text-center p-3 font-semibold text-muted-foreground">Zoom</th>
                  <th className="text-center p-3 font-semibold text-muted-foreground">OBS</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border">
                  <td className="p-3">Free Recording Hours</td>
                  <td className="text-center p-3 font-semibold text-primary">10 hrs/mo</td>
                  <td className="text-center p-3 text-muted-foreground">2 hrs/mo</td>
                  <td className="text-center p-3 text-muted-foreground">1 hr/mo</td>
                  <td className="text-center p-3 text-muted-foreground">Unlimited*</td>
                  <td className="text-center p-3 text-muted-foreground">20 hrs/mo</td>
                  <td className="text-center p-3 text-muted-foreground">Limited</td>
                  <td className="text-center p-3 text-muted-foreground">40 min</td>
                  <td className="text-center p-3 text-muted-foreground">Unlimited</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="p-3">Free Storage</td>
                  <td className="text-center p-3 font-semibold text-primary">25 GB</td>
                  <td className="text-center p-3 text-muted-foreground">5 GB</td>
                  <td className="text-center p-3 text-muted-foreground">10 GB</td>
                  <td className="text-center p-3 text-muted-foreground">Unlimited*</td>
                  <td className="text-center p-3 text-muted-foreground">4 hrs stored</td>
                  <td className="text-center p-3 text-muted-foreground">None</td>
                  <td className="text-center p-3 text-muted-foreground">Local only</td>
                  <td className="text-center p-3 text-muted-foreground">Local only</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="p-3">AI Clip Generation</td>
                  <td className="text-center p-3"><Check className="h-5 w-5 text-primary mx-auto" /></td>
                  <td className="text-center p-3"><Check className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                  <td className="text-center p-3"><Check className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                  <td className="text-center p-3"><X className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                  <td className="text-center p-3"><X className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                  <td className="text-center p-3"><X className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                  <td className="text-center p-3"><X className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                  <td className="text-center p-3"><X className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                </tr>
                <tr className="border-b border-border">
                  <td className="p-3">Ad Monetization</td>
                  <td className="text-center p-3"><Check className="h-5 w-5 text-primary mx-auto" /></td>
                  <td className="text-center p-3"><X className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                  <td className="text-center p-3"><X className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                  <td className="text-center p-3"><Check className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                  <td className="text-center p-3"><X className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                  <td className="text-center p-3"><X className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                  <td className="text-center p-3"><X className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                  <td className="text-center p-3"><X className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                </tr>
                <tr className="border-b border-border">
                  <td className="p-3">Live Streaming</td>
                  <td className="text-center p-3"><Check className="h-5 w-5 text-primary mx-auto" /></td>
                  <td className="text-center p-3"><Check className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                  <td className="text-center p-3"><X className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                  <td className="text-center p-3"><X className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                  <td className="text-center p-3"><Check className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                  <td className="text-center p-3"><Check className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                  <td className="text-center p-3"><Check className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                  <td className="text-center p-3"><Check className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                </tr>
                <tr className="border-b border-border">
                  <td className="p-3">Multi-Platform Streaming</td>
                  <td className="text-center p-3"><Check className="h-5 w-5 text-primary mx-auto" /></td>
                  <td className="text-center p-3"><Check className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                  <td className="text-center p-3"><X className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                  <td className="text-center p-3"><X className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                  <td className="text-center p-3"><Check className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                  <td className="text-center p-3"><Check className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                  <td className="text-center p-3"><X className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                  <td className="text-center p-3">Plugin req.</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="p-3">Browser-Based</td>
                  <td className="text-center p-3"><Check className="h-5 w-5 text-primary mx-auto" /></td>
                  <td className="text-center p-3"><Check className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                  <td className="text-center p-3"><Check className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                  <td className="text-center p-3"><Check className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                  <td className="text-center p-3"><Check className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                  <td className="text-center p-3"><Check className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                  <td className="text-center p-3"><Check className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                  <td className="text-center p-3"><X className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                </tr>
                <tr className="border-b border-border">
                  <td className="p-3">Pricing Model</td>
                  <td className="text-center p-3 font-semibold text-primary">Pay-as-you-go</td>
                  <td className="text-center p-3 text-muted-foreground">$19/mo+</td>
                  <td className="text-center p-3 text-muted-foreground">$24/mo+</td>
                  <td className="text-center p-3 text-muted-foreground">Free*</td>
                  <td className="text-center p-3 text-muted-foreground">$25/mo+</td>
                  <td className="text-center p-3 text-muted-foreground">$19/mo+</td>
                  <td className="text-center p-3 text-muted-foreground">$16/mo+</td>
                  <td className="text-center p-3 text-muted-foreground">Free</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-4">
            *Anchor/Spotify limitations apply for monetization and distribution. OBS requires technical setup and plugins for advanced features.
          </p>
        </section>

        {/* FAQ */}
        <section className="max-w-4xl mx-auto mb-20">
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-3">How does the credit system work?</h3>
              <p className="text-muted-foreground">
                Credits represent platform usage time and AI actions. 1 credit ≈ 1 minute of recording. 
                You get generous free limits each month, and only use credits when you exceed them or 
                use premium AI features.
              </p>
            </Card>

            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-3">What's included for free?</h3>
              <p className="text-muted-foreground">
                Every creator gets 25 GB storage, 10 hours of recording, and 5 hours of livestreaming 
                free each month. You also get 5 starter credits when you sign up!
              </p>
            </Card>

            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-3">Do credits expire?</h3>
              <p className="text-muted-foreground">
                No! Purchased credits never expire. Use them whenever you need them. Your free monthly 
                limits reset at the start of each month.
              </p>
            </Card>

            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-3">Can I set up auto-renew?</h3>
              <p className="text-muted-foreground">
                Yes! Enable auto-renew to automatically purchase your preferred package when your 
                credit balance drops below 100 or when you're approaching usage limits.
              </p>
            </Card>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center max-w-2xl mx-auto">
          <Card className="p-12 bg-gradient-to-br from-primary/10 via-background to-secondary/10 border-2 border-primary/20">
            <h2 className="text-3xl font-bold mb-4">Ready to Start Creating?</h2>
            <p className="text-lg text-muted-foreground mb-6">
              Join thousands of creators using Seeksy to produce professional content
            </p>
            <Button size="lg" onClick={() => navigate("/auth?mode=signup")}>
              Start Free Today
            </Button>
          </Card>
        </section>
      </main>

      <footer className="border-t border-border py-8 text-center text-muted-foreground mt-20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-center items-center gap-4 mb-4">
            <a href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</a>
            <span className="hidden md:inline">•</span>
            <a href="/terms" className="hover:text-primary transition-colors">Terms & Conditions</a>
            <span className="hidden md:inline">•</span>
            <a href="/cookies" className="hover:text-primary transition-colors">Cookie Policy</a>
          </div>
          <p>© 2024 Seeksy. Connecting Your Way.</p>
        </div>
      </footer>
    </div>
  );
};

export default Pricing;