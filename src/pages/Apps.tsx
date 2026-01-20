import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ModuleCard, ModuleCardProps } from "@/components/apps/ModuleCard";
import { ModulePreviewModal } from "@/components/apps/ModulePreviewModal";
import { CustomPackageBuilder } from "@/components/apps/CustomPackageBuilder";
import { CategoryTooltip } from "@/components/apps/CategoryTooltip";
import { MyWorkspacesSection } from "@/components/apps/MyWorkspacesSection";
import { 
  Search, Instagram, BarChart3, Megaphone, DollarSign, TrendingUp, FolderOpen,
  Mic, Podcast, Image, Scissors, Video, Users, PieChart, Target, Mail, 
  Zap, MessageCircle, FormInput, FileText, CheckSquare, Calendar, Vote,
  Trophy, UserPlus, Layout, Shield, Star, Globe, CalendarClock, Grid3X3,
  ChevronDown, LayoutGrid, List, Package, Layers, Share2, Copy, BrainCircuit,
  Wand2, Clapperboard, Bot, Newspaper, Eye, SortAsc, ArrowDownAZ, FolderKanban
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { trackModuleOpened } from "@/utils/gtm";
import { usePortal } from "@/contexts/PortalContext";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useModuleActivation } from "@/hooks/useModuleActivation";
import { useCustomPackages } from "@/hooks/useCustomPackages";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type ModuleStatus = "active" | "available" | "coming_soon";
type ViewMode = "category" | "alphabetical" | "collection";

interface Module extends Omit<ModuleCardProps, 'onClick' | 'compact' | 'onPreview' | 'tooltipData'> {
  category: string;
  creditEstimate?: number;
  collection?: string;
  isNew?: boolean;
  isAIPowered?: boolean;
}

interface Category {
  id: string;
  name: string;
  shortName: string;
  icon: React.ElementType;
  description: string;
  bgClass: string;
  accentColor: string;
  tooltipData?: {
    purpose: string;
    bestForUsers: string;
    recommendedModules: string[];
    exampleWorkflows: string;
  };
}

// Collections/Groups for modules
const collections: Record<string, { name: string; icon: React.ElementType; description: string }> = {
  "creator-studio": { name: "Creator Studio", icon: Mic, description: "Recording, editing, and content creation tools" },
  "podcasting": { name: "Podcasting", icon: Podcast, description: "Podcast hosting and distribution" },
  "campaigns": { name: "Campaigns & Marketing", icon: Megaphone, description: "Email, SMS, and marketing automation" },
  "events": { name: "Events & Meetings", icon: Calendar, description: "Events, meetings, and scheduling" },
  "crm-business": { name: "CRM & Business", icon: Users, description: "Contacts, deals, and business operations" },
  "identity": { name: "Identity & Profile", icon: Shield, description: "Personal branding and verification" },
  "ai-tools": { name: "AI Tools", icon: BrainCircuit, description: "AI-powered automation and assistance" },
  "analytics": { name: "Analytics", icon: PieChart, description: "Insights and performance tracking" },
  "integrations": { name: "Integrations", icon: Globe, description: "Third-party connections and sync" },
};

