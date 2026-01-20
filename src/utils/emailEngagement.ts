interface EmailEvent {
  event_type: string;
  occurred_at: string;
  device_type?: string;
  ip_address?: string;
}

export interface EngagementStats {
  opens: number;
  clicks: number;
  bounces: number;
  firstOpenMinutes: number | null;
  devices: Set<string>;
  ips: Set<string>;
}

export type EngagementTag = "Hot Lead" | "Interested" | "Cold" | "Possible Spam Folder" | "Forwarded" | null;

export const calculateEngagementStats = (events: EmailEvent[], sentAt: string): EngagementStats => {
  const opens = events.filter((e) => e.event_type === "email.opened").length;
  const clicks = events.filter((e) => e.event_type === "email.clicked").length;
  const bounces = events.filter((e) => e.event_type === "email.bounced").length;

  const devices = new Set<string>();
  const ips = new Set<string>();

  events.forEach((e) => {
    if (e.device_type) devices.add(e.device_type);
    if (e.ip_address) ips.add(e.ip_address);
  });

  let firstOpenMinutes: number | null = null;
  const firstOpen = events.find((e) => e.event_type === "email.opened");
  if (firstOpen) {
    const sentTime = new Date(sentAt).getTime();
    const openTime = new Date(firstOpen.occurred_at).getTime();
    firstOpenMinutes = Math.round((openTime - sentTime) / 1000 / 60);
  }

  return { opens, clicks, bounces, firstOpenMinutes, devices, ips };
};

export const getEngagementTag = (stats: EngagementStats, daysSinceSent: number): EngagementTag => {
  const { opens, clicks, bounces, firstOpenMinutes, ips } = stats;

  // Bounced = delivery failure
  if (bounces > 0) return null;

  // Forwarded = multiple IPs or devices
  if (ips.size > 2) return "Forwarded";

  // Hot Lead = fast open + multiple opens or clicks
  if (firstOpenMinutes !== null && firstOpenMinutes < 30 && (opens > 2 || clicks > 0)) {
    return "Hot Lead";
  }

  // Interested = several opens
  if (opens >= 2) {
    return "Interested";
  }

  // Possible Spam Folder = no opens + old email
  if (opens === 0 && daysSinceSent > 60) {
    return "Possible Spam Folder";
  }

  // Cold = no opens
  if (opens === 0) {
    return "Cold";
  }

  return null;
};

export const getEngagementColor = (tag: EngagementTag): string => {
  switch (tag) {
    case "Hot Lead":
      return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400";
    case "Interested":
      return "bg-green-500/10 text-green-600 dark:text-green-400";
    case "Cold":
      return "bg-gray-500/10 text-gray-600 dark:text-gray-400";
    case "Possible Spam Folder":
      return "bg-red-500/10 text-red-600 dark:text-red-400";
    case "Forwarded":
      return "bg-purple-500/10 text-purple-600 dark:text-purple-400";
    default:
      return "bg-gray-500/10 text-gray-600 dark:text-gray-400";
  }
};
