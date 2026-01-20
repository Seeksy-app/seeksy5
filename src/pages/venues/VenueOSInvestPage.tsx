import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  ArrowRight, 
  CalendarCheck, 
  Users, 
  Megaphone, 
  Video, 
  Bot, 
  DollarSign,
  TrendingUp,
  Building2,
  Zap,
  Check,
  Globe
} from "lucide-react";

const colors = {
  primary: "#053877",
  primaryLight: "#2C6BED",
  background: "#F5F7FF",
  surface: "#FFFFFF",
};

const marketStats = [
  { label: "Global Events Market", value: "$1.5T", growth: "+11.2% CAGR" },
  { label: "Venue Management SaaS", value: "$4.8B", growth: "+15% by 2028" },
  { label: "Creator Economy", value: "$250B", growth: "Growing rapidly" },
];

const features = [
  {
    icon: CalendarCheck,
    title: "Smart Booking System",
    description: "AI-powered booking assistant with availability management, holds, and automated follow-ups.",
  },
  {
    icon: Users,
    title: "Client CRM",
    description: "Track every client, event, and communication in one unified timeline.",
  },
  {
    icon: Megaphone,
    title: "Influencer Marketplace",
    description: "Connect with verified creators to promote venues and drive bookings.",
  },
  {
    icon: Video,
    title: "Media Studio",
    description: "Create promo videos, virtual tours, and livestreams with AI assistance.",
  },
  {
    icon: Bot,
    title: "AI Venue Manager",
    description: "24/7 AI assistant for pricing, proposals, and client communications.",
  },
  {
    icon: DollarSign,
    title: "Payment Processing",
    description: "Integrated Stripe payments for deposits, invoices, and final balances.",
  },
];

const revenueStreams = [
  {
    title: "SaaS Subscriptions",
    description: "Monthly/annual subscriptions for venue management platform",
    model: "Starter: Free, Pro: $99/mo, Enterprise: Custom",
  },
  {
    title: "Payment Processing",
    description: "Revenue share on payment processing through integrated Stripe",
    model: "2.5% + platform fee on transactions",
  },
  {
    title: "Influencer Marketplace",
    description: "Commission on influencer campaigns booked through platform",
    model: "15% of campaign value",
  },
  {
    title: "Premium Add-ons",
    description: "AI credits, advanced analytics, white-label solutions",
    model: "Usage-based pricing",
  },
];

const whyNow = [
  {
    icon: Globe,
    title: "Post-Pandemic Venue Boom",
    description: "Live events are surging. Venues need modern tools to capture demand.",
  },
  {
    icon: TrendingUp,
    title: "Creator Economy Intersection",
    description: "Influencer marketing for venues is untapped. We're first to market.",
  },
  {
    icon: Zap,
    title: "AI-First Advantage",
    description: "Native AI integration gives us 10x efficiency over legacy platforms.",
  },
];

export default function VenueOSInvestPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.background }}>
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/90 border-b">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <Link to="/venueOS" className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: colors.primary }}>
                <span className="text-white font-bold text-lg">V</span>
              </div>
              <span className="text-xl font-bold text-gray-900">
                Seeksy <span style={{ color: colors.primaryLight }}>VenueOS</span>
              </span>
            </Link>
            <div className="flex items-center gap-4">
              <Link to="/venueOS">
                <Button variant="ghost">View Product</Button>
              </Link>
              <Button style={{ backgroundColor: colors.primary }}>
                Schedule Meeting
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6" style={{ backgroundColor: `${colors.primaryLight}15` }}>
            <Building2 className="h-4 w-4" style={{ color: colors.primaryLight }} />
            <span className="text-sm font-medium" style={{ color: colors.primaryLight }}>Investor Overview</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-gray-900">
            The AI Operating System<br />for Modern Venues
          </h1>
          
          <p className="text-lg md:text-xl max-w-3xl mx-auto mb-8 text-gray-600">
            VenueOS combines booking management, client CRM, influencer marketing, and AI assistance 
            into a single platform for wedding venues, corporate event spaces, and concert halls.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" style={{ backgroundColor: colors.primary }} className="text-lg px-8">
              Request Deck
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Link to="/venueOS">
              <Button size="lg" variant="outline" className="text-lg px-8">
                Try Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Market Size */}
      <section className="py-16" style={{ backgroundColor: colors.surface }}>
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">Market Opportunity</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {marketStats.map((stat, index) => (
              <Card key={index} className="border-0 shadow-lg text-center">
                <CardContent className="p-8">
                  <p className="text-4xl font-bold mb-2" style={{ color: colors.primary }}>{stat.value}</p>
                  <p className="text-lg font-semibold text-gray-900 mb-1">{stat.label}</p>
                  <p className="text-sm text-green-600">{stat.growth}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why Now */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4 text-gray-900">Why Now?</h2>
          <p className="text-lg text-gray-600 text-center max-w-2xl mx-auto mb-12">
            Three powerful trends converge to create the perfect opportunity.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {whyNow.map((item, index) => (
              <Card key={index} className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-lg flex items-center justify-center mb-4" style={{ backgroundColor: `${colors.primaryLight}15` }}>
                    <item.icon className="h-6 w-6" style={{ color: colors.primaryLight }} />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Product Overview */}
      <section className="py-20" style={{ backgroundColor: colors.surface }}>
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4 text-gray-900">Product Overview</h2>
          <p className="text-lg text-gray-600 text-center max-w-2xl mx-auto mb-12">
            A complete operating system for venue management and marketing.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-sm hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="h-10 w-10 rounded-lg flex items-center justify-center mb-4" style={{ backgroundColor: `${colors.primaryLight}15` }}>
                    <feature.icon className="h-5 w-5" style={{ color: colors.primaryLight }} />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Revenue Model */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4 text-gray-900">Revenue Model</h2>
          <p className="text-lg text-gray-600 text-center max-w-2xl mx-auto mb-12">
            Multiple revenue streams with strong unit economics.
          </p>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {revenueStreams.map((stream, index) => (
              <Card key={index} className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{stream.title}</h3>
                  <p className="text-gray-600 mb-3">{stream.description}</p>
                  <div className="flex items-center gap-2 text-sm" style={{ color: colors.primaryLight }}>
                    <Check className="h-4 w-4" />
                    <span className="font-medium">{stream.model}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20" style={{ backgroundColor: colors.primary }}>
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
            Ready to Learn More?
          </h2>
          <p className="text-lg text-white/80 max-w-2xl mx-auto mb-8">
            Schedule a call to discuss VenueOS, see our full deck, and explore partnership opportunities.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="text-lg px-8">
              Schedule Call
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 border-white text-white hover:bg-white/10">
              Request Deck
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: colors.primary }}>
                <span className="text-white font-bold">V</span>
              </div>
              <span className="text-lg font-bold text-gray-900">Seeksy VenueOS</span>
            </div>
            <p className="text-gray-500 text-sm">© 2025 Seeksy. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