const categories: Category[] = [
  { id: "all", name: "All Modules", shortName: "All", icon: Grid3X3, description: "", bgClass: "", accentColor: "" },
  { 
    id: "creator", 
    name: "Creator Tools", 
    shortName: "Creator",
    icon: Star, 
    description: "Modules that help creators grow, analyze, or monetize their audience",
    bgClass: "bg-amber-50 dark:bg-amber-950/30 border-amber-200/50 dark:border-amber-800/30",
    accentColor: "text-amber-600 dark:text-amber-400",
    tooltipData: {
      purpose: "Tools designed to help creators manage their audience, personal brand, and engagement insights",
      bestForUsers: "New or growing creators who need analytics, audience syncing, and brand deal management",
      recommendedModules: ["Social Connect", "Audience Insights", "Brand Campaigns"],
      exampleWorkflows: "Connect socials → Analyze audience → Apply for brand deals → Track revenue"
    }
  },
  { 
    id: "media", 
    name: "Media & Content", 
    shortName: "Media",
    icon: Video, 
    description: "Create, manage, and publish audio, video, and media",
    bgClass: "bg-violet-50 dark:bg-violet-950/30 border-violet-200/50 dark:border-violet-800/30",
    accentColor: "text-violet-600 dark:text-violet-400",
    tooltipData: {
      purpose: "Create, manage, and publish professional audio, video, and media content",
      bestForUsers: "Podcasters, video creators, and content producers",
      recommendedModules: ["Studio & Recording", "Podcasts", "Clips & Editing"],
      exampleWorkflows: "Record in Studio → Edit with AI → Generate clips → Publish to podcast"
    }
  },
  { 
    id: "marketing", 
    name: "Marketing & CRM", 
    shortName: "Marketing",
    icon: Megaphone, 
    description: "Communication, segmentation, automation, and multi-channel marketing",
    bgClass: "bg-sky-50 dark:bg-sky-950/30 border-sky-200/50 dark:border-sky-800/30",
    accentColor: "text-sky-600 dark:text-sky-400",
    tooltipData: {
      purpose: "Communication, segmentation, automation, and multi-channel marketing tools",
      bestForUsers: "Creators with audiences to nurture and grow",
      recommendedModules: ["Contacts", "Campaigns", "Automations"],
      exampleWorkflows: "Import contacts → Create segments → Run campaigns → Track results"
    }
  },
  { 
    id: "business", 
    name: "Business Operations", 
    shortName: "Business",
    icon: CheckSquare, 
    description: "Professional tools for managing clients, projects, tasks, and events",
    bgClass: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200/50 dark:border-emerald-800/30",
    accentColor: "text-emerald-600 dark:text-emerald-400",
    tooltipData: {
      purpose: "Professional tools for managing clients, projects, tasks, and events",
      bestForUsers: "Event organizers, speakers, and professional creators",
      recommendedModules: ["Events", "Proposals", "Tasks"],
      exampleWorkflows: "Create event → Build proposal → Manage tasks → Track completion"
    }
  },
  { 
    id: "identity", 
    name: "Identity & Profile", 
    shortName: "Identity",
    icon: Shield, 
    description: "Everything related to who you are and how you show up publicly",
    bgClass: "bg-rose-50 dark:bg-rose-950/30 border-rose-200/50 dark:border-rose-800/30",
    accentColor: "text-rose-600 dark:text-rose-400",
    tooltipData: {
      purpose: "Everything related to who you are and how you show up publicly",
      bestForUsers: "Creators building their personal brand",
      recommendedModules: ["My Page Builder", "Identity & Verification"],
      exampleWorkflows: "Verify identity → Build My Page → Share link → Track visitors"
    }
  },
  { 
    id: "integrations", 
    name: "Integrations", 
    shortName: "Integrations",
    icon: Globe, 
    description: "Platform and third-party data connections",
    bgClass: "bg-cyan-50 dark:bg-cyan-950/30 border-cyan-200/50 dark:border-cyan-800/30",
    accentColor: "text-cyan-600 dark:text-cyan-400",
    tooltipData: {
      purpose: "Platform and third-party data connections to sync your workflow",
      bestForUsers: "Tech-savvy creators who use multiple tools",
      recommendedModules: ["Social Connect", "Calendar Integrations"],
      exampleWorkflows: "Connect platforms → Sync data → Automate workflows"
    }
  },
];

