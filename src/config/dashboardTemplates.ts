import { DashboardTemplate } from "@/types/dashboard";

export const DASHBOARD_TEMPLATES: DashboardTemplate[] = [
  {
    id: "podcaster",
    name: "Podcaster Layout",
    description: "Perfect for podcast creators managing episodes, RSS, and monetization",
    targetAudience: ["podcaster"],
    widgets: [
      "recent-episodes",
      "rss-status",
      "ai-edit-queue",
      "clip-library",
      "guest-invites",
      "monetization-overview",
    ],
  },
  {
    id: "influencer",
    name: "Influencer/Creator Layout",
    description: "Ideal for content creators focused on clips, brands, and social growth",
    targetAudience: ["creator", "influencer"],
    widgets: [
      "media-vault",
      "ai-clip-generator",
      "brand-requests",
      "social-queue",
      "audience-growth",
      "clip-library",
    ],
  },
  {
    id: "event-planner",
    name: "Event Planner Layout",
    description: "Organize events, registrations, and live experiences",
    targetAudience: ["event-planner"],
    widgets: [
      "event-pipeline",
      "registrations",
      "meeting-types",
      "event-tasks",
      "live-room-status",
    ],
  },
  {
    id: "meeting-host",
    name: "Meeting Host Layout",
    description: "Manage bookings, contacts, and virtual meetings",
    targetAudience: ["meeting-host"],
    widgets: [
      "upcoming-meetings",
      "quick-launch-room",
      "contacts-snapshot",
      "booking-types",
      "email-templates",
    ],
  },
  {
    id: "agency",
    name: "Agency Layout",
    description: "Oversee multiple creators, revenue, and brand deals",
    targetAudience: ["agency"],
    widgets: [
      "creator-switcher",
      "revenue-rollup",
      "brand-deals",
      "content-calendar",
      "asset-library",
    ],
  },
  {
    id: "speaker",
    name: "Speaker / Industry Creator",
    description: "Share bite-sized content, event replays, and manage bookings",
    targetAudience: ["speaker"],
    widgets: [
      "clip-library",
      "bite-sized-creation",
      "event-replays",
      "transcript-generator",
      "booking-calendar",
    ],
  },
];
