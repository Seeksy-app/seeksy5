import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  CalendarCheck, 
  Users, 
  Megaphone, 
  Video,
  Sparkles,
  ArrowRight,
  Check,
  Building2,
  Music,
  Heart,
  Briefcase,
  ChevronDown,
  Bot,
  MessageSquare
} from "lucide-react";
import { VenueAuthModal } from "@/components/venues/VenueAuthModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const colors = {
  primary: "#053877",
  primaryLight: "#2C6BED",
  background: "#F5F7FF",
  backgroundGradientFrom: "#F5F7FF",
  backgroundGradientTo: "#E6ECFF",
  surface: "#FFFFFF",
  borderSubtle: "#E1E5ED",
  textPrimary: "#0A0A0A",
  textSecondary: "#5A6472",
  textOnDark: "#FFFFFF",
};

const problemCards = [
  {
    icon: "📋",
    headline: "Manual spreadsheets everywhere",
    body: "Tracking bookings, inventory, and client details across multiple tools leads to errors and missed opportunities."
  },
  {
    icon: "📞",
    headline: "Lost leads and slow follow-up",
    body: "Inquiries get buried in email. By the time you respond, they've booked elsewhere."
  },
  {
    icon: "🗓️",
    headline: "Scheduling chaos",
    body: "Double bookings, overlapping events, and no clear view of what's happening when."
  },
  {
    icon: "📸",
    headline: "No time for marketing",
    body: "You know you need social content and influencer partnerships, but who has time?"
  }
];

const howItWorks = [
  {
    step: 1,
    title: "Set up your venue",
    description: "Add your spaces, pricing rules, and inventory in minutes."
  },
  {
    step: 2,
    title: "Manage bookings with AI",
    description: "Mia, your AI coordinator, handles inquiries, proposals, and follow-ups."
  },
  {
    step: 3,
    title: "Track everything in one place",
    description: "Calendar, clients, payments, and tasks—all synced and visible."
  },
  {
    step: 4,
    title: "Grow with influencer marketing",
    description: "Connect with creators to showcase your venue to new audiences."
  }
];

const moduleCards = [
  {
    icon: CalendarCheck,
    title: "Smart Booking",
    description: "AI-powered booking assistant with availability, pricing, and hold management."
  },
  {
    icon: Users,
    title: "Client & Event CRM",
    description: "Track every client, event, and communication in one timeline."
  },
  {
    icon: Megaphone,
    title: "Influencer Marketplace",
    description: "Find and book creators to promote your venue and events."
  },
  {
    icon: Video,
    title: "Media Studio",
    description: "Create promo videos, event recaps, and livestreams with AI assistance."
  }
];

const venueTypes = [
  { icon: Heart, label: "Wedding Venues" },
  { icon: Briefcase, label: "Corporate Events" },
  { icon: Music, label: "Concert Halls" },
  { icon: Building2, label: "Conference Centers" }
];

const pricingPlans = [
  {
    name: "Starter",
    price: "Free",
    description: "Perfect for getting started",
    features: [
      "Up to 10 events/month",
      "Basic booking management",
      "Client portal",
      "Email support"
    ],
    highlighted: false
  },
  {
    name: "Professional",
    price: "$99/mo",
    description: "For growing venues",
    features: [
      "Unlimited events",
      "AI booking assistant",
      "Influencer marketplace",
      "Media studio access",
      "Priority support"
    ],
    highlighted: true
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "Multi-venue operations",
    features: [
      "All Pro features",
      "Multiple venues",
      "Custom integrations",
      "Dedicated success manager",
      "API access"
    ],
    highlighted: false
  }
];

