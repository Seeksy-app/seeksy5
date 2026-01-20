import { 
  Mic, Video, Users, Calendar, Briefcase, Building2, Store,
  BarChart3, Film, Mail, MessageSquare, DollarSign, Star, 
  Globe, Headphones, Camera, Radio, UserCheck, Shield
} from "lucide-react";

export type PersonaType = 
  | "podcaster" 
  | "influencer" 
  | "speaker" 
  | "eventHost" 
  | "entrepreneur" 
  | "agency" 
  | "brand"
  | "communityLeader";

export interface WidgetConfig {
  id: string;
  name: string;
  description: string;
  icon: any;
  category: "content" | "analytics" | "monetization" | "engagement" | "identity";
}

export interface ChecklistItem {
  id: string;
  label: string;
  description?: string;
  route?: string;
  completed?: boolean;
}

export interface KPIConfig {
  id: string;
  label: string;
  value: string | number;
  change?: string;
  trend?: "up" | "down" | "neutral";
}

export interface NavHighlight {
  id: string;
  label: string;
  route: string;
  icon: any;
}

export interface PersonaConfig {
  id: PersonaType;
  label: string;
  description: string;
  icon: any;
  gradient: string;
  defaultWidgets: string[];
  allWidgets: string[];
  checklist: ChecklistItem[];
  kpis: KPIConfig[];
  navHighlights: NavHighlight[];
}

// All available widgets
export const ALL_WIDGETS: WidgetConfig[] = [
  // Content widgets
  { id: "studio-quick-launch", name: "Studio Quick Launch", description: "Start recording instantly", icon: Mic, category: "content" },
  { id: "certified-clips", name: "Certified Clips", description: "AI-generated clips", icon: Film, category: "content" },
  { id: "media-vault", name: "Media Vault", description: "Recent recordings", icon: Video, category: "content" },
  { id: "content-calendar", name: "Content Calendar", description: "Schedule your content", icon: Calendar, category: "content" },
  { id: "media-library", name: "Media Library", description: "All your content", icon: Film, category: "content" },
  
  // Analytics widgets
  { id: "podcast-analytics", name: "Podcast Analytics", description: "Listeners & growth", icon: BarChart3, category: "analytics" },
  { id: "social-analytics", name: "Social Analytics", description: "IG, TikTok, YouTube stats", icon: BarChart3, category: "analytics" },
  { id: "growth-insights", name: "Growth Insights", description: "Followers & engagement", icon: BarChart3, category: "analytics" },
  { id: "audience-demographics", name: "Audience Demographics", description: "Know your audience", icon: Users, category: "analytics" },
  { id: "media-performance", name: "Media Performance", description: "Content metrics", icon: BarChart3, category: "analytics" },
  
  // Monetization widgets
  { id: "revenue-tracking", name: "Revenue Tracking", description: "Earnings overview", icon: DollarSign, category: "monetization" },
  { id: "brand-campaigns", name: "Brand Campaigns", description: "Active partnerships", icon: Star, category: "monetization" },
  { id: "media-kit", name: "Media Kit & Valuation", description: "Your creator value", icon: Briefcase, category: "monetization" },
  { id: "sponsorship-opportunities", name: "Sponsorships", description: "Available deals", icon: DollarSign, category: "monetization" },
  
  // Engagement widgets
  { id: "email-performance", name: "Email Performance", description: "Campaign metrics", icon: Mail, category: "engagement" },
  { id: "meetings-booking", name: "Meetings & Booking", description: "Upcoming sessions", icon: Calendar, category: "engagement" },
  { id: "my-page-streaming", name: "My Page Streaming", description: "Live & replays", icon: Radio, category: "engagement" },
  { id: "events-overview", name: "Events Overview", description: "Your events", icon: Calendar, category: "engagement" },
  { id: "rsvps-attendees", name: "RSVPs & Attendees", description: "Event registrations", icon: Users, category: "engagement" },
  { id: "testimonials", name: "Testimonials", description: "Reviews & feedback", icon: Star, category: "engagement" },
  { id: "crm-dashboard", name: "CRM Dashboard", description: "Contact management", icon: Users, category: "engagement" },
  { id: "sms-analytics", name: "SMS Analytics", description: "Text campaigns", icon: MessageSquare, category: "engagement" },
  { id: "team-collaboration", name: "Team Collaboration", description: "Team activity", icon: Users, category: "engagement" },
  { id: "automations", name: "Automations", description: "Workflows & triggers", icon: Globe, category: "engagement" },
  
  // Identity widgets
  { id: "identity-status", name: "Identity Status", description: "Voice & face verification", icon: Shield, category: "identity" },
  { id: "creator-roster", name: "Creator Roster", description: "Managed creators", icon: Users, category: "identity" },
  { id: "usage-rights", name: "Usage Rights", description: "Media permissions", icon: Shield, category: "identity" },
  { id: "creator-discovery", name: "Creator Discovery", description: "Find creators", icon: UserCheck, category: "identity" },
  { id: "booking-requests", name: "Booking Requests", description: "Pending requests", icon: Calendar, category: "identity" },
];

