import { TopNavigation } from "@/components/homepage/TopNavigation";
import { FooterSection } from "@/components/homepage/FooterSection";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, Sparkles, Video, Scissors, Podcast, Link2, Calendar, Users, 
  MessageSquare, Mail, Ticket, DollarSign, ShieldCheck, FolderOpen, 
  Play, LayoutDashboard, Megaphone, Trophy, ArrowRight, FileText, CheckSquare,
  BarChart3, UserPlus, Zap, QrCode, ClipboardList, UserCheck, Share2,
  Building2, Mic, Globe, PieChart, Target, ListTodo, ChevronDown, ChevronUp
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowUpDown } from "lucide-react";

interface Tool {
  icon: any;
  title: string;
  description: string;
  href: string;
  status?: 'active' | 'available' | 'coming-soon';
  bestWith?: string[];
}

interface Category {
  title: string;
  description: string;
  icon: any;
  color: string;
  tools: Tool[];
}

const categories: Category[] = [
  {
    title: "Creator Tools",
    description: "Build your audience and personal brand",
    icon: Sparkles,
    color: "from-amber-500 to-orange-500",
    tools: [
      { icon: Share2, title: "Social Connect", description: "Connect and sync your social media accounts", href: "/integrations", status: "available" },
      { icon: BarChart3, title: "Audience Insights", description: "Analytics for your followers and engagement", href: "/social-analytics", status: "available" },
      { icon: Target, title: "Brand Campaigns", description: "Manage brand deals and sponsorships", href: "/campaigns", status: "available" },
      { icon: DollarSign, title: "Revenue Tracking", description: "Monitor all your income streams", href: "/revenue", status: "available" },
      { icon: Zap, title: "Growth Tools", description: "Tools to accelerate your growth", href: "/growth", status: "coming-soon" },
      { icon: FolderOpen, title: "Media Library", description: "Organize all your content assets", href: "/studio/media", status: "available" },
    ]
  },
  {
    title: "Media & Content",
    description: "Create, record, and edit professional content",
    icon: Video,
    color: "from-violet-500 to-purple-500",
    tools: [
      { icon: Video, title: "Studio & Recording", description: "Professional AI-powered recording studio", href: "/studio", status: "available" },
      { icon: Podcast, title: "Podcasts", description: "Host and distribute your podcast", href: "/podcasts", status: "available" },
      { icon: FolderOpen, title: "Media Library", description: "All your media files organized", href: "/media-vault", status: "available" },
      { icon: Scissors, title: "Clips & Editing", description: "AI-powered clip generation", href: "/studio/clips", status: "available" },
      { icon: Link2, title: "My Page Streaming", description: "Embed streams on your creator page", href: "/my-page", status: "available" },
      { icon: Mic, title: "Voice Studio", description: "Voice recording and enhancement", href: "/studio/audio", status: "available" },
    ]
  },
  {
    title: "Marketing & CRM",
    description: "Engage your audience and grow your reach",
    icon: Megaphone,
    color: "from-blue-500 to-cyan-500",
    tools: [
      { icon: Users, title: "Contacts", description: "Manage your audience database", href: "/contacts", status: "available" },
      { icon: BarChart3, title: "Social Analytics", description: "Track performance across platforms", href: "/social-analytics", status: "available" },
      { icon: UserPlus, title: "Segments", description: "Group contacts by behavior", href: "/segments", status: "available" },
      { icon: Megaphone, title: "Campaigns", description: "Run marketing campaigns", href: "/campaigns", status: "available" },
      { icon: Mail, title: "Email Templates", description: "Beautiful email designs", href: "/email-templates", status: "available" },
      { icon: Zap, title: "Automations", description: "Automated workflows", href: "/automations", status: "available" },
      { icon: MessageSquare, title: "SMS", description: "Text message campaigns", href: "/sms", status: "available" },
      { icon: ClipboardList, title: "Forms", description: "Collect leads and feedback", href: "/forms", status: "available", bestWith: ["Events"] },
      { icon: QrCode, title: "QR Codes", description: "Generate trackable QR codes", href: "/qr-codes", status: "available" },
    ]
  },
  {
    title: "Business Operations",
    description: "Professional tools for managing clients, projects, tasks, and events",
    icon: Building2,
    color: "from-emerald-500 to-green-500",
    tools: [
      { icon: Calendar, title: "Meetings", description: "Book calls and appointments", href: "/creator/meetings", status: "available" },
      { icon: ClipboardList, title: "Sign-ups", description: "Collect RSVPs and registrations", href: "/signup-sheets", status: "available", bestWith: ["Events"] },
      { icon: FileText, title: "Proposals", description: "Create professional proposals and contracts", href: "/proposals", status: "available" },
      { icon: CheckSquare, title: "Tasks", description: "Manage tasks and projects", href: "/tasks", status: "available" },
      { icon: Ticket, title: "Events", description: "Create events and manage RSVPs", href: "/events", status: "available", bestWith: ["Forms"] },
      { icon: ListTodo, title: "Polls & Surveys", description: "Collect audience feedback", href: "/polls", status: "available" },
      { icon: Trophy, title: "Awards", description: "Award programs and nominations", href: "/awards", status: "available" },
      { icon: UserCheck, title: "Team & Collaboration", description: "Manage team members and collaborate", href: "/team", status: "available" },
    ]
  },
  {
    title: "Identity & Creator Profile",
    description: "Verify your identity and build your brand",
    icon: ShieldCheck,
    color: "from-teal-500 to-cyan-500",
    tools: [
      { icon: Link2, title: "My Page Builder", description: "Create your link-in-bio page", href: "/my-page", status: "available" },
      { icon: ShieldCheck, title: "Identity Verification", description: "Blockchain-backed voice & face verification", href: "/identity", status: "available" },
      { icon: UserCheck, title: "Influencer Profile", description: "Professional creator portfolio", href: "/profile", status: "available" },
    ]
  },
  {
    title: "Integrations",
    description: "Connect with your favorite tools",
    icon: Globe,
    color: "from-slate-500 to-gray-500",
    tools: [
      { icon: Share2, title: "Social Platforms", description: "Instagram, YouTube, TikTok, Facebook", href: "/integrations", status: "available" },
      { icon: PieChart, title: "Analytics", description: "Google Analytics, Spotify, Apple Podcasts", href: "/integrations", status: "available" },
      { icon: Calendar, title: "Calendar", description: "Google Calendar, Outlook, Zoom", href: "/integrations", status: "available" },
    ]
  },
  {
    title: "Monetization",
    description: "Turn your content into revenue",
    icon: DollarSign,
    color: "from-yellow-500 to-amber-500",
    tools: [
      { icon: DollarSign, title: "Monetization Hub", description: "All your revenue streams in one place", href: "/monetization", status: "available" },
      { icon: Megaphone, title: "Ad Library", description: "Manage advertising inventory", href: "/ad-library", status: "available" },
      { icon: Play, title: "Create Ad", description: "Build new ad campaigns", href: "/create-ad", status: "available" },
      { icon: BarChart3, title: "Revenue Analytics", description: "Track earnings and payouts", href: "/revenue", status: "available" },
    ]
  },
];

