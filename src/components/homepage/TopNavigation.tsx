import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Menu, X, ChevronDown, Video, Scissors, Podcast, Calendar, 
  Users, Ticket, Trophy, DollarSign, Sparkles, ArrowRight,
  Mic, TrendingUp, Building2, Briefcase
} from "lucide-react";
import { cn } from "@/lib/utils";

const coreTools = [
  { label: "Media AI Studio", icon: Video, description: "Professional AI-powered recording & editing" },
  { label: "AI Clips Generator", icon: Scissors, description: "Auto-extract viral clips" },
  { label: "Podcast Hosting", icon: Podcast, description: "Host & distribute your show" },
  { label: "Meetings & Scheduling", icon: Calendar, description: "Book guests & run consultations" },
  { label: "CRM + Messaging", icon: Users, description: "Manage contacts & outreach" },
];

const moreTools = [
  { label: "Events & Ticketing", icon: Ticket, description: "Host events & sell tickets" },
  { label: "Awards & Programs", icon: Trophy, description: "Run recognition programs" },
  { label: "Monetization Tools", icon: DollarSign, description: "Earn from your content" },
  { label: "View all features", icon: ArrowRight, description: "Explore the full suite" },
];

const useCases = [
  { label: "For Podcasters", icon: Mic, description: "Build, distribute & grow your show" },
  { label: "For Creators", icon: TrendingUp, description: "Create viral content & increase reach" },
  { label: "For Event Hosts", icon: Ticket, description: "Run live events and guest bookings" },
  { label: "For Agencies", icon: Building2, description: "Manage multiple clients at scale" },
  { label: "For Businesses", icon: Briefcase, description: "Meetings, content & customer engagement" },
];

const navLinks = [
  { label: "Pricing", href: "/pricing" },
  { label: "Apps & Tools", href: "/apps-and-tools" },
  { label: "Blog", href: "/blog" },
  { label: "About", href: "/about" },
];

