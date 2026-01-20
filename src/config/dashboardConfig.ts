// Dashboard configuration by user type
import { 
  Instagram, Users, TrendingUp, DollarSign, Download, MapPin, 
  Clock, Mail, Calendar, BarChart3, Globe, FileText, Mic, 
  Video, Scissors, Zap, UserCheck, Briefcase, ListChecks
} from "lucide-react";

export type UserType = "creator" | "podcaster" | "business" | "event_host" | "agency";

export interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  route: string;
  checkKey: string; // key to check in user_preferences or related table
}

export interface KPIConfig {
  id: string;
  label: string;
  icon: string;
  format: "number" | "percent" | "currency";
  dataKey: string;
}

export interface WidgetConfig {
  id: string;
  title: string;
  description: string;
  size: "small" | "medium" | "large";
  moduleId?: string; // Link to activated module
}

export interface DashboardConfig {
  title: string;
  subtitle: string;
  checklist: ChecklistItem[];
  kpis: KPIConfig[];
  widgets: WidgetConfig[];
}

// Creator / Influencer Dashboard
const creatorDashboard: DashboardConfig = {
  title: "Creator Dashboard",
  subtitle: "Track your growth and engagement",
  checklist: [
    { id: "connect-social", label: "Connect social accounts", description: "Link Instagram, YouTube, TikTok", route: "/settings/integrations", checkKey: "social_connected" },
    { id: "sync-data", label: "Sync first data", description: "Pull your analytics", route: "/social-analytics", checkKey: "data_synced" },
    { id: "setup-mypage", label: "Set up My Page", description: "Create your public profile", route: "/my-page", checkKey: "my_page_enabled" },
    { id: "upload-media", label: "Upload first media", description: "Add content to your library", route: "/media", checkKey: "media_uploaded" },
    { id: "enable-autosync", label: "Enable auto-sync", description: "Keep data up to date", route: "/settings/integrations", checkKey: "auto_sync_enabled" },
  ],
  kpis: [
    { id: "followers", label: "Followers", icon: "Users", format: "number", dataKey: "totalFollowers" },
    { id: "engagement", label: "Engagement Rate", icon: "TrendingUp", format: "percent", dataKey: "engagementRate" },
    { id: "reach", label: "Total Reach (30d)", icon: "Globe", format: "number", dataKey: "totalReach" },
    { id: "value", label: "Est. Value", icon: "DollarSign", format: "currency", dataKey: "estimatedValue" },
  ],
  widgets: [
    { id: "social-analytics", title: "Social Analytics Overview", description: "Performance across platforms", size: "large" },
    { id: "brand-deals", title: "Brand Deal Opportunities", description: "Available sponsorships", size: "medium" },
    { id: "media-upload", title: "Media Library", description: "Quick upload new content", size: "small" },
    { id: "studio-record", title: "Studio", description: "Record new clip", size: "small" },
    { id: "audience-insights", title: "Audience Insights", description: "Demographics & geography", size: "medium" },
    { id: "revenue-tracking", title: "Revenue Tracking", description: "Earnings overview", size: "medium", moduleId: "monetization-hub" },
  ],
};

// Podcaster Dashboard
const podcasterDashboard: DashboardConfig = {
  title: "Podcaster Dashboard",
  subtitle: "Grow your podcast audience",
  checklist: [
    { id: "connect-podcast", label: "Connect podcast host", description: "Link Spotify, Apple Podcasts", route: "/podcasts", checkKey: "podcast_connected" },
    { id: "add-episode", label: "Add first episode", description: "Upload or record", route: "/podcasts", checkKey: "episode_added" },
    { id: "sync-analytics", label: "Sync analytics", description: "Import download stats", route: "/podcasts", checkKey: "podcast_analytics_synced" },
    { id: "setup-studio", label: "Set up recording studio", description: "Configure your studio", route: "/studio", checkKey: "studio_setup" },
    { id: "build-page", label: "Build your podcast page", description: "Public landing page", route: "/my-page", checkKey: "my_page_enabled" },
  ],
  kpis: [
    { id: "downloads", label: "Total Downloads", icon: "Download", format: "number", dataKey: "totalDownloads" },
    { id: "avg-downloads", label: "Avg per Episode", icon: "BarChart3", format: "number", dataKey: "avgDownloads" },
    { id: "geography", label: "Top Location", icon: "MapPin", format: "number", dataKey: "topLocation" },
    { id: "retention", label: "Listener Retention", icon: "Clock", format: "percent", dataKey: "retention" },
  ],
  widgets: [
    { id: "episode-library", title: "Episode Library", description: "Manage your episodes", size: "large" },
    { id: "quick-record", title: "Quick Record", description: "Start recording now", size: "small" },
    { id: "clip-generator", title: "Clip Generator", description: "Create shareable clips", size: "medium" },
    { id: "sponsorships", title: "Sponsorship Opportunities", description: "Available deals", size: "medium" },
    { id: "campaign-performance", title: "Campaign Performance", description: "Email/SMS stats", size: "medium" },
  ],
};