const modules: Module[] = [
  // Creator Studio Collection
  {
    id: "studio",
    name: "Studio & Recording",
    description: "Record podcasts, videos, livestreams with HD quality",
    icon: Mic,
    status: "active",
    category: "media",
    collection: "creator-studio",
    route: "/studio",
    recommendedWith: ["Media Library", "Podcasts"],
    creditEstimate: 50,
  },
  {
    id: "ai-clips",
    name: "AI Clips Generator",
    description: "Automatically generate viral clips from long-form content",
    icon: Scissors,
    status: "active",
    category: "media",
    collection: "creator-studio",
    route: "/clips",
    isNew: true,
    isAIPowered: true,
    recommendedWith: ["Studio & Recording"],
    creditEstimate: 30,
  },
  {
    id: "ai-post-production",
    name: "AI Post-Production",
    description: "Remove filler words, pauses, and enhance audio with AI",
    icon: Wand2,
    status: "active",
    category: "media",
    collection: "creator-studio",
    route: "/studio/ai-post-production",
    isAIPowered: true,
    creditEstimate: 25,
  },
  {
    id: "media-library",
    name: "Media Library",
    description: "Store audio, video, and images securely",
    icon: Image,
    status: "active",
    category: "media",
    collection: "creator-studio",
    route: "/studio/media",
    creditEstimate: 10,
  },
  {
    id: "video-editor",
    name: "Video Editor",
    description: "Edit videos with timeline, transitions, and captions",
    icon: Clapperboard,
    status: "active",
    category: "media",
    collection: "creator-studio",
    route: "/studio/editor",
    creditEstimate: 30,
  },
  {
    id: "voice-cloning",
    name: "Voice Cloning Tools",
    description: "Clone and manage AI voice profiles for content creation",
    icon: Copy,
    status: "active",
    category: "media",
    collection: "creator-studio",
    route: "/voice-cloning",
    isNew: true,
    isAIPowered: true,
    creditEstimate: 40,
  },

  // Podcasting Collection
  {
    id: "podcasts",
    name: "Podcasts",
    description: "Podcast hosting, RSS feeds, and distribution",
    icon: Podcast,
    status: "active",
    category: "media",
    collection: "podcasting",
    route: "/podcasts",
    recommendedWith: ["Studio & Recording"],
    creditEstimate: 20,
  },

  // Campaigns & Marketing Collection
  {
    id: "campaigns",
    name: "Marketing Campaigns",
    description: "Multi-channel marketing campaigns",
    icon: Megaphone,
    status: "active",
    category: "marketing",
    collection: "campaigns",
    route: "/marketing/campaigns",
    recommendedWith: ["Email Templates", "Automations"],
    creditEstimate: 25,
  },
  {
    id: "email",
    name: "Inbox",
    description: "Full email inbox with multi-account support",
    icon: Mail,
    status: "active",
    category: "marketing",
    collection: "campaigns",
    route: "/email/inbox",
    recommendedWith: ["Campaigns", "Contacts"],
    creditEstimate: 10,
  },
  {
    id: "newsletter",
    name: "Newsletter",
    description: "Build and send beautiful newsletters with drag-and-drop editor",
    icon: Share2,
    status: "active",
    category: "marketing",
    collection: "campaigns",
    route: "/newsletter",
    creditEstimate: 15,
  },
  {
    id: "sms",
    name: "SMS Marketing",
    description: "Text messaging and campaigns",
    icon: MessageCircle,
    status: "active",
    category: "marketing",
    collection: "campaigns",
    route: "/sms",
    creditEstimate: 20,
  },
  {
    id: "automations",
    name: "Workflow Automations",
    description: "Automated workflows and sequences",
    icon: Zap,
    status: "active",
    category: "marketing",
    collection: "campaigns",
    route: "/marketing/automations",
    recommendedWith: ["Campaigns"],
    creditEstimate: 15,
  },
  {
    id: "email-templates",
    name: "Email Templates",
    description: "Design reusable email templates",
    icon: Mail,
    status: "active",
    category: "marketing",
    collection: "campaigns",
    route: "/marketing/templates",
    creditEstimate: 10,
  },
  {
    id: "segments",
    name: "Audience Segments",
    description: "Create targeted audience segments",
    icon: Target,
    status: "active",
    category: "marketing",
    collection: "campaigns",
    route: "/marketing/segments",
    recommendedWith: ["Contacts & Audience"],
    creditEstimate: 5,
  },

  // Events & Meetings Collection
  {
    id: "events",
    name: "Events & Ticketing",
    description: "Create events, sell tickets, and manage RSVPs",
    icon: Calendar,
    status: "active",
    category: "business",
    collection: "events",
    route: "/events",
    recommendedWith: ["Forms"],
    creditEstimate: 15,
  },
  {
    id: "meetings",
    name: "Meetings & Scheduling",
    description: "Book calls and appointments",
    icon: CalendarClock,
    status: "active",
    category: "business",
    collection: "events",
    route: "/creator/meetings",
    recommendedWith: ["Events"],
    creditEstimate: 5,
  },
  {
    id: "forms",
    name: "Forms Builder",
    description: "Build forms and collect submissions",
    icon: FormInput,
    status: "active",
    category: "business",
    collection: "events",
    route: "/forms",
    creditEstimate: 5,
  },
  {
    id: "polls",
    name: "Polls & Surveys",
    description: "Collect audience feedback",
    icon: Vote,
    status: "active",
    category: "business",
    collection: "events",
    route: "/polls",
    creditEstimate: 5,
  },
  {
    id: "awards",
    name: "Awards Program",
    description: "Award programs with nominations and voting",
    icon: Trophy,
    status: "active",
    category: "business",
    collection: "events",
    route: "/awards",
    creditEstimate: 10,
  },

  // CRM & Business Collection
  {
    id: "crm",
    name: "CRM",
    description: "Complete customer relationship management",
    icon: Users,
    status: "active",
    category: "marketing",
    collection: "crm-business",
    route: "/crm",
    creditEstimate: 15,
  },
  {
    id: "contacts",
    name: "Contacts & Audience",
    description: "Manage contacts, leads, and subscribers",
    icon: Users,
    status: "active",
    category: "marketing",
    collection: "crm-business",
    route: "/audience",
    recommendedWith: ["Segments", "Campaigns"],
    creditEstimate: 5,
  },
  {
    id: "project-management",
    name: "Project Management",
    description: "Tasks, tickets, leads, and e-signatures",
    icon: FolderOpen,
    status: "active",
    category: "business",
    collection: "crm-business",
    route: "/project-management",
    recommendedWith: ["Tasks", "Contacts & Audience"],
    creditEstimate: 15,
  },
  {
    id: "tasks",
    name: "Tasks & To-dos",
    description: "Manage tasks and projects",
    icon: CheckSquare,
    status: "active",
    category: "business",
    collection: "crm-business",
    route: "/tasks",
    creditEstimate: 5,
  },
  {
    id: "proposals",
    name: "Proposals & Contracts",
    description: "Create professional proposals with e-signatures",
    icon: FileText,
    status: "active",
    category: "business",
    collection: "crm-business",
    route: "/proposals",
    creditEstimate: 10,
  },
  {
    id: "deals",
    name: "Deals Pipeline",
    description: "Track deals through your sales pipeline",
    icon: DollarSign,
    status: "active",
    category: "business",
    collection: "crm-business",
    route: "/deals",
    creditEstimate: 10,
  },

  // Identity & Profile Collection
  {
    id: "my-page",
    name: "My Page Builder",
    description: "Build your personal landing page",
    icon: Layout,
    status: "active",
    category: "identity",
    collection: "identity",
    route: "/profile/edit",
    recommendedWith: ["Identity & Verification"],
    creditEstimate: 5,
  },
  {
    id: "identity-verification",
    name: "Identity & Verification",
    description: "Verify voice and face on blockchain, manage rights",
    icon: Shield,
    status: "active",
    category: "identity",
    collection: "identity",
    route: "/identity",
    isNew: true,
    recommendedWith: ["My Page Builder"],
    creditEstimate: 20,
  },
  {
    id: "broadcast-monitoring",
    name: "Broadcast Monitoring",
    description: "Monitor platforms for unauthorized use of your content",
    icon: Eye,
    status: "active",
    category: "identity",
    collection: "identity",
    route: "/broadcast-monitoring",
    isNew: true,
    isAIPowered: true,
    creditEstimate: 25,
  },
  {
    id: "guest-appearances",
    name: "Guest Appearances",
    description: "Track and showcase your podcast and video appearances",
    icon: Mic,
    status: "active",
    category: "identity",
    collection: "identity",
    route: "/my-appearances",
    recommendedWith: ["Identity & Verification", "Social Connect"],
    creditEstimate: 10,
  },

  // AI Tools Collection
  {
    id: "spark-ai",
    name: "Spark AI Assistant",
    description: "Your intelligent AI co-pilot for content and growth",
    icon: BrainCircuit,
    status: "active",
    category: "creator",
    collection: "ai-tools",
    route: "/spark",
    isNew: true,
    isAIPowered: true,
    creditEstimate: 30,
  },
  {
    id: "ai-automation",
    name: "AI Automation",
    description: "Create intelligent automations powered by AI",
    icon: Bot,
    status: "active",
    category: "creator",
    collection: "ai-tools",
    route: "/automations/ai",
    isNew: true,
    isAIPowered: true,
    creditEstimate: 25,
  },
  {
    id: "ai-agent",
    name: "AI Agent",
    description: "Your intelligent AI co-pilot for navigation and strategy",
    icon: BrainCircuit,
    status: "active",
    category: "creator",
    collection: "ai-tools",
    route: "/assistant",
    isNew: true,
    isAIPowered: true,
    creditEstimate: 20,
  },

  // Analytics Collection
  {
    id: "audience-insights",
    name: "Audience Insights",
    description: "Deep analytics on followers, engagement, and demographics",
    icon: BarChart3,
    status: "active",
    category: "creator",
    collection: "analytics",
    route: "/social-analytics",
    recommendedWith: ["Social Connect"],
    creditEstimate: 10,
  },
  {
    id: "social-analytics",
    name: "Social Analytics",
    description: "Track social media performance and trends",
    icon: PieChart,
    status: "active",
    category: "creator",
    collection: "analytics",
    route: "/social-analytics",
    recommendedWith: ["Social Connect"],
    creditEstimate: 10,
  },

  // Content
  {
    id: "blog",
    name: "Blog & Content",
    description: "Write and publish blog posts with SEO optimization",
    icon: Newspaper,
    status: "active",
    category: "media",
    collection: "campaigns",
    route: "/my-blog",
    creditEstimate: 10,
  },

  // Integrations Collection
  {
    id: "social-connect",
    name: "Social Connect",
    description: "Connect Instagram, YouTube, TikTok, Facebook and import your data",
    icon: Instagram,
    status: "active",
    category: "integrations",
    collection: "integrations",
    route: "/integrations",
    recommendedWith: ["Audience Insights", "Social Analytics"],
    creditEstimate: 5,
  },
  {
    id: "qr-codes",
    name: "QR Codes",
    description: "Generate and track QR codes",
    icon: Grid3X3,
    status: "active",
    category: "marketing",
    collection: "campaigns",
    route: "/qr-codes",
    creditEstimate: 5,
  },
  {
    id: "signups",
    name: "Sign-up Sheets",
    description: "Collect RSVPs and registrations",
    icon: FormInput,
    status: "active",
    category: "business",
    collection: "events",
    route: "/signup-sheets",
    recommendedWith: ["Events", "Forms"],
    creditEstimate: 5,
  },
  {
    id: "team",
    name: "Team & Collaboration",
    description: "Manage team members and collaborate",
    icon: UserPlus,
    status: "active",
    category: "business",
    collection: "crm-business",
    route: "/team",
    creditEstimate: 10,
  },

  // Coming Soon
  {
    id: "brand-campaigns",
    name: "Brand Campaigns",
    description: "Apply for sponsorships & brand deals",
    icon: Megaphone,
    status: "coming_soon",
    category: "creator",
    collection: "campaigns",
    recommendedWith: ["Monetization Hub"],
    creditEstimate: 15,
  },
  {
    id: "revenue-tracking",
    name: "Revenue Tracking",
    description: "Track earnings & sponsorship payments",
    icon: DollarSign,
    status: "coming_soon",
    category: "creator",
    collection: "analytics",
    creditEstimate: 5,
  },
  {
    id: "growth-tools",
    name: "Growth Tools",
    description: "AI tools to grow your audience",
    icon: TrendingUp,
    status: "coming_soon",
    category: "creator",
    collection: "ai-tools",
    creditEstimate: 20,
  },
  {
    id: "content-library",
    name: "Content Library",
    description: "Store & organize creator content",
    icon: FolderOpen,
    status: "coming_soon",
    category: "creator",
    collection: "creator-studio",
    creditEstimate: 10,
  },
  {
    id: "my-page-streaming",
    name: "My Page Streaming",
    description: "Stream directly on your creator page",
    icon: Video,
    status: "coming_soon",
    category: "media",
    collection: "creator-studio",
    creditEstimate: 40,
  },
  {
    id: "influencer-profile",
    name: "Influencer Profile",
    description: "Public influencer portfolio and media kit",
    icon: Star,
    status: "coming_soon",
    category: "identity",
    collection: "identity",
    creditEstimate: 10,
  },
  {
    id: "analytics-integrations",
    name: "Analytics & Insights",
    description: "Third-party analytics tools",
    icon: BarChart3,
    status: "coming_soon",
    category: "integrations",
    collection: "integrations",
    creditEstimate: 10,
  },
  {
    id: "calendar-integrations",
    name: "Calendar Integrations",
    description: "Sync with Google, Outlook, Apple Calendar",
    icon: CalendarClock,
    status: "coming_soon",
    category: "integrations",
    collection: "integrations",
    creditEstimate: 5,
  },
];