function CategorySection({ category, id }: { category: Category; id: string }) {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(true);
  
  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-emerald-900/50 text-emerald-300 border-emerald-700 text-xs">Active</Badge>;
      case 'coming-soon':
        return <Badge className="bg-slate-700/50 text-slate-400 border-slate-600 text-xs">Coming Soon</Badge>;
      default:
        return <Badge className="bg-blue-900/50 text-blue-300 border-blue-700 text-xs">Available</Badge>;
    }
  };

  return (
    <div id={id} className="bg-slate-900/50 rounded-2xl border border-slate-700 shadow-sm overflow-hidden scroll-mt-24">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-5 hover:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className={cn("w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center", category.color)}>
            <category.icon className="w-6 h-6 text-white" />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-white">{category.title}</h2>
              <Badge variant="secondary" className="bg-amber-500/20 text-amber-300 border-amber-500/30">
                {category.tools.length} modules
              </Badge>
            </div>
            <p className="text-sm text-slate-400">{category.description}</p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-slate-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate-400" />
        )}
      </button>
      
      {isExpanded && (
        <div className="px-5 pb-5">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {category.tools.map((tool) => (
              <button
                key={tool.title}
                onClick={() => tool.status !== 'coming-soon' && navigate(tool.href)}
                disabled={tool.status === 'coming-soon'}
                className={cn(
                  "group relative bg-slate-800/50 hover:bg-slate-700/50 rounded-xl p-4 border border-slate-700 hover:border-slate-600 transition-all text-left",
                  tool.status === 'coming-soon' && "opacity-60 cursor-not-allowed"
                )}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center group-hover:border-slate-600 transition-colors">
                    <tool.icon className="w-5 h-5 text-slate-300" />
                  </div>
                  {getStatusBadge(tool.status)}
                </div>
                
                <h3 className="font-semibold text-white mb-1 group-hover:text-amber-400 transition-colors text-sm">
                  {tool.title}
                </h3>
                
                <p className="text-xs text-slate-400 leading-relaxed mb-2">
                  {tool.description}
                </p>
                
                {tool.bestWith && tool.bestWith.length > 0 && (
                  <div className="flex items-center gap-1 text-xs text-emerald-400">
                    <span>Best with:</span>
                    {tool.bestWith.map((item, i) => (
                      <span key={item}>{item}{i < tool.bestWith!.length - 1 ? ', ' : ''}</span>
                    ))}
                  </div>
                )}
                
                {tool.status !== 'coming-soon' && (
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowRight className="w-4 h-4 text-amber-400" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AppsAndTools() {
  const navigate = useNavigate();

  const [sortMode, setSortMode] = useState<'category' | 'alphabetical'>('category');

  // Flatten all tools for alphabetical view
  const allToolsAlphabetical = useMemo(() => {
    const tools = categories.flatMap(cat => 
      cat.tools.map(tool => ({ ...tool, categoryTitle: cat.title, categoryColor: cat.color }))
    );
    return tools.sort((a, b) => a.title.localeCompare(b.title));
  }, []);

  const scrollToCategory = (categoryTitle: string) => {
    const id = categoryTitle.toLowerCase().replace(/\s+/g, '-').replace(/&/g, 'and');
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const getStatusBadgeAlpha = (status?: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-emerald-900/50 text-emerald-300 border-emerald-700 text-xs">Active</Badge>;
      case 'coming-soon':
        return <Badge className="bg-slate-700/50 text-slate-400 border-slate-600 text-xs">Coming Soon</Badge>;
      default:
        return <Badge className="bg-blue-900/50 text-blue-300 border-blue-700 text-xs">Available</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <TopNavigation />
      
      <main className="pt-24">
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-12 text-center">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="mb-8 text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Homepage
          </Button>
          
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-center gap-2 mb-6">
              <Sparkles className="w-8 h-8 text-amber-500" />
              <span className="text-amber-400 font-semibold">Seeksy App Directory</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-black mb-6 text-white">
              All modules, tools, and integrations available in your workspace
            </h1>
            
            <p className="text-lg text-slate-400 mb-8">
              Discover the complete suite of Seeksy tools designed to help creators 
              build their brand, engage their audience, and turn passion into profit.
            </p>
            
            {/* Sort Dropdown + Category Navigation */}
            <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white">
                    <ArrowUpDown className="w-4 h-4 mr-2" />
                    Sort: {sortMode === 'category' ? 'By Category' : 'A-Z'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-slate-800 border-slate-700 z-50">
                  <DropdownMenuItem 
                    onClick={() => setSortMode('category')}
                    className={cn("text-slate-300 hover:text-white hover:bg-slate-700 cursor-pointer", sortMode === 'category' && "bg-slate-700 text-white")}
                  >
                    By Category
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setSortMode('alphabetical')}
                    className={cn("text-slate-300 hover:text-white hover:bg-slate-700 cursor-pointer", sortMode === 'alphabetical' && "bg-slate-700 text-white")}
                  >
                    A-Z (Alphabetical)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Category Quick Nav - only show when in category mode */}
            {sortMode === 'category' && (
              <div className="flex flex-wrap items-center justify-center gap-2">
                {categories.map((category) => (
                  <button
                    key={category.title}
                    onClick={() => scrollToCategory(category.title)}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 hover:border-slate-600 rounded-full text-sm font-medium text-slate-300 hover:text-white transition-all"
                  >
                    <category.icon className="w-4 h-4" />
                    {category.title}
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Categories or Alphabetical View */}
        <section className="container mx-auto px-4 py-8 pb-20">
          <div className="max-w-7xl mx-auto space-y-4">
            {sortMode === 'category' ? (
              categories.map((category) => (
                <CategorySection 
                  key={category.title} 
                  category={category} 
                  id={category.title.toLowerCase().replace(/\s+/g, '-').replace(/&/g, 'and')}
                />
              ))
            ) : (
              <div className="bg-slate-900/50 rounded-2xl border border-slate-700 p-5">
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {allToolsAlphabetical.map((tool) => (
                    <button
                      key={`${tool.categoryTitle}-${tool.title}`}
                      onClick={() => tool.status !== 'coming-soon' && navigate(tool.href)}
                      disabled={tool.status === 'coming-soon'}
                      className={cn(
                        "group relative bg-slate-800/50 hover:bg-slate-700/50 rounded-xl p-4 border border-slate-700 hover:border-slate-600 transition-all text-left",
                        tool.status === 'coming-soon' && "opacity-60 cursor-not-allowed"
                      )}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center group-hover:border-slate-600 transition-colors">
                          <tool.icon className="w-5 h-5 text-slate-300" />
                        </div>
                        {getStatusBadgeAlpha(tool.status)}
                      </div>
                      
                      <h3 className="font-semibold text-white mb-1 group-hover:text-amber-400 transition-colors text-sm">
                        {tool.title}
                      </h3>
                      
                      <p className="text-xs text-slate-400 leading-relaxed mb-2">
                        {tool.description}
                      </p>
                      
                      <p className="text-xs text-slate-500">
                        {tool.categoryTitle}
                      </p>
                      
                      {tool.status !== 'coming-soon' && (
                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                          <ArrowRight className="w-4 h-4 text-amber-400" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-4 py-16 text-center">
          <div className="max-w-xl mx-auto bg-gradient-to-br from-amber-900/30 to-orange-900/30 rounded-3xl p-8 border border-amber-700/50">
            <h2 className="text-2xl font-bold mb-4 text-white">Ready to Get Started?</h2>
            <p className="text-slate-400 mb-6">
              Sign up free and unlock the full power of Seeksy's creator toolkit.
            </p>
            <Button
              onClick={() => navigate("/auth?mode=signup")}
              size="lg"
              className="bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold hover:opacity-90"
            >
              Start Free Today
            </Button>
          </div>
        </section>
      </main>

      <FooterSection />
    </div>
  );
}