export const PERSONA_CONFIGS: Record<PersonaType, PersonaConfig> = {
  podcaster: {
    id: "podcaster",
    label: "Podcaster",
    description: "Record, distribute, and monetize your podcast",
    icon: Mic,
    gradient: "from-teal-500 to-cyan-500",
    defaultWidgets: ["studio-quick-launch", "certified-clips", "media-vault", "podcast-analytics", "meetings-booking"],
    allWidgets: ["studio-quick-launch", "certified-clips", "media-vault", "podcast-analytics", "my-page-streaming", "social-analytics", "email-performance", "meetings-booking", "media-kit", "sponsorship-opportunities"],
    checklist: [
      { id: "verify-identity", label: "Verify Face & Voice", description: "Protect your content", route: "/identity" },
      { id: "record-episode", label: "Record First Episode", description: "Use the Studio", route: "/studio" },
      { id: "create-clips", label: "Create 3 Clips", description: "AI-powered clips", route: "/clips" },
      { id: "publish-media-kit", label: "Publish Media Kit", description: "Attract sponsors", route: "/media-kit" },
      { id: "connect-socials", label: "Connect Social Accounts", description: "Sync analytics", route: "/social-analytics" },
    ],
    kpis: [
      { id: "total-listens", label: "Total Listens", value: "0", trend: "neutral" },
      { id: "avg-episode", label: "Avg per Episode", value: "0", trend: "neutral" },
      { id: "subscribers", label: "Subscribers", value: "0", trend: "neutral" },
      { id: "growth", label: "Growth", value: "0%", trend: "neutral" },
    ],
    navHighlights: [
      { id: "studio", label: "Studio", route: "/studio", icon: Mic },
      { id: "podcasts", label: "Podcasts", route: "/podcasts", icon: Headphones },
      { id: "clips", label: "Clips", route: "/clips", icon: Film },
      { id: "media-library", label: "Media Library", route: "/media-library", icon: Video },
      { id: "contacts", label: "Contacts", route: "/contacts", icon: Users },
      { id: "analytics", label: "Analytics", route: "/social-analytics", icon: BarChart3 },
    ],
  },
  influencer: {
    id: "influencer",
    label: "Content Creator",
    description: "Create content and grow your audience across platforms",
    icon: Camera,
    gradient: "from-pink-500 to-rose-500",
    defaultWidgets: ["social-analytics", "growth-insights", "media-library", "brand-campaigns", "media-kit"],
    allWidgets: ["social-analytics", "growth-insights", "media-library", "brand-campaigns", "revenue-tracking", "content-calendar", "media-kit", "audience-demographics"],
    checklist: [
      { id: "connect-socials", label: "Connect Socials", description: "Sync your accounts", route: "/social-analytics" },
      { id: "upload-content", label: "Upload First Content", description: "Add to library", route: "/media-library" },
      { id: "build-media-kit", label: "Build Media Kit", description: "Showcase your value", route: "/media-kit" },
      { id: "enable-monetization", label: "Enable Monetization", description: "Start earning", route: "/revenue" },
    ],
    kpis: [
      { id: "followers", label: "Followers", value: "0", trend: "neutral" },
      { id: "engagement", label: "Engagement Rate", value: "0%", trend: "neutral" },
      { id: "reach", label: "Reach", value: "0", trend: "neutral" },
      { id: "creator-value", label: "Creator Value", value: "$0", trend: "neutral" },
    ],
    navHighlights: [
      { id: "creator-hub", label: "Creator Hub", route: "/dashboard", icon: Star },
      { id: "social-analytics", label: "Social Analytics", route: "/social-analytics", icon: BarChart3 },
      { id: "media-library", label: "Media Library", route: "/media-library", icon: Film },
      { id: "brand-campaigns", label: "Brand Campaigns", route: "/campaigns", icon: Star },
      { id: "monetization", label: "Monetization Hub", route: "/revenue", icon: DollarSign },
    ],
  },
  speaker: {
    id: "speaker",
    label: "Speaker / Coach",
    description: "Book sessions and grow your speaking business",
    icon: Mic,
    gradient: "from-violet-500 to-purple-500",
    defaultWidgets: ["meetings-booking", "events-overview", "media-kit", "testimonials", "email-performance"],
    allWidgets: ["meetings-booking", "events-overview", "certified-clips", "media-kit", "testimonials", "email-performance", "content-calendar"],
    checklist: [
      { id: "setup-booking", label: "Setup Booking Page", description: "Accept appointments", route: "/meeting-types" },
      { id: "create-event", label: "Create First Event", description: "Host a session", route: "/events" },
      { id: "build-media-kit", label: "Build Media Kit", description: "Professional profile", route: "/media-kit" },
      { id: "collect-testimonials", label: "Collect Testimonials", description: "Build credibility", route: "/testimonials" },
    ],
    kpis: [
      { id: "bookings", label: "Bookings", value: "0", trend: "neutral" },
      { id: "sessions", label: "Sessions This Month", value: "0", trend: "neutral" },
      { id: "revenue", label: "Revenue", value: "$0", trend: "neutral" },
      { id: "rating", label: "Rating", value: "0.0", trend: "neutral" },
    ],
    navHighlights: [
      { id: "meetings", label: "Meetings", route: "/meetings", icon: Calendar },
      { id: "events", label: "Events", route: "/events", icon: Calendar },
      { id: "contacts", label: "Contacts", route: "/contacts", icon: Users },
      { id: "media-kit", label: "Media Kit", route: "/media-kit", icon: Briefcase },
    ],
  },
  eventHost: {
    id: "eventHost",
    label: "Event Host",
    description: "Plan, promote, and host unforgettable events",
    icon: Calendar,
    gradient: "from-orange-500 to-amber-500",
    defaultWidgets: ["events-overview", "rsvps-attendees", "my-page-streaming", "email-performance", "team-collaboration"],
    allWidgets: ["events-overview", "rsvps-attendees", "my-page-streaming", "certified-clips", "email-performance", "sms-analytics", "meetings-booking", "team-collaboration"],
    checklist: [
      { id: "setup-event", label: "Setup Event Template", description: "Create your first event", route: "/events" },
      { id: "sync-calendar", label: "Sync Calendar", description: "Connect your calendar", route: "/integrations" },
      { id: "create-rsvp", label: "Create RSVP Form", description: "Collect registrations", route: "/forms" },
      { id: "connect-comms", label: "Connect Email/SMS", description: "Notify attendees", route: "/email-settings" },
    ],
    kpis: [
      { id: "registrations", label: "Registrations", value: "0", trend: "neutral" },
      { id: "attendance", label: "Attendance Rate", value: "0%", trend: "neutral" },
      { id: "upcoming", label: "Upcoming Events", value: "0", trend: "neutral" },
      { id: "revenue", label: "Ticket Revenue", value: "$0", trend: "neutral" },
    ],
    navHighlights: [
      { id: "events", label: "Events", route: "/events", icon: Calendar },
      { id: "meetings", label: "Meetings", route: "/meetings", icon: Calendar },
      { id: "contacts", label: "Contacts", route: "/contacts", icon: Users },
      { id: "media", label: "Media", route: "/media-library", icon: Film },
    ],
  },
  entrepreneur: {
    id: "entrepreneur",
    label: "Entrepreneur / Business",
    description: "Manage contacts, marketing, and grow your business",
    icon: Briefcase,
    gradient: "from-blue-500 to-indigo-500",
    defaultWidgets: ["meetings-booking", "crm-dashboard", "email-performance", "media-library", "automations"],
    allWidgets: ["meetings-booking", "crm-dashboard", "email-performance", "sms-analytics", "media-library", "social-analytics", "team-collaboration", "automations"],
    checklist: [
      { id: "import-contacts", label: "Import Contacts", description: "Add your network", route: "/contacts" },
      { id: "create-segment", label: "Create Segment", description: "Organize contacts", route: "/contacts" },
      { id: "send-campaign", label: "Publish Campaign", description: "Reach your audience", route: "/email" },
      { id: "setup-booking", label: "Setup Booking", description: "Accept meetings", route: "/meeting-types" },
    ],
    kpis: [
      { id: "contacts", label: "Contacts", value: "0", trend: "neutral" },
      { id: "open-rate", label: "Email Open Rate", value: "0%", trend: "neutral" },
      { id: "meetings", label: "Meetings Booked", value: "0", trend: "neutral" },
      { id: "conversions", label: "Conversions", value: "0", trend: "neutral" },
    ],
    navHighlights: [
      { id: "contacts", label: "Contacts", route: "/contacts", icon: Users },
      { id: "email", label: "Email", route: "/email", icon: Mail },
      { id: "sms", label: "SMS", route: "/sms", icon: MessageSquare },
      { id: "meetings", label: "Meetings", route: "/meetings", icon: Calendar },
      { id: "media", label: "Media", route: "/media-library", icon: Film },
    ],
  },
  agency: {
    id: "agency",
    label: "Agency",
    description: "Manage creators and run campaigns at scale",
    icon: Users,
    gradient: "from-emerald-500 to-green-500",
    defaultWidgets: ["creator-roster", "brand-campaigns", "team-collaboration", "usage-rights", "media-performance"],
    allWidgets: ["creator-roster", "brand-campaigns", "team-collaboration", "usage-rights", "media-performance", "media-vault"],
    checklist: [
      { id: "add-creators", label: "Add Creators", description: "Build your roster", route: "/agency/creators" },
      { id: "connect-socials", label: "Connect Socials", description: "Sync creator accounts", route: "/social-analytics" },
      { id: "build-proposal", label: "Build Proposal", description: "Create a pitch", route: "/proposals" },
      { id: "setup-workflow", label: "Create Workflow", description: "Automate tasks", route: "/automations" },
    ],
    kpis: [
      { id: "creators", label: "Creators Managed", value: "0", trend: "neutral" },
      { id: "reach", label: "Total Reach", value: "0", trend: "neutral" },
      { id: "active-deals", label: "Active Deals", value: "0", trend: "neutral" },
      { id: "revenue", label: "Campaign Revenue", value: "$0", trend: "neutral" },
    ],
    navHighlights: [
      { id: "creators", label: "Creators", route: "/agency/creators", icon: Users },
      { id: "campaigns", label: "Campaigns", route: "/campaigns", icon: Star },
      { id: "media-library", label: "Media Library", route: "/media-library", icon: Film },
      { id: "analytics", label: "Analytics", route: "/social-analytics", icon: BarChart3 },
    ],
  },
  brand: {
    id: "brand",
    label: "Brand / Venue",
    description: "Discover creators and run sponsorship campaigns",
    icon: Building2,
    gradient: "from-slate-500 to-gray-600",
    defaultWidgets: ["creator-discovery", "booking-requests", "brand-campaigns", "usage-rights", "events-overview"],
    allWidgets: ["creator-discovery", "booking-requests", "brand-campaigns", "usage-rights", "events-overview", "media-performance"],
    checklist: [
      { id: "discover-creators", label: "Discover Creators", description: "Find talent", route: "/agency-discovery" },
      { id: "send-request", label: "Send Booking Request", description: "Reach out", route: "/agency-discovery" },
      { id: "create-campaign", label: "Create Campaign", description: "Launch a sponsorship", route: "/advertiser/campaigns" },
      { id: "manage-rights", label: "Manage Media Rights", description: "Track permissions", route: "/identity" },
    ],
    kpis: [
      { id: "creators", label: "Creators Engaged", value: "0", trend: "neutral" },
      { id: "campaigns", label: "Active Campaigns", value: "0", trend: "neutral" },
      { id: "impressions", label: "Impressions", value: "0", trend: "neutral" },
      { id: "spend", label: "Total Spend", value: "$0", trend: "neutral" },
    ],
    navHighlights: [
      { id: "creators", label: "Creators", route: "/agency-discovery", icon: Users },
      { id: "campaigns", label: "Campaigns", route: "/advertiser/campaigns", icon: Star },
      { id: "events", label: "Events", route: "/events", icon: Calendar },
      { id: "media", label: "Media", route: "/media-library", icon: Film },
    ],
  },
  communityLeader: {
    id: "communityLeader",
    label: "Influencer",
    description: "Grow your audience and monetize your influence",
    icon: Star,
    gradient: "from-amber-500 to-yellow-500",
    defaultWidgets: ["social-analytics", "growth-insights", "brand-campaigns", "media-kit", "revenue-tracking"],
    allWidgets: ["social-analytics", "growth-insights", "brand-campaigns", "media-kit", "revenue-tracking", "content-calendar", "audience-demographics", "media-library"],
    checklist: [
      { id: "connect-socials", label: "Connect Social Accounts", description: "Sync Instagram, TikTok, YouTube", route: "/social-analytics" },
      { id: "build-media-kit", label: "Build Your Media Kit", description: "Showcase your value", route: "/media-kit" },
      { id: "verify-identity", label: "Verify Your Identity", description: "Unlock premium features", route: "/identity" },
      { id: "enable-monetization", label: "Enable Monetization", description: "Start earning from brands", route: "/revenue" },
    ],
    kpis: [
      { id: "followers", label: "Total Followers", value: "0", trend: "neutral" },
      { id: "engagement", label: "Engagement Rate", value: "0%", trend: "neutral" },
      { id: "reach", label: "Monthly Reach", value: "0", trend: "neutral" },
      { id: "earnings", label: "Earnings", value: "$0", trend: "neutral" },
    ],
    navHighlights: [
      { id: "social-analytics", label: "Social Analytics", route: "/social-analytics", icon: BarChart3 },
      { id: "media-kit", label: "Media Kit", route: "/media-kit", icon: Briefcase },
      { id: "brand-campaigns", label: "Brand Campaigns", route: "/campaigns", icon: Star },
      { id: "revenue", label: "Revenue", route: "/revenue", icon: DollarSign },
    ],
  },
};

export const PERSONA_OPTIONS = Object.values(PERSONA_CONFIGS).map((config) => ({
  id: config.id,
  label: config.label,
  description: config.description,
  icon: config.icon,
  gradient: config.gradient,
}));

export function getWidgetById(id: string): WidgetConfig | undefined {
  return ALL_WIDGETS.find((w) => w.id === id);
}

export function getPersonaConfig(personaType: PersonaType): PersonaConfig {
  return PERSONA_CONFIGS[personaType] || PERSONA_CONFIGS.podcaster;
}