export default function Apps() {
  const navigate = useNavigate();
  const { activatedModuleIds, isModuleActivated } = useModuleActivation();
  const { packages } = useCustomPackages();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [isCompact, setIsCompact] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("category");
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [collapsedCollections, setCollapsedCollections] = useState<Set<string>>(new Set());
  const [showPackageBuilder, setShowPackageBuilder] = useState(false);
  const [editPackage, setEditPackage] = useState<typeof packages[0] | null>(null);
  const [previewModule, setPreviewModule] = useState<Module | null>(null);

  // Compute module status based on activation
  const getModuleStatus = (module: Module): "active" | "available" | "coming_soon" | "activated" => {
    if (module.status === "coming_soon") return "coming_soon";
    if (isModuleActivated(module.id)) return "activated";
    return "available";
  };

  const filteredModules = useMemo(() => {
    return modules.filter((module) => {
      const matchesSearch =
        !searchTerm ||
        module.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        module.description.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory =
        activeCategory === "all" || 
        activeCategory === "active" ||
        module.category === activeCategory;

      // For "active" filter, only show activated modules
      if (activeCategory === "active") {
        return matchesSearch && isModuleActivated(module.id);
      }

      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, activeCategory, isModuleActivated]);

  // Alphabetically sorted modules
  const alphabeticalModules = useMemo(() => {
    return [...filteredModules].sort((a, b) => a.name.localeCompare(b.name));
  }, [filteredModules]);

  // Group by category (sorted A-Z within each category)
  const groupedByCategory = useMemo(() => {
    const sortModules = (modules: Module[]) => 
      [...modules].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));

    if (activeCategory === "active") {
      const grouped = filteredModules.reduce((acc, module) => {
        if (!acc[module.category]) {
          acc[module.category] = [];
        }
        acc[module.category].push(module);
        return acc;
      }, {} as Record<string, Module[]>);
      // Sort within each category
      Object.keys(grouped).forEach(key => {
        grouped[key] = sortModules(grouped[key]);
      });
      return grouped;
    }
    
    if (activeCategory !== "all") {
      return { [activeCategory]: sortModules(filteredModules) };
    }

    const grouped = filteredModules.reduce((acc, module) => {
      if (!acc[module.category]) {
        acc[module.category] = [];
      }
      acc[module.category].push(module);
      return acc;
    }, {} as Record<string, Module[]>);
    // Sort within each category
    Object.keys(grouped).forEach(key => {
      grouped[key] = sortModules(grouped[key]);
    });
    return grouped;
  }, [filteredModules, activeCategory]);

  // Group by collection
  const groupedByCollection = useMemo(() => {
    return filteredModules.reduce((acc, module) => {
      const collectionId = module.collection || "other";
      if (!acc[collectionId]) {
        acc[collectionId] = [];
      }
      acc[collectionId].push(module);
      return acc;
    }, {} as Record<string, Module[]>);
  }, [filteredModules]);

  const getCategoryData = (categoryId: string) => {
    return categories.find((c) => c.id === categoryId);
  };

  const { portal } = usePortal();
  
  const handleModuleClick = (module: Module) => {
    if (module.route) {
      trackModuleOpened(module.id, portal);
      navigate(module.route);
    }
  };

  const toggleCategory = (categoryId: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const toggleCollection = (collectionId: string) => {
    setCollapsedCollections((prev) => {
      const next = new Set(prev);
      if (next.has(collectionId)) {
        next.delete(collectionId);
      } else {
        next.add(collectionId);
      }
      return next;
    });
  };

  const categoryOrder = ["creator", "media", "marketing", "business", "identity", "integrations"];
  const collectionOrder = ["creator-studio", "podcasting", "campaigns", "events", "crm-business", "identity", "ai-tools", "analytics", "integrations", "other"];

  const packageModules = modules.map(m => ({
    id: m.id,
    name: m.name,
    category: m.category,
    creditEstimate: m.creditEstimate || 10,
  }));

  const viewModeLabel = viewMode === "alphabetical" ? "A-Z" : viewMode === "collection" ? "Collection" : "Category";

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-1.5">
            Seeksy App Directory
          </h1>
          <p className="text-muted-foreground text-sm max-w-xl mb-4">
            All modules, tools, and integrations available in your workspace.
          </p>
          <Button onClick={() => setShowPackageBuilder(true)} className="gap-2">
            <Package className="h-4 w-4" />
            Build a Custom Workspace
          </Button>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent mb-6" />

        {/* Search & Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search modules..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 h-9 text-sm bg-card border-border/50"
            />
          </div>


          <div className="flex items-center gap-1 p-0.5 bg-muted/50 rounded-lg">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCompact(false)}
              className={cn(
                "h-8 px-3 gap-1.5 text-xs",
                !isCompact && "bg-background shadow-sm"
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Expanded</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCompact(true)}
              className={cn(
                "h-8 px-3 gap-1.5 text-xs",
                isCompact && "bg-background shadow-sm"
              )}
            >
              <List className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Compact</span>
            </Button>
          </div>
        </div>

        {/* Segmented Control Filter + Sort Control */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="inline-flex items-center p-1 bg-muted/50 rounded-xl border border-border/50 flex-wrap">
            {/* My Workspaces Tab */}
            <button
              onClick={() => setActiveCategory("my-workspaces")}
              className={cn(
                "px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all flex items-center gap-1.5",
                activeCategory === "my-workspaces"
                  ? "bg-background text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
              )}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>My Workspaces</span>
              {packages.length > 0 && (
                <Badge variant="secondary" className="text-xs h-5 px-1.5 ml-1">
                  {packages.length}
                </Badge>
              )}
            </button>
            
            <div className="w-px h-6 bg-border mx-1" />

            {/* Active Tab */}
            <button
              onClick={() => setActiveCategory("active")}
              className={cn(
                "px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all flex items-center gap-1.5",
                activeCategory === "active"
                  ? "bg-green-500/10 text-green-600 shadow-sm border border-green-500/20" 
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
              )}
            >
              <span>Active</span>
              {activatedModuleIds.length > 0 && (
                <Badge className="text-xs h-5 px-1.5 ml-1 bg-green-500/20 text-green-600 border-0">
                  {activatedModuleIds.length}
                </Badge>
              )}
            </button>
            
            <div className="w-px h-6 bg-border mx-1" />
            
            {categories.map((category) => {
              const isActive = activeCategory === category.id;
              return (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={cn(
                    "px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all",
                    isActive 
                      ? "bg-background text-foreground shadow-sm" 
                      : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                  )}
                >
                  <span>{category.shortName}</span>
                </button>
              );
            })}
          </div>
          
          {/* Sort Control - Right side */}
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 gap-1.5 text-xs rounded-lg border-border/50">
                  <SortAsc className="h-3.5 w-3.5" />
                  <span>Sort:</span> {viewMode === "alphabetical" ? "A–Z" : viewMode === "collection" ? "Collection" : "Category"}
                  <ChevronDown className="h-3 w-3 ml-0.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-popover z-50">
                <DropdownMenuItem 
                  onClick={() => setViewMode("category")}
                  className={cn(viewMode === "category" && "bg-accent")}
                >
                  <FolderKanban className="h-4 w-4 mr-2" />
                  Category (default)
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setViewMode("alphabetical")}
                  className={cn(viewMode === "alphabetical" && "bg-accent")}
                >
                  <ArrowDownAZ className="h-4 w-4 mr-2" />
                  A–Z (All Seekies)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {viewMode === "alphabetical" && (
              <span className="text-xs text-muted-foreground hidden sm:inline">Showing all Seekies A–Z</span>
            )}
          </div>
        </div>

        {/* My Workspaces Section */}
        {activeCategory === "my-workspaces" && (
          <MyWorkspacesSection 
            onCreateNew={() => {
              setEditPackage(null);
              setShowPackageBuilder(true);
            }} 
            onEdit={(packageId) => {
              const pkg = packages.find(p => p.id === packageId);
              if (pkg) {
                setEditPackage(pkg);
                setShowPackageBuilder(true);
              }
            }}
          />
        )}

        {/* Alphabetical View */}
        {activeCategory !== "my-workspaces" && viewMode === "alphabetical" && (
          <div className="rounded-2xl border p-5 sm:p-6 bg-card">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                <ArrowDownAZ className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">All Modules (A-Z)</h2>
                <p className="text-xs text-muted-foreground">{alphabeticalModules.length} modules</p>
              </div>
            </div>
            <div className={cn(
              "grid gap-3",
              "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            )}>
              {alphabeticalModules.map((module) => (
                <ModuleCard
                  key={module.id}
                  {...module}
                  status={getModuleStatus(module)}
                  compact={isCompact}
                  onClick={() => handleModuleClick(module)}
                  onPreview={() => setPreviewModule(module)}
                  tooltipData={{
                    description: module.description,
                    bestFor: "All creators",
                    unlocks: [],
                    creditEstimate: module.creditEstimate || 10,
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Collection View */}
        {activeCategory !== "my-workspaces" && viewMode === "collection" && (
          <div className="space-y-8">
            {collectionOrder.map((collectionId) => {
              const collectionModules = groupedByCollection[collectionId];
              if (!collectionModules || collectionModules.length === 0) return null;

              const collection = collections[collectionId] || { 
                name: collectionId === "other" ? "Other" : collectionId, 
                icon: FolderOpen, 
                description: "" 
              };
              const CollectionIcon = collection.icon;
              const isCollapsed = collapsedCollections.has(collectionId);

              return (
                <Collapsible
                  key={collectionId}
                  open={!isCollapsed}
                  onOpenChange={() => toggleCollection(collectionId)}
                >
                  <section className="rounded-2xl border p-5 sm:p-6 bg-card shadow-sm">
                    <CollapsibleTrigger asChild>
                      <button className="w-full flex items-center justify-between gap-3 group cursor-pointer">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                            <CollectionIcon className="h-5 w-5 text-foreground" />
                          </div>
                          <div className="text-left min-w-0">
                            <h2 className="text-lg font-semibold">{collection.name}</h2>
                            <p className="text-xs text-muted-foreground hidden sm:block mt-0.5">
                              {collection.description} • {collectionModules.length} modules
                            </p>
                          </div>
                        </div>
                        <ChevronDown 
                          className={cn(
                            "h-5 w-5 text-muted-foreground transition-transform shrink-0",
                            isCollapsed && "-rotate-90"
                          )} 
                        />
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className={cn(
                        "mt-5 grid gap-3",
                        "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                      )}>
                        {collectionModules.map((module) => (
                          <ModuleCard
                            key={module.id}
                            {...module}
                            status={getModuleStatus(module)}
                            compact={isCompact}
                            onClick={() => handleModuleClick(module)}
                            onPreview={() => setPreviewModule(module)}
                            tooltipData={{
                              description: module.description,
                              bestFor: "All creators",
                              unlocks: [],
                              creditEstimate: module.creditEstimate || 10,
                            }}
                          />
                        ))}
                      </div>
                    </CollapsibleContent>
                  </section>
                </Collapsible>
              );
            })}
          </div>
        )}

        {/* Category View (default) */}
        {activeCategory !== "my-workspaces" && viewMode === "category" && (
        <div className="space-y-8">
          {categoryOrder.map((categoryId) => {
            const categoryModules = groupedByCategory[categoryId];
            if (!categoryModules || categoryModules.length === 0) return null;

            const category = getCategoryData(categoryId);
            if (!category) return null;
            
            const CategoryIcon = category.icon;
            const isCollapsed = collapsedCategories.has(categoryId);

            return (
              <Collapsible
                key={categoryId}
                open={!isCollapsed}
                onOpenChange={() => toggleCategory(categoryId)}
              >
                <section 
                  className={cn(
                    "rounded-2xl border p-5 sm:p-6 transition-all shadow-sm",
                    category.bgClass,
                    "bg-opacity-80 dark:bg-opacity-50"
                  )}
                  style={{
                    backgroundColor: categoryId === 'creator' ? 'hsl(40 30% 96%)' :
                                     categoryId === 'media' ? 'hsl(270 30% 96%)' :
                                     categoryId === 'marketing' ? 'hsl(200 30% 96%)' :
                                     categoryId === 'business' ? 'hsl(150 30% 96%)' :
                                     categoryId === 'identity' ? 'hsl(350 30% 96%)' :
                                     categoryId === 'integrations' ? 'hsl(190 30% 96%)' : undefined
                  }}
                >
                  <CollapsibleTrigger asChild>
                    <button className="w-full flex items-center justify-between gap-3 group cursor-pointer sticky top-0 bg-inherit z-10 -mt-1 pt-1">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={cn(
                          "w-10 h-10 rounded-xl bg-background flex items-center justify-center shadow-sm border border-border/30"
                        )}>
                          <CategoryIcon className={cn("h-5 w-5", category.accentColor)} />
                        </div>
                        <div className="text-left min-w-0">
                          <CategoryTooltip categoryId={categoryId} fallbackData={category.tooltipData}>
                            <h2 className="text-lg font-semibold">{category.name}</h2>
                          </CategoryTooltip>
                          <p className="text-xs text-muted-foreground hidden sm:block mt-0.5">
                            {category.description}
                          </p>
                        </div>
                      </div>
                      <ChevronDown 
                        className={cn(
                          "h-5 w-5 text-muted-foreground transition-transform shrink-0",
                          isCollapsed && "-rotate-90"
                        )} 
                      />
                    </button>
                  </CollapsibleTrigger>

                  <CollapsibleContent className="data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
                    <div 
                      className={cn(
                        "mt-5 grid gap-3",
                        "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                      )}
                    >
                      {categoryModules.map((module) => (
                        <ModuleCard
                          key={module.id}
                          {...module}
                          status={getModuleStatus(module)}
                          compact={isCompact}
                          onClick={() => handleModuleClick(module)}
                          onPreview={() => setPreviewModule(module)}
                          tooltipData={{
                            description: module.description,
                            bestFor: category.tooltipData?.bestForUsers || "All creators",
                            unlocks: [],
                            creditEstimate: module.creditEstimate || 10,
                          }}
                        />
                      ))}
                    </div>
                  </CollapsibleContent>
                </section>
              </Collapsible>
            );
          })}
        </div>
        )}

        {/* Empty State */}
        {activeCategory !== "my-workspaces" && filteredModules.length === 0 && (
          <div className="text-center py-16">
            <Search className="h-10 w-10 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-base font-medium mb-1.5">No modules found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Try adjusting your search or filter criteria
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchTerm("");
                setActiveCategory("all");
              }}
            >
              Clear filters
            </Button>
          </div>
        )}
      </div>

      {/* Custom Package Builder Modal */}
      <CustomPackageBuilder
        open={showPackageBuilder}
        onOpenChange={(open) => {
          setShowPackageBuilder(open);
          if (!open) setEditPackage(null);
        }}
        modules={packageModules}
        editPackage={editPackage}
      />

      {/* Module Preview Modal */}
      <ModulePreviewModal
        open={!!previewModule}
        onOpenChange={(open) => !open && setPreviewModule(null)}
        module={previewModule}
      />
    </div>
  );
}