/**
 * Seeksy Platform One-Pager
 * A comprehensive overview for investors, lawyers, and potential licensees
 */

import { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SparkAvatar } from "@/components/spark/SparkAvatar";
import { 
  Download, 
  Layers, 
  User, 
  Grid3X3, 
  Palette,
  Mic,
  Video,
  Radio,
  Sparkles,
  Phone,
  Mail,
  Calendar,
  Users,
  ShoppingCart,
  CreditCard,
  TrendingUp,
  BarChart3,
  PieChart,
  FileText,
  Building2,
  Globe,
  Briefcase,
  Truck,
  CheckCircle2,
  ArrowRight,
  Zap,
  Shield,
  Puzzle,
  Target,
  Code,
  Database,
  Lock,
  Server,
  GitBranch,
  Settings,
  Key,
  Share2,
  Cpu,
  Scale,
  ArrowUp,
  Menu,
  X
} from "lucide-react";

const navItems = [
  { id: "hero", label: "Overview" },
  { id: "architecture", label: "Architecture" },
  { id: "apps", label: "Apps" },
  { id: "business", label: "Business" },
  { id: "appendix-a", label: "Core Tech" },
  { id: "exhibit-a", label: "Tech/IP" },
];

const PlatformOnePager = () => {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setMobileNavOpen(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <Helmet>
        <title>Seeksy Platform Overview | A Modular Identity & Interaction Platform</title>
        <meta name="description" content="Seeksy is a modular, app-driven platform that allows individuals, creators, and businesses to activate digital capabilities through a single identity layer." />
      </Helmet>

      {/* Sticky Nav Bar - Hidden in print */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/50 print:hidden">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SparkAvatar size={28} pose="idle" />
            <span className="font-semibold text-primary">Seeksy</span>
          </div>
          
          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Button
                key={item.id}
                variant="ghost"
                size="sm"
                onClick={() => scrollToSection(item.id)}
                className="text-xs font-medium"
              >
                {item.label}
              </Button>
            ))}
            <Separator orientation="vertical" className="h-5 mx-2" />
            <Link to="/videos/platform">
              <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
                <Video className="h-3.5 w-3.5" />
                Videos
              </Button>
            </Link>
            <Button onClick={handlePrint} variant="outline" size="sm" className="gap-1.5 text-xs">
              <Download className="h-3.5 w-3.5" />
              PDF
            </Button>
          </div>

          {/* Mobile Nav Toggle */}
          <div className="flex md:hidden items-center gap-2">
            <Button onClick={handlePrint} variant="outline" size="sm" className="gap-1.5 text-xs">
              <Download className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setMobileNavOpen(!mobileNavOpen)}>
              {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Nav Dropdown */}
        {mobileNavOpen && (
          <div className="md:hidden border-t border-border/50 bg-background py-2 px-4">
            {navItems.map((item) => (
              <Button
                key={item.id}
                variant="ghost"
                size="sm"
                onClick={() => scrollToSection(item.id)}
                className="w-full justify-start text-sm"
              >
                {item.label}
              </Button>
            ))}
            <Link to="/videos/platform" className="w-full">
              <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-sm">
                <Video className="h-4 w-4" />
                Videos
              </Button>
            </Link>
          </div>
        )}
      </nav>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <Button
          onClick={scrollToTop}
          variant="outline"
          size="icon"
          className="fixed bottom-6 right-6 z-50 rounded-full shadow-lg bg-background/90 backdrop-blur-sm print:hidden"
        >
          <ArrowUp className="h-5 w-5" />
        </Button>
      )}

      <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20 print:bg-white pt-16 print:pt-0">
        <div className="max-w-5xl mx-auto px-6 py-12 print:py-6 print:px-8">
          
          {/* Hero */}
          <header id="hero" className="text-center mb-16 print:mb-10 scroll-mt-20">
            <div className="flex items-center justify-center gap-4 mb-8">
              <SparkAvatar size={56} pose="idle" />
              <h1 className="text-5xl font-bold tracking-tight print:text-4xl">
                <span className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent print:text-foreground">
                  Seeksy
                </span>
              </h1>
            </div>
            <h2 className="text-2xl md:text-3xl text-foreground/80 font-light tracking-wide print:text-2xl">
              A Modular Identity & Interaction Platform
            </h2>
          </header>

          {/* What Seeksy Is */}
          <section className="mb-12 print:mb-8">
            <h2 className="text-2xl font-semibold mb-5 flex items-center gap-2 print:text-xl">
              <Zap className="h-5 w-5 text-primary" />
              What Seeksy Is
            </h2>
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent print:bg-transparent print:border-muted">
              <CardContent className="pt-6 pb-6">
                <p className="text-lg text-foreground/90 leading-relaxed">
                  Seeksy is a modular, app-driven platform that allows individuals, creators, and businesses to activate digital capabilities through a single identity layer. Users enable apps as needed — communications, media, monetization, scheduling, commerce, and analytics — without rebuilding infrastructure or managing multiple tools.
                </p>
              </CardContent>
            </Card>
          </section>

          {/* Platform Architecture */}
          <section id="architecture" className="mb-10 print:mb-6 scroll-mt-20">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2 print:text-xl">
              <Layers className="h-5 w-5 text-primary" />
              Platform Architecture
            </h2>
            <div className="grid md:grid-cols-3 gap-4 print:gap-3">
              <Card className="border-l-4 border-l-blue-500">
                <CardContent className="pt-5">
                  <div className="flex items-center gap-2 mb-3">
                    <User className="h-5 w-5 text-blue-500" />
                    <h3 className="font-semibold">Core Identity Layer</h3>
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-1.5">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-blue-500 shrink-0" />
                      One profile, many use cases
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-blue-500 shrink-0" />
                      Persistent identity across apps
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-blue-500 shrink-0" />
                      Public-facing and private modules
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-green-500">
                <CardContent className="pt-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Grid3X3 className="h-5 w-5 text-green-500" />
                    <h3 className="font-semibold">Modular App System</h3>
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-1.5">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-green-500 shrink-0" />
                      Apps activated independently
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-green-500 shrink-0" />
                      No lockout when apps inactive
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-green-500 shrink-0" />
                      Usage-based credit monetization
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-purple-500">
                <CardContent className="pt-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Palette className="h-5 w-5 text-purple-500" />
                    <h3 className="font-semibold">Composable UI</h3>
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-1.5">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-purple-500 shrink-0" />
                      Collections, modules, pages
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-purple-500 shrink-0" />
                      Drag-and-drop configuration
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-purple-500 shrink-0" />
                      Shareable & embeddable
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* App Categories */}
          <section id="apps" className="mb-10 print:mb-6 print:break-before-page scroll-mt-20">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2 print:text-xl">
              <Puzzle className="h-5 w-5 text-primary" />
              Example App Categories
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 print:gap-3 print:grid-cols-3">
              
              {/* Creator & Media */}
              <Card className="bg-gradient-to-br from-orange-500/10 to-red-500/5 border-orange-500/20">
                <CardContent className="pt-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 rounded-lg bg-orange-500/20">
                      <Mic className="h-4 w-4 text-orange-600" />
                    </div>
                    <h3 className="font-semibold text-sm">Creator & Media</h3>
                  </div>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Shareable creator profiles</li>
                    <li>• Podcast hosting & RSS</li>
                    <li>• Video & live studio tools</li>
                    <li>• Ad insertion & sponsorship</li>
                    <li>• Voice cloning & AI avatars</li>
                  </ul>
                </CardContent>
              </Card>

              {/* Communications */}
              <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/5 border-blue-500/20">
                <CardContent className="pt-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 rounded-lg bg-blue-500/20">
                      <Phone className="h-4 w-4 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-sm">Communications</h3>
                  </div>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• AI voice agents</li>
                    <li>• Call routing & lead qual</li>
                    <li>• Email, SMS, messaging hubs</li>
                    <li>• Scheduling & meetings</li>
                    <li>• CRM-style lead capture</li>
                  </ul>
                </CardContent>
              </Card>

              {/* Commerce & Monetization */}
              <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/5 border-green-500/20">
                <CardContent className="pt-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 rounded-lg bg-green-500/20">
                      <ShoppingCart className="h-4 w-4 text-green-600" />
                    </div>
                    <h3 className="font-semibold text-sm">Commerce & Monetization</h3>
                  </div>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Digital product sales</li>
                    <li>• Subscription & usage billing</li>
                    <li>• Affiliate & influencer tracking</li>
                    <li>• Ad inventory & analytics</li>
                    <li>• Payments & payout routing</li>
                  </ul>
                </CardContent>
              </Card>

              {/* Data & Analytics */}
              <Card className="bg-gradient-to-br from-violet-500/10 to-purple-500/5 border-violet-500/20">
                <CardContent className="pt-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 rounded-lg bg-violet-500/20">
                      <BarChart3 className="h-4 w-4 text-violet-600" />
                    </div>
                    <h3 className="font-semibold text-sm">Data & Analytics</h3>
                  </div>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Engagement tracking</li>
                    <li>• Sentiment analysis</li>
                    <li>• Conversion & funnel metrics</li>
                    <li>• Performance scoring</li>
                    <li>• Exportable reporting</li>
                  </ul>
                </CardContent>
              </Card>

              {/* Enterprise & Vertical */}
              <Card className="bg-gradient-to-br from-slate-500/10 to-zinc-500/5 border-slate-500/20 md:col-span-2 lg:col-span-2 print:col-span-2">
                <CardContent className="pt-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 rounded-lg bg-slate-500/20">
                      <Building2 className="h-4 w-4 text-slate-600" />
                    </div>
                    <h3 className="font-semibold text-sm">Enterprise & Vertical Apps</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 text-xs text-muted-foreground">
                    <ul className="space-y-1">
                      <li>• White-label creator networks</li>
                      <li>• Event & conference platforms</li>
                      <li>• Talent marketplaces</li>
                    </ul>
                    <ul className="space-y-1">
                      <li>• Call-center augmentation</li>
                      <li>• Industry workflows (logistics, real estate, media)</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Business Model & Value */}
          <section id="business" className="mb-10 print:mb-6 scroll-mt-20">
            <div className="grid md:grid-cols-2 gap-6 print:gap-4">
              {/* Business Model */}
              <div>
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2 print:text-xl">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Business Model
                </h2>
                <Card>
                  <CardContent className="pt-5">
                    <ul className="space-y-2.5">
                      <li className="flex items-center gap-3">
                        <ArrowRight className="h-4 w-4 text-primary shrink-0" />
                        <span className="text-sm">App-based activation</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <ArrowRight className="h-4 w-4 text-primary shrink-0" />
                        <span className="text-sm">Usage-based credit system</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <ArrowRight className="h-4 w-4 text-primary shrink-0" />
                        <span className="text-sm">Platform fees + revenue share</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <ArrowRight className="h-4 w-4 text-primary shrink-0" />
                        <span className="text-sm">Licensing / white-label / IP sale</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>

              {/* Why Valuable */}
              <div>
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2 print:text-xl">
                  <Shield className="h-5 w-5 text-primary" />
                  Why Seeksy Is Valuable IP
                </h2>
                <Card className="bg-primary/5 border-primary/20 print:bg-transparent">
                  <CardContent className="pt-5">
                    <ul className="space-y-2.5">
                      <li className="flex items-center gap-3">
                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                        <span className="text-sm">Modular, extensible architecture</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                        <span className="text-sm">Multiple vertical entry points</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                        <span className="text-sm">Not tied to a single market or persona</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                        <span className="text-sm">Designed for integration & acquisition</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                        <span className="text-sm">Strong AI-driven identity alignment</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>

          {/* Use Cases */}
          <section className="mb-10 print:mb-6">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2 print:text-xl">
              <Target className="h-5 w-5 text-primary" />
              Use Cases for Buyers or Licensees
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 print:gap-2">
              {[
                { icon: Radio, label: "Media companies launching creator networks" },
                { icon: Users, label: "Agencies managing talent or influencers" },
                { icon: Building2, label: "Enterprises modernizing communications" },
                { icon: Globe, label: "Platforms seeking identity + monetization" },
                { icon: TrendingUp, label: "Investors assembling ecosystem strategies" },
              ].map((item, i) => (
                <Card key={i} className="text-center hover:border-primary/40 transition-colors">
                  <CardContent className="pt-4 pb-3">
                    <item.icon className="h-6 w-6 mx-auto mb-2 text-primary/70" />
                    <p className="text-xs text-muted-foreground leading-snug">{item.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Summary */}
          <section className="mb-8">
            <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/30 print:bg-muted/20">
              <CardContent className="pt-6 pb-6">
                <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Summary
                </h2>
                <p className="text-foreground/90 leading-relaxed">
                  <strong>Seeksy is not a single product</strong> — it is an app ecosystem built around identity, 
                  interaction, and monetization. Its modular design allows it to scale across industries, adapt to 
                  new use cases, and be licensed or acquired as a standalone technology platform.
                </p>
              </CardContent>
            </Card>
          </section>

          {/* Appendix A - Technology & IP Summary */}
          <section id="appendix-a" className="mt-16 print:break-before-page scroll-mt-20">
            <div className="border-t-2 border-primary/20 pt-8">
              <h2 className="text-3xl font-bold text-center mb-2 print:text-2xl">Core Tech</h2>
              <p className="text-xl text-muted-foreground text-center mb-8 print:text-lg">
                Technology & Intellectual Property Summary
              </p>

              {/* 1. Platform Overview */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">1</span>
                  Platform Overview
                </h3>
                <Card>
                  <CardContent className="pt-5">
                    <p className="text-sm text-muted-foreground mb-4">
                      Seeksy is a modular, app-based software platform built around a unified identity and interaction layer. 
                      The platform enables users or licensees to activate discrete functional applications ("Apps") within a 
                      shared architecture, without dependency on any single vertical, industry, or user persona.
                    </p>
                    <p className="text-sm font-medium mb-2">The system is designed for:</p>
                    <ul className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                        Direct operation by Seeksy
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                        White-label deployment
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                        Licensing to third parties
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                        Asset or IP-only acquisition
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>

              {/* 2. Core Technology Components */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">2</span>
                  Core Technology Components
                </h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3 print:grid-cols-3">
                  <Card className="border-l-4 border-l-blue-500">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="h-4 w-4 text-blue-500" />
                        <h4 className="font-semibold text-sm">2.1 Identity & Profile Layer</h4>
                      </div>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        <li>• Persistent user identity across all apps</li>
                        <li>• Public-facing and private config states</li>
                        <li>• Profile data abstracted from app logic</li>
                        <li>• No data loss upon app deactivation</li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-green-500">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Puzzle className="h-4 w-4 text-green-500" />
                        <h4 className="font-semibold text-sm">2.2 Modular App Framework</h4>
                      </div>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        <li>• Apps share identity, billing, analytics</li>
                        <li>• Activate, pause, remove without instability</li>
                        <li>• Supports 1P and 3P app development</li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-amber-500">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 mb-2">
                        <CreditCard className="h-4 w-4 text-amber-500" />
                        <h4 className="font-semibold text-sm">2.3 Monetization Engine</h4>
                      </div>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        <li>• Credit-based usage (not subscription-locked)</li>
                        <li>• Metered consumption per app</li>
                        <li>• Graceful degradation at limits</li>
                        <li>• No forced suspension or data lockout</li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-violet-500">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 mb-2">
                        <BarChart3 className="h-4 w-4 text-violet-500" />
                        <h4 className="font-semibold text-sm">2.4 Data & Analytics Layer</h4>
                      </div>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        <li>• Event-based logging across all apps</li>
                        <li>• Engagement, conversion, performance metrics</li>
                        <li>• Sentiment and interaction scoring</li>
                        <li>• Exportable and auditable datasets</li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-cyan-500 md:col-span-2 lg:col-span-2">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Phone className="h-4 w-4 text-cyan-500" />
                        <h4 className="font-semibold text-sm">2.5 Communication & Interaction Systems</h4>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 text-xs text-muted-foreground">
                        <ul className="space-y-1">
                          <li>• AI-assisted voice and text agents</li>
                          <li>• Call routing and lead qualification</li>
                        </ul>
                        <ul className="space-y-1">
                          <li>• Scheduling, messaging, meeting systems</li>
                          <li>• Enterprise and consumer use cases</li>
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* 3. Intellectual Property Scope */}
              <div className="mb-8 print:break-before-page">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">3</span>
                  Intellectual Property Scope
                </h3>
                <p className="text-sm text-muted-foreground mb-4 italic">
                  The following elements are proprietary to Seeksy unless otherwise licensed:
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Code className="h-4 w-4 text-primary" />
                        <h4 className="font-semibold text-sm">3.1 Software IP</h4>
                      </div>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        <li>• Platform architecture and system design</li>
                        <li>• Modular app activation framework</li>
                        <li>• Identity abstraction and orchestration logic</li>
                        <li>• Usage-based credit and degradation model</li>
                        <li>• Analytics schemas and scoring methodologies</li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Database className="h-4 w-4 text-primary" />
                        <h4 className="font-semibold text-sm">3.2 Data Structures & Schemas</h4>
                      </div>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        <li>• Unified identity schema</li>
                        <li>• App-agnostic event tracking models</li>
                        <li>• Performance and sentiment scoring constructs</li>
                        <li>• Aggregated analytics views and reporting logic</li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 mb-2">
                        <GitBranch className="h-4 w-4 text-primary" />
                        <h4 className="font-semibold text-sm">3.3 Workflow Logic</h4>
                      </div>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        <li>• App activation/deactivation flows</li>
                        <li>• Lead qualification and routing logic</li>
                        <li>• Communication and engagement pipelines</li>
                        <li>• Monetization and billing workflows</li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Palette className="h-4 w-4 text-primary" />
                        <h4 className="font-semibold text-sm">3.4 UI / UX Systems</h4>
                      </div>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        <li>• Modular collection and page composition</li>
                        <li>• Configurable public and private interfaces</li>
                        <li>• Shareable and embeddable presentation layers</li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* 4-7 in a grid */}
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                {/* 4. Third-Party Dependencies */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">4</span>
                    Third-Party Dependencies
                  </h3>
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-xs text-muted-foreground mb-2">
                        Seeksy integrates with third-party infrastructure providers (e.g., communications APIs, 
                        cloud hosting, AI services). These services are <strong>replaceable and non-exclusive</strong> and 
                        do not materially impair Seeksy's ability to operate, license, or transfer the platform.
                      </p>
                      <p className="text-xs font-medium text-foreground">
                        No core business logic is dependent on a single external vendor.
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* 5. Data Ownership & Control */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">5</span>
                    Data Ownership & Control
                  </h3>
                  <Card>
                    <CardContent className="pt-4">
                      <ul className="text-xs text-muted-foreground space-y-1.5">
                        <li className="flex items-start gap-2">
                          <Key className="h-3 w-3 mt-0.5 text-primary shrink-0" />
                          User-generated content remains user-owned unless assigned
                        </li>
                        <li className="flex items-start gap-2">
                          <Key className="h-3 w-3 mt-0.5 text-primary shrink-0" />
                          Platform-generated analytics and metrics are Seeksy IP
                        </li>
                        <li className="flex items-start gap-2">
                          <Key className="h-3 w-3 mt-0.5 text-primary shrink-0" />
                          Licensees may receive data access per contract terms
                        </li>
                        <li className="flex items-start gap-2">
                          <Key className="h-3 w-3 mt-0.5 text-primary shrink-0" />
                          Supports data segregation for white-label deployments
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>

                {/* 6. Deployment & Transferability */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">6</span>
                    Deployment & Transferability
                  </h3>
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-xs text-muted-foreground mb-2">The platform supports:</p>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        <li className="flex items-center gap-2">
                          <Share2 className="h-3 w-3 text-primary" />
                          Full asset sale (codebase + IP)
                        </li>
                        <li className="flex items-center gap-2">
                          <Share2 className="h-3 w-3 text-primary" />
                          IP-only sale or license
                        </li>
                        <li className="flex items-center gap-2">
                          <Share2 className="h-3 w-3 text-primary" />
                          Spin-out of individual app modules
                        </li>
                        <li className="flex items-center gap-2">
                          <Share2 className="h-3 w-3 text-primary" />
                          White-label or private-label deployments
                        </li>
                      </ul>
                      <p className="text-xs text-muted-foreground mt-2 italic">
                        Codebase and data schemas structured for clean handoff with minimal refactoring.
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* 7. Security & Access Control */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">7</span>
                    Security & Access Control
                  </h3>
                  <Card>
                    <CardContent className="pt-4">
                      <ul className="text-xs text-muted-foreground space-y-1.5">
                        <li className="flex items-center gap-2">
                          <Lock className="h-3 w-3 text-primary" />
                          Role-based access controls
                        </li>
                        <li className="flex items-center gap-2">
                          <Lock className="h-3 w-3 text-primary" />
                          App-level permissioning
                        </li>
                        <li className="flex items-center gap-2">
                          <Lock className="h-3 w-3 text-primary" />
                          Segregation of public and private data
                        </li>
                        <li className="flex items-center gap-2">
                          <Lock className="h-3 w-3 text-primary" />
                          Audit-friendly event logging
                        </li>
                      </ul>
                      <p className="text-xs text-muted-foreground mt-2 italic">
                        (Detailed security documentation available upon request.)
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* 8. No Vertical Lock-In */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">8</span>
                  No Vertical Lock-In
                </h3>
                <Card className="bg-gradient-to-r from-green-500/10 to-emerald-500/5 border-green-500/20">
                  <CardContent className="pt-5">
                    <p className="text-sm text-foreground/90">
                      <strong>Seeksy is not architected for a single market.</strong> Current use cases include creators, 
                      media, communications, events, commerce, and enterprise workflows, but the platform is intentionally 
                      extensible to additional verticals without structural changes.
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* 9. Summary for Counsel */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">9</span>
                  Summary for Counsel
                </h3>
                <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/30">
                  <CardContent className="pt-5">
                    <p className="text-sm text-foreground/90 mb-4">
                      Seeksy represents a modular, licensable technology platform with defensible IP across:
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                      {[
                        { icon: Layers, label: "Architecture" },
                        { icon: CreditCard, label: "Monetization logic" },
                        { icon: User, label: "Identity abstraction" },
                        { icon: BarChart3, label: "Analytics & scoring" },
                        { icon: Settings, label: "App orchestration" },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                          <item.icon className="h-4 w-4 text-primary shrink-0" />
                          <span>{item.label}</span>
                        </div>
                      ))}
                    </div>
                    <Separator className="my-4" />
                    <p className="text-xs text-muted-foreground italic">
                      The platform may be conveyed, licensed, or acquired in whole or in part, 
                      subject to standard third-party service agreements.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>

          {/* Exhibit A - Technology and IP Description */}
          <section id="exhibit-a" className="mt-16 print:break-before-page scroll-mt-20">
            <div className="border-t-2 border-amber-500/30 pt-8">
              <h2 className="text-3xl font-bold text-center mb-2 print:text-2xl">Tech/IP</h2>
              <p className="text-xl text-muted-foreground text-center mb-2 print:text-lg">
                Technology and Intellectual Property Description
              </p>
              <p className="text-xs text-center text-muted-foreground mb-8 italic max-w-2xl mx-auto">
                This Exhibit A is incorporated by reference into the Agreement and is intended to describe, 
                at a high level, the technology assets and intellectual property associated with the platform known as "Seeksy."
              </p>

              {/* 1. Defined Platform */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center text-xs font-bold text-amber-600">1</span>
                  Defined Platform
                </h3>
                <Card className="border-amber-500/20">
                  <CardContent className="pt-5">
                    <p className="text-sm text-foreground/90">
                      <strong>"Seeksy Platform"</strong> means a modular, app-based software platform comprising a unified 
                      identity layer, application orchestration framework, analytics systems, and usage-based monetization 
                      mechanisms, together with related documentation, schemas, workflows, and interfaces.
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* 2. Core Software Components */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center text-xs font-bold text-amber-600">2</span>
                  Core Software Components
                </h3>
                <p className="text-sm text-muted-foreground mb-3">The Seeksy Platform includes the following core components:</p>
                <div className="space-y-3">
                  <Card>
                    <CardContent className="pt-4 pb-3">
                      <h4 className="font-semibold text-sm mb-1">2.1 Identity and Profile Layer</h4>
                      <p className="text-xs text-muted-foreground">
                        A persistent identity system enabling users to maintain a unified profile across multiple applications, 
                        including public-facing and private configurations, independent of any single application module.
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 pb-3">
                      <h4 className="font-semibold text-sm mb-1">2.2 Modular Application Framework</h4>
                      <p className="text-xs text-muted-foreground">
                        A framework allowing discrete software applications ("Apps") to be activated, deactivated, or modified 
                        independently while sharing common platform services, including identity, billing, and analytics.
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 pb-3">
                      <h4 className="font-semibold text-sm mb-1">2.3 Monetization and Usage Engine</h4>
                      <p className="text-xs text-muted-foreground">
                        A credit-based usage system enabling metered consumption of platform functionality, designed to support 
                        graceful degradation of services without forced account termination or data loss.
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 pb-3">
                      <h4 className="font-semibold text-sm mb-1">2.4 Analytics and Event Logging Systems</h4>
                      <p className="text-xs text-muted-foreground">
                        Event-based data capture, storage, and reporting systems supporting performance measurement, 
                        engagement analysis, conversion tracking, and operational auditing.
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 pb-3">
                      <h4 className="font-semibold text-sm mb-1">2.5 Communication and Interaction Systems</h4>
                      <p className="text-xs text-muted-foreground">
                        Integrated voice, messaging, scheduling, and AI-assisted interaction capabilities, including 
                        call routing, lead qualification, and automated response workflows.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* 3. Intellectual Property Assets */}
              <div className="mb-6 print:break-before-page">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center text-xs font-bold text-amber-600">3</span>
                  Intellectual Property Assets
                </h3>
                <p className="text-sm text-muted-foreground mb-3 italic">
                  Unless expressly excluded, the intellectual property associated with the Seeksy Platform includes:
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <Card className="bg-amber-500/5 border-amber-500/20">
                    <CardContent className="pt-4">
                      <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                        <Code className="h-4 w-4 text-amber-600" />
                        3.1 Software and Source Code
                      </h4>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        <li>• Platform architecture and system design</li>
                        <li>• Application orchestration logic</li>
                        <li>• Identity abstraction mechanisms</li>
                        <li>• Monetization and credit-based usage logic</li>
                        <li>• Analytics, scoring, and reporting logic</li>
                      </ul>
                    </CardContent>
                  </Card>
                  <Card className="bg-amber-500/5 border-amber-500/20">
                    <CardContent className="pt-4">
                      <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                        <Database className="h-4 w-4 text-amber-600" />
                        3.2 Data Models and Schemas
                      </h4>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        <li>• Unified identity schemas</li>
                        <li>• Application-agnostic event schemas</li>
                        <li>• Performance, engagement, and sentiment scoring</li>
                        <li>• Aggregated reporting views and data constructs</li>
                      </ul>
                    </CardContent>
                  </Card>
                  <Card className="bg-amber-500/5 border-amber-500/20">
                    <CardContent className="pt-4">
                      <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                        <GitBranch className="h-4 w-4 text-amber-600" />
                        3.3 Business Logic and Workflows
                      </h4>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        <li>• Application lifecycle management workflows</li>
                        <li>• Communication and engagement pipelines</li>
                        <li>• Lead creation, routing, and qualification logic</li>
                        <li>• Billing and usage tracking workflows</li>
                      </ul>
                    </CardContent>
                  </Card>
                  <Card className="bg-amber-500/5 border-amber-500/20">
                    <CardContent className="pt-4">
                      <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                        <Palette className="h-4 w-4 text-amber-600" />
                        3.4 User Interface and Experience Systems
                      </h4>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        <li>• Modular page and collection composition logic</li>
                        <li>• Configurable public and private presentation layers</li>
                        <li>• Shareable and embeddable interface components</li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* 4. Excluded Assets */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center text-xs font-bold text-amber-600">4</span>
                  Excluded Assets
                </h3>
                <Card className="border-destructive/30 bg-destructive/5">
                  <CardContent className="pt-4">
                    <p className="text-xs text-muted-foreground mb-2 italic">
                      Unless otherwise specified in the Agreement, the following are excluded from the intellectual property conveyed:
                    </p>
                    <ul className="text-xs text-muted-foreground space-y-1.5">
                      <li className="flex items-start gap-2">
                        <span className="text-destructive">×</span>
                        Third-party software, APIs, or services used in the operation of the Seeksy Platform
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-destructive">×</span>
                        Open-source components subject to separate license terms
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-destructive">×</span>
                        User-generated content and data not owned by Seeksy
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-destructive">×</span>
                        Trademarks, logos, or brand assets unless expressly included
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>

              {/* 5-6 Grid */}
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                {/* 5. Third-Party Services */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center text-xs font-bold text-amber-600">5</span>
                    Third-Party Services
                  </h3>
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-xs text-muted-foreground">
                        The Seeksy Platform integrates with third-party infrastructure, communications, hosting, and AI 
                        service providers. Such integrations are <strong>non-exclusive and replaceable</strong>, and no material 
                        platform functionality is dependent upon a single third-party provider.
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* 6. Data Ownership */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center text-xs font-bold text-amber-600">6</span>
                    Data Ownership
                  </h3>
                  <Card>
                    <CardContent className="pt-4">
                      <ul className="text-xs text-muted-foreground space-y-1.5">
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-3 w-3 mt-0.5 text-amber-600 shrink-0" />
                          Platform-generated analytics, derived metrics, schemas, and scoring methodologies constitute Seeksy IP.
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-3 w-3 mt-0.5 text-amber-600 shrink-0" />
                          User-generated content remains owned by the applicable user, subject to contractual rights.
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-3 w-3 mt-0.5 text-amber-600 shrink-0" />
                          Data access, export, and retention rights governed by Agreement terms.
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* 7-8 Grid */}
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                {/* 7. Deployment and Transferability */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center text-xs font-bold text-amber-600">7</span>
                    Deployment and Transferability
                  </h3>
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-xs text-muted-foreground mb-2">The Seeksy Platform is designed to support:</p>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        <li className="flex items-center gap-2">
                          <ArrowRight className="h-3 w-3 text-amber-600" />
                          Licensing arrangements
                        </li>
                        <li className="flex items-center gap-2">
                          <ArrowRight className="h-3 w-3 text-amber-600" />
                          White-label and private-label deployments
                        </li>
                        <li className="flex items-center gap-2">
                          <ArrowRight className="h-3 w-3 text-amber-600" />
                          Partial or complete transfer of IP
                        </li>
                        <li className="flex items-center gap-2">
                          <ArrowRight className="h-3 w-3 text-amber-600" />
                          Separation of individual app modules
                        </li>
                      </ul>
                      <p className="text-xs text-muted-foreground mt-2 italic">
                        Architecture supports transfer without material re-engineering.
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* 8. Security and Access Controls */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center text-xs font-bold text-amber-600">8</span>
                    Security and Access Controls
                  </h3>
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-xs text-muted-foreground">
                        The Seeksy Platform includes role-based access controls, application-level permissioning, and 
                        event logging sufficient to support audit and compliance requirements.
                      </p>
                      <p className="text-xs text-muted-foreground mt-2 italic">
                        Detailed security documentation may be provided upon request.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* 9. No Vertical Restriction */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center text-xs font-bold text-amber-600">9</span>
                  No Vertical Restriction
                </h3>
                <Card className="bg-gradient-to-r from-amber-500/10 to-orange-500/5 border-amber-500/20">
                  <CardContent className="pt-4">
                    <p className="text-sm text-foreground/90">
                      The Seeksy Platform is <strong>not limited to a specific industry or market</strong> and is designed 
                      for multi-vertical deployment without structural modification.
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* 10. No Warranty of Fitness */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center text-xs font-bold text-amber-600">10</span>
                  No Warranty of Fitness
                </h3>
                <Card className="border-muted bg-muted/30">
                  <CardContent className="pt-4">
                    <p className="text-xs text-muted-foreground italic">
                      This Exhibit is provided for descriptive purposes only and does not constitute a warranty of 
                      performance, fitness for a particular purpose, or non-infringement, except as expressly set 
                      forth in the Agreement.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="text-center text-xs text-muted-foreground pt-4 border-t print:mt-4">
            <p>© {new Date().getFullYear()} Seeksy. Confidential — For Investor & Licensing Discussions.</p>
          </footer>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 0.5in;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print\\:break-before-page {
            break-before: page;
          }
        }
      `}</style>
    </>
  );
};

export default PlatformOnePager;
