import { PersonaType } from "@/config/personaConfig";

export const DASHBOARD_TITLES: Record<PersonaType | "default", string> = {
  podcaster: "Podcast Creator Dashboard",
  influencer: "Creator Growth Dashboard",
  speaker: "Speaker & Expert Dashboard",
  eventHost: "Live Studio Dashboard",
  entrepreneur: "Brand Content Dashboard",
  agency: "Agency Command Center",
  brand: "Brand & Venue Dashboard",
  communityLeader: "Influencer Dashboard",
  default: "Your Creator Dashboard",
};

export function getDashboardTitle(personaType?: PersonaType | null): string {
  if (!personaType) return DASHBOARD_TITLES.default;
  return DASHBOARD_TITLES[personaType] || DASHBOARD_TITLES.default;
}

export function getDashboardSubtitle(personaType?: PersonaType | null): string {
  const subtitles: Record<PersonaType | "default", string> = {
    podcaster: "Record, edit, and grow your podcast",
    influencer: "Create content and grow your audience",
    speaker: "Book sessions and share your expertise",
    eventHost: "Plan and host amazing events",
    entrepreneur: "Manage your business content",
    agency: "Manage creators at scale",
    brand: "Discover and partner with creators",
    communityLeader: "Grow your audience and monetize your influence",
    default: "Your personalized workspace",
  };
  return subtitles[personaType || "default"] || subtitles.default;
}