export function TopNavigation() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [featuresOpen, setFeaturesOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on ESC
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setFeaturesOpen(false);
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setFeaturesOpen(false);
      }
    };
    if (featuresOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [featuresOpen]);

  const handleNavigation = (href: string) => {
    navigate(href);
    setMobileMenuOpen(false);
    setFeaturesOpen(false);
  };

  return (
    <>
      {/* Backdrop overlay when menu is open */}
      {featuresOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40"
          onClick={() => setFeaturesOpen(false)}
        />
      )}
      
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200">
        <div className="container mx-auto px-4 lg:px-6">
          <nav className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-sm">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold text-slate-900 leading-tight">
                  Seeksy
                </span>
                <span className="text-[10px] text-slate-500 font-medium -mt-0.5 hidden sm:block">
                  Connection App
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1">
              {/* Features Mega-Menu */}
              <div
                ref={menuRef}
                className="relative"
              >
                <button 
                  className={cn(
                    "flex items-center gap-1 px-3 py-2 text-sm font-medium transition-colors rounded-full",
                    featuresOpen 
                      ? "text-slate-900 bg-slate-100" 
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  )}
                  onClick={() => setFeaturesOpen(!featuresOpen)}
                  onMouseEnter={() => setFeaturesOpen(true)}
                >
                  Features
                  <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-200", featuresOpen && "rotate-180")} />
                </button>
                
                {/* Mega Menu Dropdown */}
                <div 
                  className={cn(
                    "fixed left-0 right-0 top-16 z-50 transition-all duration-200",
                    featuresOpen 
                      ? "opacity-100 translate-y-0 pointer-events-auto" 
                      : "opacity-0 -translate-y-2 pointer-events-none"
                  )}
                  onMouseEnter={() => setFeaturesOpen(true)}
                  onMouseLeave={() => setFeaturesOpen(false)}
                >
                  <div className="bg-white border-b border-slate-200 shadow-xl">
                    <div className="container mx-auto px-6">
                      <div className="grid grid-cols-3 gap-0 py-6">
                        {/* Core Tools Column */}
                        <div className="pr-8 border-r border-slate-100">
                          <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-4">
                            Core Tools
                          </h3>
                          <div className="space-y-1">
                            {coreTools.map((item) => (
                              <div
                                key={item.label}
                                className="w-full flex items-start gap-3 px-2 py-2.5 rounded-lg hover:bg-slate-50 transition-colors group text-left cursor-default"
                              >
                                <item.icon className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
                                <div className="min-w-0">
                                  <span className="text-sm font-medium text-slate-800 group-hover:text-slate-900 block">
                                    {item.label}
                                  </span>
                                  <span className="text-xs text-slate-500 line-clamp-1">
                                    {item.description}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Use Cases Column */}
                        <div className="px-8 border-r border-slate-100">
                          <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-4">
                            Use Cases
                          </h3>
                          <div className="space-y-1">
                            {useCases.map((item) => (
                              <div
                                key={item.label}
                                className="w-full flex items-start gap-3 px-2 py-2.5 rounded-lg hover:bg-slate-50 transition-colors group text-left cursor-default"
                              >
                                <item.icon className="h-5 w-5 text-slate-400 mt-0.5 flex-shrink-0" />
                                <div className="min-w-0">
                                  <span className="text-sm font-medium text-slate-800 group-hover:text-slate-900 block">
                                    {item.label}
                                  </span>
                                  <span className="text-xs text-slate-500 line-clamp-1">
                                    {item.description}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* More Column */}
                        <div className="pl-8">
                          <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-4">
                            More
                          </h3>
                          <div className="space-y-1">
                            {moreTools.map((item) => (
                              <div
                                key={item.label}
                                className="w-full flex items-start gap-3 px-2 py-2.5 rounded-lg hover:bg-slate-50 transition-colors group text-left cursor-default"
                              >
                                <item.icon className="h-5 w-5 text-slate-400 mt-0.5 flex-shrink-0" />
                                <div className="min-w-0">
                                  <span className="text-sm font-medium text-slate-800 group-hover:text-slate-900 block">
                                    {item.label}
                                  </span>
                                  <span className="text-xs text-slate-500 line-clamp-1">
                                    {item.description}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Simple Nav Links */}
              {navLinks.map((link) => (
                <button
                  key={link.label}
                  onClick={() => handleNavigation(link.href)}
                  className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors rounded-full hover:bg-slate-50"
                >
                  {link.label}
                </button>
              ))}
            </div>

            {/* Desktop CTA */}
            <div className="hidden lg:flex items-center gap-3">
              <Button
                variant="ghost"
                onClick={() => navigate("/auth?mode=login")}
                className="text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium"
              >
                Login
              </Button>
              <Button
                onClick={() => navigate("/auth?mode=signup")}
                className="bg-primary text-primary-foreground font-medium hover:bg-primary/90 rounded-lg px-4"
              >
                Start Free
              </Button>
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </nav>

          {/* Mobile Menu */}
          <div className={cn(
            "lg:hidden overflow-hidden transition-all duration-300",
            mobileMenuOpen ? "max-h-[800px] pb-6" : "max-h-0"
          )}>
            <div className="flex flex-col gap-1 pt-4 border-t border-slate-100">
              {/* Mobile Core Tools Section */}
              <div className="px-2 py-2">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Core Tools</span>
              </div>
              {coreTools.map((item) => (
                <div
                  key={item.label}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-slate-50 rounded-lg transition-colors cursor-default"
                >
                  <item.icon className="h-4 w-4 text-orange-500" />
                  <span className="text-sm text-slate-700">{item.label}</span>
                </div>
              ))}
              
              {/* Mobile Use Cases Section */}
              <div className="px-2 py-2 mt-3">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Use Cases</span>
              </div>
              {useCases.map((item) => (
                <div
                  key={item.label}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-slate-50 rounded-lg transition-colors cursor-default"
                >
                  <item.icon className="h-4 w-4 text-slate-400" />
                  <span className="text-sm text-slate-700">{item.label}</span>
                </div>
              ))}
              
              {/* Mobile Simple Links */}
              <div className="px-2 py-2 mt-3">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">More</span>
              </div>
              {navLinks.map((link) => (
                <button
                  key={link.label}
                  onClick={() => handleNavigation(link.href)}
                  className="w-full text-left px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  {link.label}
                </button>
              ))}
              
              <div className="flex flex-col gap-2 pt-4 mt-3 border-t border-slate-100">
                <Button
                  variant="ghost"
                  onClick={() => {
                    navigate("/auth?mode=login");
                    setMobileMenuOpen(false);
                  }}
                  className="w-full justify-center text-slate-600"
                >
                  Login
                </Button>
                <Button
                  onClick={() => {
                    navigate("/auth?mode=signup");
                    setMobileMenuOpen(false);
                  }}
                  className="w-full bg-primary text-primary-foreground font-medium"
                >
                  Start Free
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