export default function VenueLandingPage() {
  const [authModalOpen, setAuthModalOpen] = useState(false);

  return (
    <div className="min-h-screen" style={{ background: `linear-gradient(to bottom, ${colors.backgroundGradientFrom}, ${colors.backgroundGradientTo})` }}>
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md" style={{ backgroundColor: "rgba(255,255,255,0.9)" }}>
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link to="/venueOS" className="flex items-center gap-2">
              <div 
                className="h-9 w-9 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: colors.primary }}
              >
                <span className="text-white font-bold text-lg">V</span>
              </div>
              <span className="text-xl font-bold" style={{ color: colors.textPrimary }}>
                Seeksy <span style={{ color: colors.primaryLight }}>VenueOS</span>
              </span>
            </Link>

            {/* Nav Items */}
            <nav className="hidden md:flex items-center gap-6">
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-1 text-sm font-medium hover:opacity-80" style={{ color: colors.textSecondary }}>
                  Features
                  <ChevronDown className="h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56 bg-white z-50">
                  <DropdownMenuItem asChild>
                    <a href="#features-dashboard" className="cursor-pointer">Dashboard & Analytics</a>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <a href="#how-it-works" className="cursor-pointer">Bookings & Calendar</a>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <a href="#for-venues" className="cursor-pointer">CRM & Messaging</a>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <a href="#features-mia" className="cursor-pointer">Mia • AI Venue Manager</a>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <a href="#influencers" className="cursor-pointer">Influencer Campaigns</a>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <a href="#how-it-works" className="text-sm font-medium hover:opacity-80" style={{ color: colors.textSecondary }}>
                How It Works
              </a>
              <a href="#ai-tools" className="text-sm font-medium hover:opacity-80" style={{ color: colors.textSecondary }}>
                AI Tools
              </a>
              <a href="#pricing" className="text-sm font-medium hover:opacity-80" style={{ color: colors.textSecondary }}>
                Pricing
              </a>
            </nav>

            {/* CTA Buttons */}
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                onClick={() => setAuthModalOpen(true)}
                className="hidden sm:inline-flex"
              >
                Sign In
              </Button>
              <Button 
                onClick={() => setAuthModalOpen(true)}
                style={{ backgroundColor: colors.primary, color: colors.textOnDark }}
              >
                Start with VenueOS
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section - Clean Gradient */}
      <section className="relative min-h-[70vh] overflow-hidden bg-gradient-to-br from-[#053877] via-[#0a4a8f] to-[#2C6BED]">
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.2) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.15) 0%, transparent 40%)" }} />
        
        {/* Center Content */}
        <div className="relative z-10 flex items-center justify-center min-h-[70vh]">
          <div className="text-center px-4 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 backdrop-blur-sm animate-fade-in" style={{ backgroundColor: "rgba(255, 255, 255, 0.15)", border: "1px solid rgba(255,255,255,0.2)" }}>
              <Sparkles className="h-4 w-4 text-white" />
              <span className="text-sm font-medium text-white">AI-Powered Venue Management</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-white drop-shadow-lg animate-fade-in" style={{ animationDelay: "0.1s" }}>
              The AI Operating System<br />for Modern Venues
            </h1>
            
            <p className="text-lg md:text-xl max-w-2xl mx-auto mb-8 text-white/80 animate-fade-in" style={{ animationDelay: "0.2s" }}>
              Streamline bookings, manage events, and grow your venue with AI-powered tools. 
              From weddings to corporate events to concerts.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in" style={{ animationDelay: "0.3s" }}>
              <Button 
                size="lg"
                onClick={() => setAuthModalOpen(true)}
                className="text-lg px-8 bg-white text-[#053877] hover:bg-white/90"
              >
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="text-lg px-8 bg-white/10 border-white/30 text-white hover:bg-white/20"
              >
                Watch Demo
              </Button>
            </div>

            {/* Venue Types */}
            <div className="flex flex-wrap justify-center gap-4 mt-12 animate-fade-in" style={{ animationDelay: "0.4s" }}>
              {venueTypes.map((type) => (
                <div 
                  key={type.label}
                  className="flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-sm"
                  style={{ backgroundColor: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)" }}
                >
                  <type.icon className="h-4 w-4 text-white" />
                  <span className="text-sm font-medium text-white">{type.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20" id="for-venues">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: colors.textPrimary }}>
              Running a venue shouldn't be this hard
            </h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: colors.textSecondary }}>
              Sound familiar? VenueOS solves these problems.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {problemCards.map((card, index) => (
              <Card key={index} className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="text-3xl mb-4">{card.icon}</div>
                  <h3 className="text-lg font-semibold mb-2" style={{ color: colors.textPrimary }}>
                    {card.headline}
                  </h3>
                  <p className="text-sm" style={{ color: colors.textSecondary }}>
                    {card.body}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20" style={{ backgroundColor: colors.surface }} id="how-it-works">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: colors.textPrimary }}>
              How VenueOS Works
            </h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: colors.textSecondary }}>
              Get up and running in minutes, not weeks.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorks.map((step) => (
              <div key={step.step} className="text-center">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: colors.primary }}
                >
                  <span className="text-white font-bold">{step.step}</span>
                </div>
                <h3 className="text-lg font-semibold mb-2" style={{ color: colors.textPrimary }}>
                  {step.title}
                </h3>
                <p className="text-sm" style={{ color: colors.textSecondary }}>
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mia AI Preview Section */}
      <section className="py-20" id="features-mia" style={{ backgroundColor: "#0a0a0a" }}>
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4" style={{ backgroundColor: "rgba(44, 107, 237, 0.3)" }}>
              <Bot className="h-4 w-4 text-white" />
              <span className="text-sm font-medium text-white">AI-Powered</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
              Meet Mia, Your AI Venue Manager
            </h2>
            <p className="text-lg max-w-2xl mx-auto text-white/70">
              Mia handles inquiries, suggests pricing, drafts proposals, and creates bookings — all through natural conversation.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto items-center">
            {/* Chat Preview */}
            <div className="bg-white rounded-2xl p-4 shadow-2xl">
              <div className="flex items-center gap-2 pb-3 border-b mb-3">
                <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <span className="font-semibold text-gray-900">Mia • AI Manager</span>
              </div>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <div className="h-6 w-6 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 flex items-center justify-center flex-shrink-0">
                    <Bot className="h-3 w-3 text-white" />
                  </div>
                  <div className="bg-gray-100 rounded-lg px-3 py-2 text-sm text-gray-800">
                    I'd love to help create a booking! When is the event and how many guests?
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <div className="bg-blue-600 rounded-lg px-3 py-2 text-sm text-white">
                    June 15th, about 120 guests for a wedding reception
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="h-6 w-6 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 flex items-center justify-center flex-shrink-0">
                    <Bot className="h-3 w-3 text-white" />
                  </div>
                  <div className="bg-gray-100 rounded-lg px-3 py-2 text-sm text-gray-800">
                    Great! The Grand Ballroom is available June 15th. For 120 guests, I recommend our Premium Wedding Package at $8,500. Shall I draft a proposal?
                  </div>
                </div>
              </div>
            </div>

            {/* Mini Calendar Preview */}
            <div className="bg-white rounded-2xl p-6 shadow-2xl">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CalendarCheck className="h-5 w-5 text-blue-600" />
                Suggested Availability
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {["Jun 15", "Jun 22", "Jun 29", "Jul 6", "Jul 13", "Jul 20"].map((date, i) => (
                  <div 
                    key={date}
                    className={`p-3 rounded-lg text-center text-sm ${i === 0 ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"}`}
                  >
                    {date}
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-4">Mia automatically checks your calendar and suggests available dates.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20" id="ai-tools">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: colors.textPrimary }}>
              Everything You Need to Run Your Venue
            </h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: colors.textSecondary }}>
              Powerful modules that work together seamlessly.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {moduleCards.map((module, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-6">
                  <div 
                    className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
                    style={{ backgroundColor: `${colors.primaryLight}15` }}
                  >
                    <module.icon className="h-6 w-6" style={{ color: colors.primaryLight }} />
                  </div>
                  <h3 className="text-lg font-semibold mb-2" style={{ color: colors.textPrimary }}>
                    {module.title}
                  </h3>
                  <p className="text-sm" style={{ color: colors.textSecondary }}>
                    {module.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Event Showcase Section */}
      <section className="py-20" style={{ backgroundColor: colors.surface }}>
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: colors.textPrimary }}>
              Every Event, One Platform
            </h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: colors.textSecondary }}>
              From intimate weddings to sold-out concerts, VenueOS handles it all.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            <Card className="group hover:shadow-lg transition-shadow border-0 bg-gradient-to-br from-pink-50 to-rose-100">
              <CardContent className="p-6 text-center">
                <div className="w-14 h-14 rounded-full bg-pink-500/10 flex items-center justify-center mx-auto mb-4">
                  <Heart className="h-7 w-7 text-pink-500" />
                </div>
                <h3 className="font-semibold mb-2" style={{ color: colors.textPrimary }}>Weddings</h3>
                <p className="text-sm" style={{ color: colors.textSecondary }}>
                  Manage every detail from proposal to the big day.
                </p>
              </CardContent>
            </Card>
            
            <Card className="group hover:shadow-lg transition-shadow border-0 bg-gradient-to-br from-purple-50 to-violet-100">
              <CardContent className="p-6 text-center">
                <div className="w-14 h-14 rounded-full bg-purple-500/10 flex items-center justify-center mx-auto mb-4">
                  <Music className="h-7 w-7 text-purple-500" />
                </div>
                <h3 className="font-semibold mb-2" style={{ color: colors.textPrimary }}>Concerts</h3>
                <p className="text-sm" style={{ color: colors.textSecondary }}>
                  Ticketing, artists, and crowd management.
                </p>
              </CardContent>
            </Card>
            
            <Card className="group hover:shadow-lg transition-shadow border-0 bg-gradient-to-br from-blue-50 to-indigo-100">
              <CardContent className="p-6 text-center">
                <div className="w-14 h-14 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
                  <Briefcase className="h-7 w-7 text-blue-500" />
                </div>
                <h3 className="font-semibold mb-2" style={{ color: colors.textPrimary }}>Corporate</h3>
                <p className="text-sm" style={{ color: colors.textSecondary }}>
                  Conferences, meetings, and team events.
                </p>
              </CardContent>
            </Card>
            
            <Card className="group hover:shadow-lg transition-shadow border-0 bg-gradient-to-br from-emerald-50 to-teal-100">
              <CardContent className="p-6 text-center">
                <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                  <Building2 className="h-7 w-7 text-emerald-500" />
                </div>
                <h3 className="font-semibold mb-2" style={{ color: colors.textPrimary }}>Private Events</h3>
                <p className="text-sm" style={{ color: colors.textSecondary }}>
                  Galas, fundraisers, and special occasions.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Influencer Section */}
      <section className="py-20" style={{ backgroundColor: colors.primary }} id="influencers">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
            Grow with Influencer Marketing
          </h2>
          <p className="text-lg max-w-2xl mx-auto mb-8 text-white/80">
            Connect with verified creators to showcase your venue to thousands of potential clients.
          </p>
          <Button 
            size="lg"
            variant="secondary"
            onClick={() => setAuthModalOpen(true)}
            className="text-lg px-8"
          >
            Explore Influencer Marketplace
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20" id="pricing">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: colors.textPrimary }}>
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: colors.textSecondary }}>
              Start free, upgrade as you grow.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <Card 
                key={index} 
                className={`border-0 shadow-lg ${plan.highlighted ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`}
              >
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-2" style={{ color: colors.textPrimary }}>
                    {plan.name}
                  </h3>
                  <div className="mb-4">
                    <span className="text-3xl font-bold" style={{ color: colors.primary }}>
                      {plan.price}
                    </span>
                  </div>
                  <p className="text-sm mb-6" style={{ color: colors.textSecondary }}>
                    {plan.description}
                  </p>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4" style={{ color: colors.primaryLight }} />
                        <span style={{ color: colors.textPrimary }}>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className="w-full"
                    variant={plan.highlighted ? "default" : "outline"}
                    onClick={() => setAuthModalOpen(true)}
                    style={plan.highlighted ? { backgroundColor: colors.primary, color: colors.textOnDark } : {}}
                  >
                    Get Started
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12" style={{ backgroundColor: colors.primary }}>
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: colors.primaryLight }}>
                <span className="text-white font-bold">V</span>
              </div>
              <span className="text-lg font-bold text-white">
                Seeksy VenueOS
              </span>
            </div>
            <div className="flex gap-6 text-white/70 text-sm">
              <Link to="/privacy" className="hover:text-white">Privacy</Link>
              <Link to="/terms" className="hover:text-white">Terms</Link>
              <Link to="/about" className="hover:text-white">About</Link>
              <Link to="/contact" className="hover:text-white">Contact</Link>
            </div>
            <p className="text-white/50 text-sm">
              © 2025 Seeksy. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <VenueAuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
    </div>
  );
}