// Brand / Business Dashboard
const businessDashboard: DashboardConfig = {
  title: "Business Dashboard",
  subtitle: "Manage your marketing & audience",
  checklist: [
    { id: "import-contacts", label: "Import audience contacts", description: "Upload your contact list", route: "/contacts", checkKey: "contacts_imported" },
    { id: "create-segment", label: "Create first segment", description: "Organize your audience", route: "/segments", checkKey: "segment_created" },
    { id: "publish-campaign", label: "Publish first campaign", description: "Send your first message", route: "/campaigns", checkKey: "campaign_published" },
    { id: "add-event", label: "Add event or meeting type", description: "Set up scheduling", route: "/events", checkKey: "event_created" },
    { id: "connect-social-biz", label: "Connect social accounts", description: "Link your business pages", route: "/settings/integrations", checkKey: "social_connected" },
  ],
  kpis: [
    { id: "contacts", label: "Contact List Size", icon: "Users", format: "number", dataKey: "totalContacts" },
    { id: "campaign-engagement", label: "Campaign Engagement", icon: "TrendingUp", format: "percent", dataKey: "campaignEngagement" },
    { id: "traffic", label: "Website Traffic", icon: "Globe", format: "number", dataKey: "websiteTraffic" },
    { id: "conversions", label: "Lead Conversions", icon: "UserCheck", format: "number", dataKey: "leadConversions" },
  ],
  widgets: [
    { id: "crm-overview", title: "CRM Overview", description: "Contact management", size: "large" },
    { id: "segments", title: "Segments Performance", description: "Audience breakdown", size: "medium" },
    { id: "campaign-schedule", title: "Campaign Schedule", description: "Upcoming sends", size: "medium" },
    { id: "events-appointments", title: "Events & Appointments", description: "Scheduled meetings", size: "medium" },
    { id: "form-submissions", title: "Form Submissions", description: "Recent responses", size: "small" },
    { id: "automations", title: "Automations Activity", description: "Active workflows", size: "small" },
  ],
};

// Event Host Dashboard
const eventHostDashboard: DashboardConfig = {
  title: "Event Host Dashboard",
  subtitle: "Manage your events & attendees",
  checklist: [
    { id: "setup-template", label: "Set up event template", description: "Create reusable events", route: "/events", checkKey: "event_template_created" },
    { id: "sync-calendar", label: "Sync calendar", description: "Connect your calendar", route: "/settings/integrations", checkKey: "calendar_synced" },
    { id: "create-rsvp", label: "Create RSVP form", description: "Collect registrations", route: "/forms", checkKey: "rsvp_form_created" },
    { id: "connect-email-sms", label: "Connect email/SMS", description: "Set up notifications", route: "/settings/integrations", checkKey: "email_sms_connected" },
  ],
  kpis: [
    { id: "registrations", label: "Total Registrations", icon: "Users", format: "number", dataKey: "totalRegistrations" },
    { id: "attendance", label: "Attendance Rate", icon: "UserCheck", format: "percent", dataKey: "attendanceRate" },
    { id: "conversions-events", label: "Marketing Conversions", icon: "TrendingUp", format: "number", dataKey: "marketingConversions" },
  ],
  widgets: [
    { id: "upcoming-events", title: "Upcoming Events", description: "Your event calendar", size: "large" },
    { id: "ticket-sales", title: "Ticket Sales / RSVPs", description: "Registration overview", size: "medium" },
    { id: "promo-performance", title: "Promo Performance", description: "Email/SMS campaign stats", size: "medium" },
  ],
};

// Agency / Manager Dashboard
const agencyDashboard: DashboardConfig = {
  title: "Agency Dashboard",
  subtitle: "Manage your creator roster",
  checklist: [
    { id: "add-creators", label: "Add creators to workspace", description: "Invite your talent", route: "/team", checkKey: "creators_added" },
    { id: "connect-creator-social", label: "Connect their social accounts", description: "Link creator profiles", route: "/settings/integrations", checkKey: "creator_social_connected" },
    { id: "build-proposal", label: "Build first proposal", description: "Create a pitch deck", route: "/proposals", checkKey: "proposal_created" },
    { id: "create-workflow", label: "Create a team workflow", description: "Set up collaboration", route: "/team", checkKey: "workflow_created" },
  ],
  kpis: [
    { id: "creator-performance", label: "Creator Performance", icon: "TrendingUp", format: "number", dataKey: "creatorPerformance" },
    { id: "total-reach-agency", label: "Total Reach", icon: "Globe", format: "number", dataKey: "totalReachAgency" },
    { id: "active-deals", label: "Active Deals", icon: "Briefcase", format: "number", dataKey: "activeDeals" },
  ],
  widgets: [
    { id: "creator-profiles", title: "Creator Profiles", description: "Your talent roster", size: "large" },
    { id: "proposal-pipeline", title: "Proposal Pipeline", description: "Active opportunities", size: "medium" },
    { id: "team-tasks", title: "Team Tasks", description: "Pending work items", size: "medium" },
    { id: "collab-notes", title: "Collaboration Notes", description: "Recent updates", size: "small" },
  ],
};

export const DASHBOARD_CONFIGS: Record<UserType, DashboardConfig> = {
  creator: creatorDashboard,
  podcaster: podcasterDashboard,
  business: businessDashboard,
  event_host: eventHostDashboard,
  agency: agencyDashboard,
};

export function getDashboardConfig(userType: UserType): DashboardConfig {
  return DASHBOARD_CONFIGS[userType] || creatorDashboard;
}
