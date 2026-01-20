import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { 
  Target, 
  Calculator, 
  TrendingUp, 
  BarChart3, 
  ArrowRight,
  Sparkles,
  Clock
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function BusinessToolsLanding() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background p-6 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-4 py-8">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground">
            Business Tools to Turn Your Show into a Real Business
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
            Start with an AI-ready Go-To-Market plan. Soon you'll be able to map revenue, 
            benchmarks, and sponsorships directly from your Seeksy data.
          </p>
        </div>

        {/* Tools Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* GTM Builder - Active */}
          <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 to-transparent hover:shadow-lg transition-shadow">
            <div className="absolute top-3 right-3">
              <Badge className="bg-primary text-primary-foreground">Active</Badge>
            </div>
            <CardHeader>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <Target className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="text-xl">GTM Builder</CardTitle>
              <CardDescription className="text-base">
                Create a go-to-market plan in minutes. Guided onboarding tuned for 
                podcasters, guests, influencers, speakers, and agencies.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => navigate('/business-tools/gtm')} 
                className="w-full gap-2"
              >
                Open GTM Builder
                <ArrowRight className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>

          {/* Pricing Model Assistant - Coming Soon */}
          <Card className="relative overflow-hidden opacity-75 hover:opacity-90 transition-opacity">
            <div className="absolute top-3 right-3">
              <Badge variant="secondary" className="gap-1">
                <Clock className="w-3 h-3" />
                Coming Soon
              </Badge>
            </div>
            <CardHeader>
              <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-4">
                <Calculator className="w-6 h-6 text-muted-foreground" />
              </div>
              <CardTitle className="text-xl">Pricing Model Assistant</CardTitle>
              <CardDescription className="text-base">
                Calculate sponsorship rates, ad pricing, and audience value based on 
                real market data and your unique metrics.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" disabled className="w-full gap-2">
                <Sparkles className="w-4 h-4" />
                Coming Soon
              </Button>
            </CardContent>
          </Card>

          {/* Sponsorship Planner - Coming Soon */}
          <Card className="relative overflow-hidden opacity-75 hover:opacity-90 transition-opacity">
            <div className="absolute top-3 right-3">
              <Badge variant="secondary" className="gap-1">
                <Clock className="w-3 h-3" />
                Coming Soon
              </Badge>
            </div>
            <CardHeader>
              <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-muted-foreground" />
              </div>
              <CardTitle className="text-xl">Sponsorship & Ad Inventory Planner</CardTitle>
              <CardDescription className="text-base">
                Plan your ad inventory, forecast revenue, and manage sponsor relationships 
                with AI-powered recommendations.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" disabled className="w-full gap-2">
                <Sparkles className="w-4 h-4" />
                Coming Soon
              </Button>
            </CardContent>
          </Card>

          {/* Benchmark Explorer - Coming Soon */}
          <Card className="relative overflow-hidden opacity-75 hover:opacity-90 transition-opacity">
            <div className="absolute top-3 right-3">
              <Badge variant="secondary" className="gap-1">
                <Clock className="w-3 h-3" />
                Coming Soon
              </Badge>
            </div>
            <CardHeader>
              <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-muted-foreground" />
              </div>
              <CardTitle className="text-xl">Creator Benchmark Explorer</CardTitle>
              <CardDescription className="text-base">
                Explore real benchmarks from our R&D Intelligence engine. See how your 
                metrics compare to industry standards.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" disabled className="w-full gap-2">
                <Sparkles className="w-4 h-4" />
                Powered by R&D Intelligence
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Bottom CTA */}
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">
            Ready to build your go-to-market strategy?
          </p>
          <Button size="lg" onClick={() => navigate('/business-tools/gtm/new')} className="gap-2">
            <Target className="w-5 h-5" />
            Start Your GTM Plan
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
