import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  Sparkles, 
  ShieldCheck, 
  Scale,
  MessageCircle,
  PenLine,
  Globe,
  Users,
  ArrowRight,
  Check,
  Play
} from "lucide-react";
import { CampaignAuthModal } from "@/components/campaigns/CampaignAuthModal";
import { CampaignHeroNetflix } from "@/components/campaigns/CampaignHeroNetflix";
import { CampaignSolutionsDropdown } from "@/components/campaigns/CampaignSolutionsDropdown";

// Brand colors from spec
const colors = {
  primary: "#0031A2",
  primaryLight: "#2566FF",
  primaryDark: "#001B5C",
  accent: "#FFCC33",
  accentSoft: "#FFF3C7",
  background: "#F5F7FA",
  backgroundAlt: "#0B1220",
  surface: "#FFFFFF",
  surfaceSoft: "#F3F6FC",
  borderSubtle: "#E1E5ED",
  textPrimary: "#0A0A0A",
  textSecondary: "#5A6472",
  textOnDark: "#FFFFFF",
};

const problemSteps = [
  {
    step: 1,
    headline: "No budget for big consultants",
    body: "Most local and state candidates can't afford a full-time team to plan strategy, write content, and manage outreach."
  },
  {
    step: 2,
    headline: "Complex rules and deadlines",
    body: "Election calendars, filings, and compliance requirements change by state and office."
  },
  {
    step: 3,
    headline: "Content never keeps up",
    body: "Websites, speeches, emails, and social posts all need to stay aligned with your message and issues."
  },
  {
    step: 4,
    headline: "Very little time to execute",
    body: "Candidates are juggling work, family, events, and fundraising. There's no time to manage everything manually."
  }
];

const aiTeamCards = [
  {
    icon: MessageCircle,
    title: "AI Campaign Manager",
    body: "Plans your race, sets weekly priorities, and keeps you focused on the most important tasks.",
    linkLabel: "Open AI Manager",
    href: "/campaigns/ai-manager"
  },
  {
    icon: PenLine,
    title: "AI Speechwriter",
    body: "Drafts speeches, emails, and social posts in your voice, tailored to your district and issues.",
    linkLabel: "Open Content Studio",
    href: "/campaigns/studio"
  },
  {
    icon: Globe,
    title: "AI Digital Director",
    body: "Builds and updates your campaign website and online presence automatically.",
    linkLabel: "Open Site Builder",
    href: "/campaigns/site-builder"
  },
  {
    icon: Users,
    title: "AI Field & Fundraising",
    body: "Generates outreach plans, event reminders, donor touches, and follow-up messages.",
    linkLabel: "Open Outreach & Events",
    href: "/campaigns/outreach"
  }
];

const launchColumns = [
  {
    headline: "Guided onboarding",
    body: "Answer a few simple questions about your race, district, and priorities. CampaignStaff.ai sets up a tailored campaign plan."
  },
  {
    headline: "One workspace for everything",
    body: "Strategy, content, events, and outreach live in one dashboard—no spreadsheets, long email threads, or scattered tools."
  },
  {
    headline: "You stay in control",
    body: "AI suggests the plan and drafts content. You approve, edit, and publish. You can always see and change what's going out."
  }
];

const pricingPlans = [
  {
    name: "Local Starter",
    priceLabel: "TBD",
    description: "City, county, and school board races.",
    highlighted: false,
    features: [
      "AI Campaign Manager and weekly plan",
      "Content Studio for speeches, emails, and social",
      "Basic campaign site builder",
      "Email support"
    ]
  },
  {
    name: "State & Federal",
    priceLabel: "TBD",
    description: "Larger teams and more complex races.",
    highlighted: true,
    features: [
      "All Starter features",
      "Advanced outreach and event planning",
      "Multi-user access for staff and volunteers",
      "Priority support"
    ]
  }
];

const footerSections = [
  {
    title: "Product",
    links: [
      { label: "Overview", href: "/campaign-staff" },
      { label: "AI Manager", href: "/campaign-staff/ai-manager" },
      { label: "Content Studio", href: "/campaign-staff/studio" },
      { label: "Outreach & Events", href: "/campaign-staff/outreach" },
      { label: "Site Builder", href: "/campaign-staff/site-builder" }
    ]
  },
  {
    title: "Campaign Types",
    links: [
      { label: "City & County Races", href: "#local" },
      { label: "State Legislature", href: "#local" },
      { label: "Federal Races", href: "#local" },
      { label: "Ballot Measures", href: "#local" }
    ]
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Investors", href: "/invest/campaignstaff" },
      { label: "Contact", href: "/contact" }
    ]
  }
];

