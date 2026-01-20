import {
  Mic, Podcast, Megaphone, Calendar, Users, Building2, Shield, BrainCircuit,
  type LucideIcon
} from "lucide-react";

export interface SeeksyCollection {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  color: string;
  bgGradient: string;
  includedApps: string[]; // Array of module IDs that are in this collection
  isPopular?: boolean;
  usersCount?: number;
}

export const SEEKSY_COLLECTIONS: SeeksyCollection[] = [
  {
    id: "creator-studio",
    name: "Creator Studio",
    description: "Everything you need to record, edit, and publish professional content",
    icon: Mic,
    color: "#F43F5E",
    bgGradient: "bg-gradient-to-br from-rose-100 via-pink-50 to-red-100",
    includedApps: ["studio", "ai-clips", "ai-post-production", "media-library", "video-editor", "cloning"],
    isPopular: true,
    usersCount: 12400,
  },
  {
    id: "podcasting",
    name: "Podcasting Suite",
    description: "Host, distribute, and grow your podcast with analytics and RSS feeds",
    icon: Podcast,
    color: "#10B981",
    bgGradient: "bg-gradient-to-br from-emerald-100 via-green-50 to-teal-100",
    includedApps: ["podcasts", "studio", "ai-post-production", "ai-clips"],
    isPopular: true,
    usersCount: 8700,
  },
  {
    id: "marketing-hub",
    name: "Marketing Hub",
    description: "Email, SMS, newsletters, and campaign automation in one place",
    icon: Megaphone,
    color: "#F59E0B",
    bgGradient: "bg-gradient-to-br from-orange-100 via-amber-50 to-yellow-100",
    includedApps: ["campaigns", "email", "newsletter", "sms", "automations", "blog"],
    usersCount: 6200,
  },
  {
    id: "events-meetings",
    name: "Events & Meetings",
    description: "Schedule meetings, host events, sell tickets, and manage RSVPs",
    icon: Calendar,
    color: "#8B5CF6",
    bgGradient: "bg-gradient-to-br from-violet-100 via-purple-50 to-fuchsia-100",
    includedApps: ["events", "meetings", "forms", "polls", "awards"],
    usersCount: 4500,
  },
  {
    id: "crm-business",
    name: "CRM & Business",
    description: "Manage contacts, deals, projects, and grow your business relationships",
    icon: Building2,
    color: "#3B82F6",
    bgGradient: "bg-gradient-to-br from-blue-100 via-indigo-50 to-violet-100",
    includedApps: ["crm", "contacts", "project-management", "tasks", "proposals", "deals"],
    usersCount: 5800,
  },
  {
    id: "identity-profile",
    name: "Identity & Profile",
    description: "Build your personal brand with verified identity and creator page",
    icon: Shield,
    color: "#059669",
    bgGradient: "bg-gradient-to-br from-emerald-100 via-teal-50 to-cyan-100",
    includedApps: ["my-page", "identity-verification"],
    usersCount: 3200,
  },
  {
    id: "ai-tools",
    name: "AI Tools Suite",
    description: "AI-powered assistant, automations, clips, and post-production",
    icon: BrainCircuit,
    color: "#D946EF",
    bgGradient: "bg-gradient-to-br from-fuchsia-100 via-purple-50 to-violet-100",
    includedApps: ["spark-ai", "ai-automation", "ai-clips", "ai-post-production"],
    isPopular: true,
    usersCount: 9100,
  },
];

// External third-party integrations (not Seeksy-built)
export interface ExternalIntegration {
  id: string;
  name: string;
  description: string;
  logoUrl?: string;
  logoIcon: string;
  bgColor: string;
  category: "calendar" | "communication" | "storage" | "analytics" | "payment" | "social";
  isConnected?: boolean;
  route?: string;
}

export const EXTERNAL_INTEGRATIONS: ExternalIntegration[] = [
  {
    id: "google-calendar",
    name: "Google Calendar",
    description: "Sync your meetings and events with Google Calendar",
    logoIcon: "📅",
    bgColor: "bg-blue-500",
    category: "calendar",
  },
  {
    id: "zoom",
    name: "Zoom",
    description: "Host video calls and import recordings from Zoom",
    logoIcon: "📹",
    bgColor: "bg-blue-600",
    category: "communication",
  },
  {
    id: "google-drive",
    name: "Google Drive",
    description: "Store and access files from Google Drive",
    logoIcon: "📁",
    bgColor: "bg-yellow-500",
    category: "storage",
  },
  {
    id: "youtube",
    name: "YouTube",
    description: "Import videos and publish directly to YouTube",
    logoIcon: "▶️",
    bgColor: "bg-red-600",
    category: "social",
  },
  {
    id: "spotify",
    name: "Spotify for Podcasters",
    description: "Distribute your podcast to Spotify",
    logoIcon: "🎵",
    bgColor: "bg-green-500",
    category: "social",
  },
  {
    id: "stripe",
    name: "Stripe",
    description: "Accept payments for events, subscriptions, and products",
    logoIcon: "💳",
    bgColor: "bg-indigo-600",
    category: "payment",
  },
  {
    id: "apple-podcasts",
    name: "Apple Podcasts",
    description: "Distribute your podcast to Apple Podcasts",
    logoIcon: "🎙️",
    bgColor: "bg-purple-600",
    category: "social",
  },
  {
    id: "tiktok",
    name: "TikTok",
    description: "Publish clips directly to TikTok",
    logoIcon: "🎬",
    bgColor: "bg-black",
    category: "social",
  },
  {
    id: "instagram",
    name: "Instagram",
    description: "Share clips and content to Instagram",
    logoIcon: "📷",
    bgColor: "bg-gradient-to-br from-purple-500 to-pink-500",
    category: "social",
  },
  {
    id: "riverside",
    name: "Riverside",
    description: "Import recordings from Riverside.fm",
    logoIcon: "🎤",
    bgColor: "bg-teal-600",
    category: "communication",
  },
  {
    id: "resend",
    name: "Resend",
    description: "Send transactional emails via Resend",
    logoIcon: "✉️",
    bgColor: "bg-slate-800",
    category: "communication",
  },
  {
    id: "twilio",
    name: "Twilio",
    description: "Send SMS and voice calls via Twilio",
    logoIcon: "📱",
    bgColor: "bg-red-500",
    category: "communication",
  },
];
