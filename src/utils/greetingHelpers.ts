// Time-aware greeting helper
export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

export function getTimeOfDay(): TimeOfDay {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

export function getGreetingByTime(): string {
  const timeOfDay = getTimeOfDay();
  const greetings: Record<TimeOfDay, string> = {
    morning: 'Good morning',
    afternoon: 'Good afternoon',
    evening: 'Good evening',
    night: 'Good night',
  };
  return greetings[timeOfDay];
}

// Mood gradient colors based on time
export function getMoodGradient(): { from: string; to: string; accent: string } {
  const timeOfDay = getTimeOfDay();
  const gradients: Record<TimeOfDay, { from: string; to: string; accent: string }> = {
    morning: {
      from: 'hsl(45, 93%, 94%)',  // soft gold
      to: 'hsl(25, 95%, 92%)',    // sunrise peach
      accent: 'hsl(35, 91%, 65%)', // warm gold
    },
    afternoon: {
      from: 'hsl(210, 100%, 96%)', // vibrant blue
      to: 'hsl(230, 80%, 94%)',    // indigo tint
      accent: 'hsl(220, 90%, 60%)', // bright blue
    },
    evening: {
      from: 'hsl(270, 50%, 94%)',  // deep purple
      to: 'hsl(30, 70%, 93%)',     // warm amber
      accent: 'hsl(280, 60%, 60%)', // purple
    },
    night: {
      from: 'hsl(230, 50%, 20%)',  // midnight navy
      to: 'hsl(220, 60%, 30%)',    // cool moonlight
      accent: 'hsl(210, 80%, 70%)', // moonlight blue
    },
  };
  return gradients[timeOfDay];
}

// Seasonal detection
export type Season = 'winter' | 'spring' | 'summer' | 'autumn' | 'holiday';

export function getCurrentSeason(): Season {
  const now = new Date();
  const month = now.getMonth();
  const day = now.getDate();
  
  // Holiday detection (Dec 1 - Jan 2)
  if ((month === 11) || (month === 0 && day <= 2)) {
    return 'holiday';
  }
  
  // Autumn (Sept, Oct, Nov)
  if (month >= 8 && month <= 10) return 'autumn';
  
  // Winter (Dec, Jan, Feb) - non-holiday
  if (month === 11 || month <= 1) return 'winter';
  
  // Spring (Mar, Apr, May)
  if (month >= 2 && month <= 4) return 'spring';
  
  // Summer (Jun, Jul, Aug)
  return 'summer';
}

// Personalized insights (can be extended with real data)
export function getPersonalizedInsights(stats?: {
  drafts?: number;
  newSubscribers?: number;
  pendingMeetings?: number;
  clipsReady?: number;
  lastEpisodePerformance?: 'good' | 'average' | 'poor';
  peakActivityTime?: string;
}): string[] {
  const insights: string[] = [];
  
  if (stats?.peakActivityTime) {
    insights.push(`Your audience was most active yesterday at ${stats.peakActivityTime}.`);
  }
  
  if (stats?.newSubscribers && stats.newSubscribers > 0) {
    insights.push(`You have ${stats.newSubscribers} new subscriber${stats.newSubscribers > 1 ? 's' : ''} waiting to engage.`);
  }
  
  if (stats?.lastEpisodePerformance === 'good') {
    insights.push("It's a great day to record — your last episode performed well!");
  }
  
  if (stats?.clipsReady && stats.clipsReady > 0) {
    insights.push(`Your clips are almost ready for posting — ${stats.clipsReady} highlight${stats.clipsReady > 1 ? 's' : ''} detected.`);
  }
  
  if (stats?.drafts && stats.drafts > 0) {
    insights.push(`You have ${stats.drafts} draft${stats.drafts > 1 ? 's' : ''} ready to finish.`);
  }
  
  if (stats?.pendingMeetings && stats.pendingMeetings > 0) {
    insights.push(`${stats.pendingMeetings} guest${stats.pendingMeetings > 1 ? 's' : ''} confirmed your meeting invite.`);
  }
  
  // Default insights if none available
  if (insights.length === 0) {
    const defaults = [
      "Ready to create something amazing today?",
      "Your creative journey continues — let's make it count.",
      "New opportunities await in your creator hub.",
    ];
    insights.push(defaults[Math.floor(Math.random() * defaults.length)]);
  }
  
  return insights;
}

// Attention items
export interface AttentionItem {
  id: string;
  label: string;
  type: 'task' | 'notification' | 'reminder';
  priority: 'high' | 'medium' | 'low';
}

export function getAttentionItems(stats?: {
  drafts?: number;
  pendingMeetings?: number;
  identityCompletion?: number;
  unreadMessages?: number;
}): AttentionItem[] {
  const items: AttentionItem[] = [];
  
  if (stats?.drafts && stats.drafts > 0) {
    items.push({
      id: 'drafts',
      label: 'You have drafts ready to finish',
      type: 'task',
      priority: 'medium',
    });
  }
  
  if (stats?.pendingMeetings && stats.pendingMeetings > 0) {
    items.push({
      id: 'meetings',
      label: `${stats.pendingMeetings} guest${stats.pendingMeetings > 1 ? 's' : ''} confirmed your meeting invite`,
      type: 'notification',
      priority: 'high',
    });
  }
  
  if (stats?.identityCompletion && stats.identityCompletion < 100) {
    items.push({
      id: 'identity',
      label: `Your identity verification is ${stats.identityCompletion}% complete`,
      type: 'reminder',
      priority: 'low',
    });
  }
  
  if (stats?.unreadMessages && stats.unreadMessages > 0) {
    items.push({
      id: 'messages',
      label: `${stats.unreadMessages} new message${stats.unreadMessages > 1 ? 's' : ''} to review`,
      type: 'notification',
      priority: 'medium',
    });
  }
  
  return items.slice(0, 2); // Max 2 items
}