export default function CampaignsLandingPage() {
  const [raceInput, setRaceInput] = useState("");
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const handleHeroCta = () => {
    setAuthModalOpen(true);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.background }}>
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md" style={{ backgroundColor: "rgba(255,255,255,0.9)" }}>
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link to="/campaign-staff" className="flex items-center gap-2">
              <div 
                className="h-9 w-9 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: colors.primary }}
              >
                <span className="text-white font-bold text-lg">C</span>
              </div>
              <span className="text-xl font-bold" style={{ color: colors.textPrimary }}>
                Campaign<span style={{ color: colors.primary }}>Staff</span>.ai
              </span>
            </Link>

            {/* Nav Items */}
            <nav className="hidden md:flex items-center gap-4">
              <CampaignSolutionsDropdown />
              <a href="#how-it-works" className="text-sm font-medium hover:opacity-80" style={{ color: colors.textSecondary }}>
                How It Works
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
                style={{ color: colors.textSecondary }}
              >
                Sign In
              </Button>
              <Button 
                onClick={() => setAuthModalOpen(true)}
                style={{ backgroundColor: colors.primary, color: colors.textOnDark }}
                className="font-medium"
              >
                Start Your Campaign
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section - Netflix Style */}
      <CampaignHeroNetflix 
        onGetStarted={(raceInput) => {
          if (raceInput) {
            setAuthModalOpen(true);
          } else {
            setAuthModalOpen(true);
          }
        }}
      />

      {/* Problem Section */}
      <section id="how-it-works" className="py-20" style={{ backgroundColor: colors.surface }}>
        <div className="container mx-auto px-4">
          <h2 
            className="text-3xl md:text-4xl font-bold text-center mb-12"
            style={{ color: colors.textPrimary }}
          >
            Campaigns are hard. Most candidates are on their own.
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {problemSteps.map((item) => (
              <div 
                key={item.step}
                className="p-6 rounded-xl"
                style={{ 
                  backgroundColor: colors.surfaceSoft,
                  border: `1px solid ${colors.borderSubtle}`
                }}
              >
                <div 
                  className="h-10 w-10 rounded-full flex items-center justify-center mb-4 font-bold"
                  style={{ backgroundColor: colors.primary, color: colors.textOnDark }}
                >
                  {item.step}
                </div>
                <h3 className="font-semibold text-lg mb-2" style={{ color: colors.textPrimary }}>
                  {item.headline}
                </h3>
                <p className="text-sm" style={{ color: colors.textSecondary }}>
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Team Section */}
      <section id="tools" className="py-20" style={{ backgroundColor: colors.background }}>
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 
              className="text-3xl md:text-4xl font-bold mb-4"
              style={{ color: colors.textPrimary }}
            >
              An AI campaign team in your pocket.
            </h2>
            <p style={{ color: colors.textSecondary }}>
              Everything you need to run a winning campaign, powered by AI.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {aiTeamCards.map((card, index) => (
              <Card 
                key={index}
                className="hover:shadow-lg transition-shadow"
                style={{ 
                  backgroundColor: colors.surface,
                  border: `1px solid ${colors.borderSubtle}`,
                  borderRadius: "12px"
                }}
              >
                <CardContent className="p-6">
                  <div 
                    className="h-12 w-12 rounded-lg flex items-center justify-center mb-4"
                    style={{ backgroundColor: `${colors.primary}15` }}
                  >
                    <card.icon className="h-6 w-6" style={{ color: colors.primary }} />
                  </div>
                  <h3 className="font-semibold text-lg mb-2" style={{ color: colors.textPrimary }}>
                    {card.title}
                  </h3>
                  <p className="text-sm mb-4" style={{ color: colors.textSecondary }}>
                    {card.body}
                  </p>
                  <Link 
                    to={card.href}
                    className="text-sm font-medium inline-flex items-center gap-1 hover:opacity-80"
                    style={{ color: colors.primary }}
                  >
                    {card.linkLabel} <ArrowRight className="h-3 w-3" />
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Launch Fast Section */}
      <section id="local" className="py-20" style={{ backgroundColor: colors.surface }}>
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 
              className="text-3xl md:text-4xl font-bold mb-4"
              style={{ color: colors.textPrimary }}
            >
              Launch your campaign in minutes, not months.
            </h2>
            <p style={{ color: colors.textSecondary }}>
              Designed for down-ballot and first-time candidates who need a professional operation quickly.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {launchColumns.map((col, index) => (
              <div key={index} className="text-center">
                <div 
                  className="h-14 w-14 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: colors.accentSoft }}
                >
                  <Check className="h-6 w-6" style={{ color: colors.primary }} />
                </div>
                <h3 className="font-semibold text-lg mb-2" style={{ color: colors.textPrimary }}>
                  {col.headline}
                </h3>
                <p className="text-sm" style={{ color: colors.textSecondary }}>
                  {col.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20" style={{ backgroundColor: colors.background }}>
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 
              className="text-3xl md:text-4xl font-bold mb-4"
              style={{ color: colors.textPrimary }}
            >
              Simple pricing for serious campaigns.
            </h2>
            <p style={{ color: colors.textSecondary }}>
              Keep prices flexible; these are just placeholders for now.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <Card 
                key={index}
                className="relative overflow-hidden"
                style={{ 
                  backgroundColor: colors.surface,
                  border: plan.highlighted ? `2px solid ${colors.primary}` : `1px solid ${colors.borderSubtle}`,
                  borderRadius: "18px"
                }}
              >
                {plan.highlighted && (
                  <div 
                    className="absolute top-0 right-0 px-3 py-1 text-xs font-medium rounded-bl-lg"
                    style={{ backgroundColor: colors.primary, color: colors.textOnDark }}
                  >
                    Popular
                  </div>
                )}
                <CardContent className="p-8">
                  <h3 className="text-xl font-bold mb-2" style={{ color: colors.textPrimary }}>
                    {plan.name}
                  </h3>
                  <div className="text-3xl font-bold mb-2" style={{ color: colors.primary }}>
                    {plan.priceLabel}
                  </div>
                  <p className="text-sm mb-6" style={{ color: colors.textSecondary }}>
                    {plan.description}
                  </p>
                  <ul className="space-y-3">
                    {plan.features.map((feature, fIndex) => (
                      <li key={fIndex} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: colors.primary }} />
                        <span style={{ color: colors.textSecondary }}>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className="w-full mt-6 font-medium"
                    style={{ 
                      backgroundColor: plan.highlighted ? colors.primary : "transparent",
                      color: plan.highlighted ? colors.textOnDark : colors.primary,
                      border: plan.highlighted ? "none" : `1px solid ${colors.primary}`
                    }}
                    onClick={() => setAuthModalOpen(true)}
                  >
                    Get Started
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Investor Strip */}
      <section 
        className="py-16"
        style={{ backgroundColor: colors.primaryDark }}
      >
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4" style={{ color: colors.textOnDark }}>
            CampaignStaff.ai as an investment opportunity
          </h2>
          <p className="mb-6 max-w-2xl mx-auto" style={{ color: "rgba(255,255,255,0.8)" }}>
            The same AI infrastructure that powers our veteran and benefits tools now powers a reusable, scalable campaign platform that can support thousands of races each cycle.
          </p>
          <Button 
            asChild
            style={{ backgroundColor: colors.accent, color: colors.primaryDark }}
            className="font-medium"
          >
            <Link to="/invest/campaignstaff">
              View Investor Overview <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ backgroundColor: colors.backgroundAlt }} className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            {/* Logo Column */}
            <div>
              <Link to="/campaigns" className="flex items-center gap-2 mb-4">
                <div 
                  className="h-9 w-9 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: colors.primary }}
                >
                  <span className="text-white font-bold text-lg">C</span>
                </div>
                <span className="text-xl font-bold text-white">
                  Campaign<span style={{ color: colors.accent }}>Staff</span>.ai
                </span>
              </Link>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
                AI-powered campaign tools for every candidate.
              </p>
            </div>

            {/* Footer Link Sections */}
            {footerSections.map((section, index) => (
              <div key={index}>
                <h4 className="font-semibold text-white mb-4">{section.title}</h4>
                <ul className="space-y-2">
                  {section.links.map((link, lIndex) => (
                    <li key={lIndex}>
                      <Link 
                        to={link.href}
                        className="text-sm hover:opacity-80"
                        style={{ color: "rgba(255,255,255,0.6)" }}
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Bottom Note */}
          <div 
            className="border-t pt-8 text-center text-xs"
            style={{ borderColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}
          >
            <p className="mb-2">
              © {new Date().getFullYear()} CampaignStaff.ai — A Seeksy Product
            </p>
            <p className="max-w-3xl mx-auto">
              CampaignStaff.ai is a non-partisan technology platform. You are responsible for complying with all local, state, and federal campaign rules and reporting requirements.
            </p>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <CampaignAuthModal 
        open={authModalOpen} 
        onOpenChange={setAuthModalOpen}
      />
    </div>
  );
}
