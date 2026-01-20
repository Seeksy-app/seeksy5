/**
 * Your Benefits Platform One-Pager
 * A comprehensive overview for potential buyers, licensees, and partners
 * Showcases the Military & Federal Benefits Hub platform capabilities
 */

import { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  Layers,
  User,
  Shield,
  Calculator,
  MessageSquare,
  FileText,
  DollarSign,
  Clock,
  Award,
  TrendingUp,
  Users,
  Building2,
  CheckCircle2,
  ArrowRight,
  ArrowUp,
  Zap,
  Puzzle,
  Target,
  Code,
  Database,
  Lock,
  Server,
  Cpu,
  Scale,
  Menu,
  X,
  Heart,
  Stethoscope,
  GraduationCap,
  Home,
  Globe,
  Handshake,
  Phone,
  Bot,
  BarChart3,
  Briefcase,
  Star,
} from "lucide-react";

const navItems = [
  { id: "hero", label: "Overview" },
  { id: "problem", label: "The Problem" },
  { id: "solution", label: "Solution" },
  { id: "features", label: "Features" },
  { id: "technology", label: "Technology" },
  { id: "licensing", label: "Licensing" },
];

const YourBenefitsPlatform = () => {
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
        <title>Your Benefits Platform | Military & Federal Benefits Hub for Licensees</title>
        <meta name="description" content="License the Your Benefits platform — a complete Military & Federal Benefits Hub with 20+ calculators, AI claims agent, and referral network. White-label ready." />
      </Helmet>

      {/* Sticky Nav Bar - Hidden in print */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/50 print:hidden">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="font-semibold text-primary">Your Benefits</span>
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
            <Link to="/yourbenefits">
              <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
                <Globe className="h-3.5 w-3.5" />
                Live Demo
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
            <Link to="/yourbenefits" className="w-full">
              <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-sm">
                <Globe className="h-4 w-4" />
                Live Demo
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
              <Shield className="h-14 w-14 text-primary" />
              <h1 className="text-5xl font-bold tracking-tight print:text-4xl">
                <span className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent print:text-foreground">
                  Your Benefits
                </span>
              </h1>
            </div>
            <h2 className="text-2xl md:text-3xl text-foreground/80 font-light tracking-wide print:text-2xl">
              Military & Federal Benefits Hub
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              A complete, licensable platform for benefits education, claim preparation, and AI-powered guidance
            </p>
            <div className="flex flex-wrap justify-center gap-3 mt-8 print:hidden">
              <Link to="/yourbenefits">
                <Button size="lg" className="gap-2">
                  <Globe className="h-4 w-4" />
                  View Live Platform
                </Button>
              </Link>
              <Button size="lg" variant="outline" onClick={handlePrint} className="gap-2">
                <Download className="h-4 w-4" />
                Download Overview
              </Button>
            </div>
          </header>

          {/* The Problem */}
          <section id="problem" className="mb-12 print:mb-8 scroll-mt-20">
            <h2 className="text-2xl font-semibold mb-5 flex items-center gap-2 print:text-xl">
              <Target className="h-5 w-5 text-red-500" />
              The Problem We Solve
            </h2>
            <Card className="border-red-500/20 bg-gradient-to-br from-red-500/5 to-transparent print:bg-transparent print:border-muted">
              <CardContent className="pt-6 pb-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-3 text-lg">For Veterans & Federal Employees</h3>
                    <ul className="space-y-2 text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <X className="h-4 w-4 text-red-500 mt-1 shrink-0" />
                        Complex benefits systems with scattered information
                      </li>
                      <li className="flex items-start gap-2">
                        <X className="h-4 w-4 text-red-500 mt-1 shrink-0" />
                        Uncertainty about eligibility and potential value
                      </li>
                      <li className="flex items-start gap-2">
                        <X className="h-4 w-4 text-red-500 mt-1 shrink-0" />
                        Difficulty finding trustworthy representation
                      </li>
                      <li className="flex items-start gap-2">
                        <X className="h-4 w-4 text-red-500 mt-1 shrink-0" />
                        Missed deadlines and unclaimed retroactive pay
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-3 text-lg">For Benefits Organizations</h3>
                    <ul className="space-y-2 text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <X className="h-4 w-4 text-red-500 mt-1 shrink-0" />
                        Expensive to build educational tools from scratch
                      </li>
                      <li className="flex items-start gap-2">
                        <X className="h-4 w-4 text-red-500 mt-1 shrink-0" />
                        Struggle to qualify and educate leads at scale
                      </li>
                      <li className="flex items-start gap-2">
                        <X className="h-4 w-4 text-red-500 mt-1 shrink-0" />
                        No modern digital experience to compete
                      </li>
                      <li className="flex items-start gap-2">
                        <X className="h-4 w-4 text-red-500 mt-1 shrink-0" />
                        Compliance and accuracy concerns with DIY tools
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* The Solution */}
          <section id="solution" className="mb-12 print:mb-8 scroll-mt-20">
            <h2 className="text-2xl font-semibold mb-5 flex items-center gap-2 print:text-xl">
              <Zap className="h-5 w-5 text-primary" />
              Our Solution
            </h2>
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent print:bg-transparent print:border-muted">
              <CardContent className="pt-6 pb-6">
                <p className="text-lg text-foreground/90 leading-relaxed mb-6">
                  <strong>Your Benefits</strong> is a turnkey platform that helps veterans, service members, and federal employees understand, prepare, and maximize their benefits. Licensees get a complete, white-label solution with AI-powered guidance, 20+ calculators, and a trusted referral network — ready to deploy under their own brand.
                </p>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium">White-Label Ready</p>
                      <p className="text-sm text-muted-foreground">Deploy under your brand instantly</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium">Compliance-Focused</p>
                      <p className="text-sm text-muted-foreground">Educational tools, not advice</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium">AI-Powered</p>
                      <p className="text-sm text-muted-foreground">Conversational guidance at scale</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Platform Features */}
          <section id="features" className="mb-12 print:mb-8 scroll-mt-20">
            <h2 className="text-2xl font-semibold mb-5 flex items-center gap-2 print:text-xl">
              <Puzzle className="h-5 w-5 text-primary" />
              Platform Features
            </h2>

            <div className="grid md:grid-cols-2 gap-4 mb-6 print:gap-3">
              {/* AI Benefits Agent */}
              <Card className="border-l-4 border-l-orange-500">
                <CardContent className="pt-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 rounded-lg bg-orange-500/10">
                      <Bot className="h-5 w-5 text-orange-500" />
                    </div>
                    <h3 className="font-semibold">AI Benefits Agent</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Conversational AI that guides users through eligibility, claim prep, and next steps.
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1.5">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-orange-500 shrink-0" />
                      Natural language Q&A about VA claims
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-orange-500 shrink-0" />
                      Guided Intent to File workflow
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-orange-500 shrink-0" />
                      Personalized recommendations
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Calculators Toolkit */}
              <Card className="border-l-4 border-l-green-500">
                <CardContent className="pt-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 rounded-lg bg-green-500/10">
                      <Calculator className="h-5 w-5 text-green-500" />
                    </div>
                    <h3 className="font-semibold">20+ Benefits Calculators</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Comprehensive toolkit for estimating benefits across all major categories.
                  </p>
                  <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3 text-green-500" />
                      VA Compensation
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3 text-green-500" />
                      TSP Growth
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-green-500" />
                      FERS Pension
                    </div>
                    <div className="flex items-center gap-1">
                      <GraduationCap className="h-3 w-3 text-green-500" />
                      GI Bill
                    </div>
                    <div className="flex items-center gap-1">
                      <Stethoscope className="h-3 w-3 text-green-500" />
                      TRICARE Finder
                    </div>
                    <div className="flex items-center gap-1">
                      <Home className="h-3 w-3 text-green-500" />
                      Property Tax Exemption
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Claims Preparation */}
              <Card className="border-l-4 border-l-blue-500">
                <CardContent className="pt-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 rounded-lg bg-blue-500/10">
                      <FileText className="h-5 w-5 text-blue-500" />
                    </div>
                    <h3 className="font-semibold">Claims Preparation</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Help users prepare for VA disability claims with guided workflows.
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1.5">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-blue-500 shrink-0" />
                      Intent to File form builder
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-blue-500 shrink-0" />
                      Condition eligibility checker
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-blue-500 shrink-0" />
                      Evidence documentation guide
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Referral Network */}
              <Card className="border-l-4 border-l-purple-500">
                <CardContent className="pt-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 rounded-lg bg-purple-500/10">
                      <Handshake className="h-5 w-5 text-purple-500" />
                    </div>
                    <h3 className="font-semibold">Referral Partner Network</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Connect users with accredited representatives and vetted partners.
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1.5">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-purple-500 shrink-0" />
                      Partner application system
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-purple-500 shrink-0" />
                      Lead routing & tracking
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-purple-500 shrink-0" />
                      Compliance verification
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Key Statistics */}
            <Card className="bg-muted/50">
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                  <div>
                    <div className="text-3xl font-bold text-primary">20+</div>
                    <div className="text-sm text-muted-foreground">Benefits Calculators</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-primary">5+</div>
                    <div className="text-sm text-muted-foreground">Calculator Categories</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-primary">AI</div>
                    <div className="text-sm text-muted-foreground">Powered Guidance</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-primary">100%</div>
                    <div className="text-sm text-muted-foreground">White-Label Ready</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Target Audiences */}
          <section className="mb-12 print:mb-8">
            <h2 className="text-2xl font-semibold mb-5 flex items-center gap-2 print:text-xl">
              <Users className="h-5 w-5 text-primary" />
              Who Uses Your Benefits
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Shield className="h-5 w-5 text-blue-500" />
                    Veterans & Service Members
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li>• Active duty preparing for transition</li>
                    <li>• Veterans exploring VA disability claims</li>
                    <li>• Guard & Reserve members</li>
                    <li>• Military families & survivors</li>
                  </ul>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-green-500" />
                    Federal Employees
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li>• FERS retirement planning</li>
                    <li>• TSP optimization</li>
                    <li>• Military buyback calculations</li>
                    <li>• TRICARE navigation</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Technology Stack */}
          <section id="technology" className="mb-12 print:mb-8 scroll-mt-20">
            <h2 className="text-2xl font-semibold mb-5 flex items-center gap-2 print:text-xl">
              <Code className="h-5 w-5 text-primary" />
              Technology & Architecture
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              <Card className="border-l-4 border-l-slate-500">
                <CardContent className="pt-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Layers className="h-5 w-5 text-slate-600" />
                    <h3 className="font-semibold">Modern Stack</h3>
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-1.5">
                    <li className="flex items-start gap-2 group relative">
                      <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-slate-500 shrink-0" />
                      <span className="cursor-help border-b border-dotted border-muted-foreground/50">React + TypeScript frontend</span>
                      <span className="absolute left-0 -top-10 w-56 bg-popover text-popover-foreground text-xs p-2 rounded shadow-lg opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity z-10 pointer-events-none print:hidden">
                        A modern, fast user interface built for reliability, performance, and long-term maintainability.
                      </span>
                    </li>
                    <li className="flex items-start gap-2 group relative">
                      <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-slate-500 shrink-0" />
                      <span className="cursor-help border-b border-dotted border-muted-foreground/50">Supabase backend & authentication</span>
                      <span className="absolute left-0 -top-10 w-56 bg-popover text-popover-foreground text-xs p-2 rounded shadow-lg opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity z-10 pointer-events-none print:hidden">
                        Secure backend services for user authentication, data storage, and access control.
                      </span>
                    </li>
                    <li className="flex items-start gap-2 group relative">
                      <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-slate-500 shrink-0" />
                      <span className="cursor-help border-b border-dotted border-muted-foreground/50">Edge functions for AI & integrations</span>
                      <span className="absolute left-0 -top-10 w-64 bg-popover text-popover-foreground text-xs p-2 rounded shadow-lg opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity z-10 pointer-events-none print:hidden">
                        Server-side logic that runs close to users for faster AI responses and third-party API integrations.
                      </span>
                    </li>
                    <li className="flex items-start gap-2 group relative">
                      <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-slate-500 shrink-0" />
                      <span className="cursor-help border-b border-dotted border-muted-foreground/50">Modular, API-first architecture</span>
                      <span className="absolute left-0 -top-10 w-64 bg-popover text-popover-foreground text-xs p-2 rounded shadow-lg opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity z-10 pointer-events-none print:hidden">
                        Features are built as independent modules so the platform can evolve safely without breaking existing functionality.
                      </span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-amber-500">
                <CardContent className="pt-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Lock className="h-5 w-5 text-amber-600" />
                    <h3 className="font-semibold">Security & Privacy</h3>
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-1.5">
                    <li className="flex items-start gap-2 group relative">
                      <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-amber-500 shrink-0" />
                      <span className="cursor-help border-b border-dotted border-muted-foreground/50">Security-first infrastructure</span>
                      <span className="absolute left-0 -top-10 w-56 bg-popover text-popover-foreground text-xs p-2 rounded shadow-lg opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity z-10 pointer-events-none print:hidden">
                        Built using industry best practices for secure cloud applications.
                      </span>
                    </li>
                    <li className="flex items-start gap-2 group relative">
                      <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-amber-500 shrink-0" />
                      <span className="cursor-help border-b border-dotted border-muted-foreground/50">Row-level security (RLS)</span>
                      <span className="absolute left-0 -top-10 w-64 bg-popover text-popover-foreground text-xs p-2 rounded shadow-lg opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity z-10 pointer-events-none print:hidden">
                        Each user and workspace can only access their own data. No cross-account exposure is possible.
                      </span>
                    </li>
                    <li className="flex items-start gap-2 group relative">
                      <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-amber-500 shrink-0" />
                      <span className="cursor-help border-b border-dotted border-muted-foreground/50">Encryption in transit and at rest</span>
                      <span className="absolute left-0 -top-10 w-56 bg-popover text-popover-foreground text-xs p-2 rounded shadow-lg opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity z-10 pointer-events-none print:hidden">
                        All data is encrypted while being transmitted and while stored.
                      </span>
                    </li>
                    <li className="flex items-start gap-2 group relative">
                      <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-amber-500 shrink-0" />
                      <span className="cursor-help border-b border-dotted border-muted-foreground/50">Minimal AI data usage</span>
                      <span className="absolute left-0 -top-10 w-64 bg-popover text-popover-foreground text-xs p-2 rounded shadow-lg opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity z-10 pointer-events-none print:hidden">
                        AI systems only receive the information needed to assist users. No sensitive personal data is included in AI calls.
                      </span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-cyan-500">
                <CardContent className="pt-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Server className="h-5 w-5 text-cyan-600" />
                    <h3 className="font-semibold">Scalability</h3>
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-1.5">
                    <li className="flex items-start gap-2 group relative">
                      <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-cyan-500 shrink-0" />
                      <span className="cursor-help border-b border-dotted border-muted-foreground/50">Edge-deployed globally</span>
                      <span className="absolute left-0 -top-10 w-56 bg-popover text-popover-foreground text-xs p-2 rounded shadow-lg opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity z-10 pointer-events-none print:hidden">
                        Services run close to users worldwide to reduce latency and improve performance.
                      </span>
                    </li>
                    <li className="flex items-start gap-2 group relative">
                      <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-cyan-500 shrink-0" />
                      <span className="cursor-help border-b border-dotted border-muted-foreground/50">Auto-scaling infrastructure</span>
                      <span className="absolute left-0 -top-10 w-56 bg-popover text-popover-foreground text-xs p-2 rounded shadow-lg opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity z-10 pointer-events-none print:hidden">
                        System capacity automatically adjusts as usage grows.
                      </span>
                    </li>
                    <li className="flex items-start gap-2 group relative">
                      <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-cyan-500 shrink-0" />
                      <span className="cursor-help border-b border-dotted border-muted-foreground/50">High-availability architecture</span>
                      <span className="absolute left-0 -top-10 w-56 bg-popover text-popover-foreground text-xs p-2 rounded shadow-lg opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity z-10 pointer-events-none print:hidden">
                        Designed to remain online even if individual components fail.
                      </span>
                    </li>
                    <li className="flex items-start gap-2 group relative">
                      <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-cyan-500 shrink-0" />
                      <span className="cursor-help border-b border-dotted border-muted-foreground/50">Built for multi-tenant growth</span>
                      <span className="absolute left-0 -top-10 w-64 bg-popover text-popover-foreground text-xs p-2 rounded shadow-lg opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity z-10 pointer-events-none print:hidden">
                        Supports many organizations securely on a shared platform without data overlap.
                      </span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Licensing Options */}
          <section id="licensing" className="mb-12 print:mb-8 scroll-mt-20">
            <h2 className="text-2xl font-semibold mb-5 flex items-center gap-2 print:text-xl">
              <Scale className="h-5 w-5 text-primary" />
              Licensing Options
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              <Card className="relative border-border">
                <CardHeader>
                  <Badge variant="outline" className="w-fit mb-2">Starter</Badge>
                  <CardTitle className="text-xl">Embedded Widgets</CardTitle>
                  <CardDescription>
                    Embed individual calculators into your existing website
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      Select calculators
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      Iframe embed codes
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      Basic customization
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="relative border-primary border-2">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary">Popular</Badge>
                </div>
                <CardHeader>
                  <Badge variant="outline" className="w-fit mb-2">Professional</Badge>
                  <CardTitle className="text-xl">White-Label Hub</CardTitle>
                  <CardDescription>
                    Full platform under your brand with custom domain
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      All 20+ calculators
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      AI Benefits Agent
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      Custom branding
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      Lead capture & CRM
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="relative border-border">
                <CardHeader>
                  <Badge variant="outline" className="w-fit mb-2">Enterprise</Badge>
                  <CardTitle className="text-xl">Full Source License</CardTitle>
                  <CardDescription>
                    Complete codebase with unlimited customization
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      Full source code
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      Self-hosted option
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      Custom integrations
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      Priority support
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Ideal Licensees */}
          <section className="mb-12 print:mb-8">
            <h2 className="text-2xl font-semibold mb-5 flex items-center gap-2 print:text-xl">
              <Briefcase className="h-5 w-5 text-primary" />
              Ideal Licensees
            </h2>
            <Card>
              <CardContent className="pt-6">
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center p-4">
                    <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-3">
                      <Scale className="h-6 w-6 text-blue-500" />
                    </div>
                    <h3 className="font-medium text-sm">VA Claims Firms</h3>
                    <p className="text-xs text-muted-foreground mt-1">Educate & qualify leads</p>
                  </div>
                  <div className="text-center p-4">
                    <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-3">
                      <DollarSign className="h-6 w-6 text-green-500" />
                    </div>
                    <h3 className="font-medium text-sm">Financial Advisors</h3>
                    <p className="text-xs text-muted-foreground mt-1">Retirement planning tools</p>
                  </div>
                  <div className="text-center p-4">
                    <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center mx-auto mb-3">
                      <Heart className="h-6 w-6 text-purple-500" />
                    </div>
                    <h3 className="font-medium text-sm">Veteran Nonprofits</h3>
                    <p className="text-xs text-muted-foreground mt-1">Free member resources</p>
                  </div>
                  <div className="text-center p-4">
                    <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-3">
                      <Building2 className="h-6 w-6 text-amber-500" />
                    </div>
                    <h3 className="font-medium text-sm">HR Platforms</h3>
                    <p className="text-xs text-muted-foreground mt-1">Federal employee benefits</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* CTA */}
          <section className="mb-12 print:mb-8 print:break-before-page">
            <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
              <CardContent className="pt-8 pb-8 text-center">
                <h2 className="text-2xl font-bold mb-3">Ready to License Your Benefits?</h2>
                <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
                  Schedule a demo to see the platform in action and discuss licensing options for your organization.
                </p>
                <div className="flex flex-wrap justify-center gap-4 print:hidden">
                  <Link to="/yourbenefits">
                    <Button size="lg" className="gap-2">
                      <Globe className="h-4 w-4" />
                      Explore Live Platform
                    </Button>
                  </Link>
                  <Button size="lg" variant="outline" className="gap-2">
                    <Phone className="h-4 w-4" />
                    Schedule Demo
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Footer */}
          <footer className="text-center pt-8 border-t print:border-t-0 print:pt-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Your Benefits Platform by Seeksy. All rights reserved.
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              This platform provides educational tools only — not legal or financial advice.
            </p>
          </footer>
        </div>
      </div>
    </>
  );
};

export default YourBenefitsPlatform;
