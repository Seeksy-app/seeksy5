import { cn } from "@/lib/utils";

interface ModuleIconProps {
  className?: string;
}

// Studio & Recording - Camera + Mic + Record dot
export function StudioIcon({ className }: ModuleIconProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={cn("w-full h-full", className)}>
      {/* Microphone */}
      <path d="M18 14C18 11.7909 19.7909 10 22 10C24.2091 10 26 11.7909 26 14V22C26 24.2091 24.2091 26 22 26C19.7909 26 18 24.2091 18 22V14Z" stroke="currentColor" strokeWidth="2.5" fill="none"/>
      <path d="M14 20V22C14 26.4183 17.5817 30 22 30C26.4183 30 30 26.4183 30 22V20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M22 30V35" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M17 35H27" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      {/* Record dot */}
      <circle cx="36" cy="12" r="5" fill="#EF4444" className="animate-pulse"/>
      <circle cx="36" cy="12" r="3" fill="#FCA5A5"/>
    </svg>
  );
}

// AI Clips Generator - Video frame + Scissors + Sparkles
export function AIClipsIcon({ className }: ModuleIconProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={cn("w-full h-full", className)}>
      {/* Video frame */}
      <rect x="6" y="10" width="28" height="22" rx="3" stroke="currentColor" strokeWidth="2.5" fill="none"/>
      <path d="M34 17L42 12V32L34 27" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      {/* Scissors */}
      <circle cx="32" cy="36" r="4" stroke="#8B5CF6" strokeWidth="2" fill="none"/>
      <circle cx="42" cy="36" r="4" stroke="#8B5CF6" strokeWidth="2" fill="none"/>
      <path d="M29 39L39 32M32 32L42 39" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round"/>
      {/* Sparkles */}
      <path d="M8 6L9 9L12 10L9 11L8 14L7 11L4 10L7 9L8 6Z" fill="#F59E0B"/>
      <path d="M40 4L41 6L43 7L41 8L40 10L39 8L37 7L39 6L40 4Z" fill="#F59E0B"/>
    </svg>
  );
}

// AI Post-Production - Waveform + Magic wand with sparkles
export function AIPostProductionIcon({ className }: ModuleIconProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={cn("w-full h-full", className)}>
      {/* Audio waveform */}
      <path d="M4 24H8" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
      <path d="M10 18V30" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
      <path d="M16 12V36" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
      <path d="M22 16V32" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
      <path d="M28 20V28" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
      {/* Magic wand */}
      <path d="M34 34L44 14" stroke="#8B5CF6" strokeWidth="3" strokeLinecap="round"/>
      <path d="M44 14L40 18" stroke="#8B5CF6" strokeWidth="3" strokeLinecap="round"/>
      {/* Sparkles */}
      <circle cx="38" cy="10" r="2" fill="#F59E0B"/>
      <circle cx="44" cy="8" r="1.5" fill="#FBBF24"/>
      <circle cx="42" cy="20" r="1.5" fill="#FBBF24"/>
      <path d="M32 8L33 11L36 12L33 13L32 16L31 13L28 12L31 11L32 8Z" fill="#F59E0B"/>
    </svg>
  );
}

// Media Library - Grid of images/videos with folder
export function MediaLibraryIcon({ className }: ModuleIconProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={cn("w-full h-full", className)}>
      {/* Folder base */}
      <path d="M4 14H18L22 10H44V38H4V14Z" stroke="currentColor" strokeWidth="2.5" fill="none"/>
      {/* Grid items */}
      <rect x="10" y="20" width="10" height="8" rx="1.5" fill="#60A5FA"/>
      <rect x="24" y="20" width="10" height="8" rx="1.5" fill="#A78BFA"/>
      <rect x="10" y="30" width="10" height="6" rx="1.5" fill="#34D399"/>
      {/* Play button overlay */}
      <circle cx="29" cy="33" r="4" fill="white" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M28 31L31 33L28 35V31Z" fill="currentColor"/>
    </svg>
  );
}

// Video Editor - Timeline with playhead
export function VideoEditorIcon({ className }: ModuleIconProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={cn("w-full h-full", className)}>
      {/* Timeline tracks */}
      <rect x="4" y="14" width="40" height="6" rx="2" fill="#C4B5FD"/>
      <rect x="4" y="22" width="40" height="6" rx="2" fill="#93C5FD"/>
      <rect x="4" y="30" width="40" height="6" rx="2" fill="#86EFAC"/>
      {/* Clips on timeline */}
      <rect x="8" y="14" width="12" height="6" rx="2" fill="#8B5CF6"/>
      <rect x="24" y="14" width="16" height="6" rx="2" fill="#7C3AED"/>
      <rect x="8" y="22" width="20" height="6" rx="2" fill="#3B82F6"/>
      <rect x="16" y="30" width="18" height="6" rx="2" fill="#22C55E"/>
      {/* Playhead */}
      <path d="M20 8L22 12H18L20 8Z" fill="#EF4444"/>
      <rect x="19" y="12" width="2" height="28" fill="#EF4444"/>
    </svg>
  );
}

// Voice Cloning - Waveform with ghost duplicate
export function VoiceCloningIcon({ className }: ModuleIconProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={cn("w-full h-full", className)}>
      {/* Primary waveform */}
      <path d="M6 24H10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
      <path d="M12 18V30" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
      <path d="M18 14V34" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
      <path d="M24 18V30" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
      {/* Ghost duplicate waveform */}
      <path d="M28 24H32" stroke="#A78BFA" strokeWidth="2.5" strokeLinecap="round" opacity="0.7"/>
      <path d="M34 18V30" stroke="#A78BFA" strokeWidth="2.5" strokeLinecap="round" opacity="0.7"/>
      <path d="M40 14V34" stroke="#A78BFA" strokeWidth="2.5" strokeLinecap="round" opacity="0.7"/>
      {/* Connection/clone indicator */}
      <path d="M25 10C25 10 30 8 35 10" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" strokeDasharray="3 2"/>
      <path d="M25 38C25 38 30 40 35 38" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" strokeDasharray="3 2"/>
    </svg>
  );
}

// Podcast Hosting - Mic with RSS broadcast waves
export function PodcastHostingIcon({ className }: ModuleIconProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={cn("w-full h-full", className)}>
      {/* Microphone */}
      <rect x="18" y="8" width="12" height="20" rx="6" stroke="currentColor" strokeWidth="2.5" fill="none"/>
      <path d="M12 22V24C12 30.6274 17.3726 36 24 36C30.6274 36 36 30.6274 36 24V22" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M24 36V42" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M18 42H30" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      {/* Broadcast waves */}
      <path d="M38 16C40 18 42 22 42 26" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M42 12C45 15 47 20 47 26" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" opacity="0.6"/>
      <path d="M10 16C8 18 6 22 6 26" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M6 12C3 15 1 20 1 26" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" opacity="0.6"/>
    </svg>
  );
}

// Marketing Campaigns - Megaphone with channel circles
export function MarketingCampaignsIcon({ className }: ModuleIconProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={cn("w-full h-full", className)}>
      {/* Megaphone */}
      <path d="M8 20V28L10 30V18L8 20Z" fill="currentColor"/>
      <path d="M10 18V30L28 38V10L10 18Z" stroke="currentColor" strokeWidth="2.5" fill="none"/>
      <path d="M28 14H32C34.2091 14 36 15.7909 36 18V30C36 32.2091 34.2091 34 32 34H28" stroke="currentColor" strokeWidth="2.5" fill="none"/>
      {/* Channel circles */}
      <circle cx="40" cy="10" r="4" fill="#F59E0B"/>
      <circle cx="44" cy="20" r="3" fill="#3B82F6"/>
      <circle cx="42" cy="30" r="3.5" fill="#8B5CF6"/>
      <circle cx="38" cy="38" r="3" fill="#22C55E"/>
    </svg>
  );
}

// Email / Newsletter - Envelope with star/lightning
export function EmailNewsletterIcon({ className }: ModuleIconProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={cn("w-full h-full", className)}>
      {/* Envelope */}
      <rect x="4" y="12" width="36" height="26" rx="3" stroke="currentColor" strokeWidth="2.5" fill="none"/>
      <path d="M4 15L22 26L40 15" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      {/* Lightning bolt accent */}
      <path d="M38 6L34 14H40L36 22" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      {/* Star accent */}
      <path d="M44 28L45 31L48 32L45 33L44 36L43 33L40 32L43 31L44 28Z" fill="#F59E0B"/>
    </svg>
  );
}

// Events / Meetings - Calendar with clock
export function EventsMeetingsIcon({ className }: ModuleIconProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={cn("w-full h-full", className)}>
      {/* Calendar */}
      <rect x="4" y="10" width="32" height="30" rx="3" stroke="currentColor" strokeWidth="2.5" fill="none"/>
      <path d="M4 18H36" stroke="currentColor" strokeWidth="2.5"/>
      <path d="M12 6V14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M28 6V14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      {/* Date squares */}
      <rect x="10" y="24" width="6" height="5" rx="1" fill="#E0E7FF"/>
      <rect x="18" y="24" width="6" height="5" rx="1" fill="#DDD6FE"/>
      <rect x="26" y="24" width="6" height="5" rx="1" fill="#E0E7FF"/>
      <rect x="10" y="31" width="6" height="5" rx="1" fill="#DBEAFE"/>
      <rect x="18" y="31" width="6" height="5" rx="1" fill="#E0E7FF"/>
      {/* Clock overlay */}
      <circle cx="38" cy="34" r="9" fill="white" stroke="#3B82F6" strokeWidth="2.5"/>
      <path d="M38 28V34L42 36" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

// CRM / Contacts - Person with network nodes
export function CRMContactsIcon({ className }: ModuleIconProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={cn("w-full h-full", className)}>
      {/* Main person */}
      <circle cx="20" cy="14" r="7" stroke="currentColor" strokeWidth="2.5" fill="none"/>
      <path d="M6 40C6 31.1634 12.1634 24 20 24C27.8366 24 34 31.1634 34 40" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      {/* Network nodes */}
      <circle cx="40" cy="12" r="4" fill="#60A5FA" stroke="#3B82F6" strokeWidth="1.5"/>
      <circle cx="44" cy="26" r="3" fill="#A78BFA" stroke="#8B5CF6" strokeWidth="1.5"/>
      <circle cx="38" cy="38" r="3.5" fill="#34D399" stroke="#22C55E" strokeWidth="1.5"/>
      {/* Connection lines */}
      <path d="M27 12L36 12" stroke="#94A3B8" strokeWidth="1.5" strokeDasharray="3 2"/>
      <path d="M34 22L41 24" stroke="#94A3B8" strokeWidth="1.5" strokeDasharray="3 2"/>
      <path d="M34 36L35 37" stroke="#94A3B8" strokeWidth="1.5" strokeDasharray="3 2"/>
    </svg>
  );
}

// Spark AI - Brain with circuit/sparkles
export function SparkAIIcon({ className }: ModuleIconProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={cn("w-full h-full", className)}>
      {/* Brain outline */}
      <path d="M24 8C16 8 10 14 10 22C10 30 16 38 24 38C32 38 38 30 38 22C38 14 32 8 24 8Z" stroke="currentColor" strokeWidth="2.5" fill="none"/>
      <path d="M24 8V38" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M16 16C18 18 22 18 24 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M24 16C26 18 30 18 32 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M16 28C18 26 22 26 24 28" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M24 28C26 26 30 26 32 28" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      {/* Sparkles */}
      <path d="M6 12L8 16L12 17L8 18L6 22L4 18L0 17L4 16L6 12Z" fill="#F59E0B"/>
      <path d="M42 8L43 11L46 12L43 13L42 16L41 13L38 12L41 11L42 8Z" fill="#FBBF24"/>
      <path d="M44 32L45 34L47 35L45 36L44 38L43 36L41 35L43 34L44 32Z" fill="#F59E0B"/>
    </svg>
  );
}

// Newsletter - Envelope with share/send arrows
export function NewsletterIcon({ className }: ModuleIconProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={cn("w-full h-full", className)}>
      {/* Stack of papers */}
      <rect x="8" y="6" width="28" height="34" rx="2" fill="#E0E7FF" stroke="currentColor" strokeWidth="2"/>
      <rect x="4" y="10" width="28" height="34" rx="2" fill="white" stroke="currentColor" strokeWidth="2.5"/>
      {/* Text lines */}
      <path d="M10 18H26" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round"/>
      <path d="M10 24H22" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round"/>
      <path d="M10 30H24" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round"/>
      <path d="M10 36H18" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round"/>
      {/* Share arrows */}
      <circle cx="38" cy="20" r="8" fill="#3B82F6"/>
      <path d="M34 20L38 16L42 20M38 16V26" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// Deals Pipeline - Dollar with upward trend
export function DealsPipelineIcon({ className }: ModuleIconProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={cn("w-full h-full", className)}>
      {/* Dollar sign */}
      <circle cx="20" cy="24" r="14" stroke="currentColor" strokeWidth="2.5" fill="none"/>
      <path d="M20 12V36" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M14 18C14 16 16 14 20 14C24 14 26 16 26 18C26 20 24 22 20 22C16 22 14 24 14 26C14 28 16 30 20 30C24 30 26 28 26 26" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      {/* Trend line */}
      <path d="M32 36L38 28L44 32L48 24" stroke="#22C55E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M44 24H48V28" stroke="#22C55E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// Blog & Content - Document with pen
export function BlogContentIcon({ className }: ModuleIconProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={cn("w-full h-full", className)}>
      {/* Document */}
      <path d="M8 6H32L40 14V42H8V6Z" stroke="currentColor" strokeWidth="2.5" fill="none"/>
      <path d="M32 6V14H40" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      {/* Text lines */}
      <path d="M14 22H34" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round"/>
      <path d="M14 28H30" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round"/>
      <path d="M14 34H26" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round"/>
      {/* Pen */}
      <path d="M40 28L44 24L48 28L44 32L40 28Z" fill="#F59E0B"/>
      <path d="M36 32L40 28L44 32L40 36L36 32Z" stroke="#F59E0B" strokeWidth="2"/>
      <path d="M36 36L34 42L40 36" fill="#F59E0B"/>
    </svg>
  );
}

// Identity & Verification - Shield with checkmark
export function IdentityVerificationIcon({ className }: ModuleIconProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={cn("w-full h-full", className)}>
      {/* Shield */}
      <path d="M24 4L6 12V22C6 32 14 40 24 44C34 40 42 32 42 22V12L24 4Z" stroke="currentColor" strokeWidth="2.5" fill="none"/>
      {/* Checkmark */}
      <path d="M16 24L22 30L34 18" stroke="#22C55E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
      {/* Subtle lock indicator */}
      <circle cx="24" cy="24" r="10" stroke="currentColor" strokeWidth="1" strokeDasharray="4 2" opacity="0.3"/>
    </svg>
  );
}

// Map module IDs to their custom icons
export const MODULE_CUSTOM_ICONS: Record<string, React.FC<ModuleIconProps>> = {
  "studio": StudioIcon,
  "ai-clips": AIClipsIcon,
  "ai-post-production": AIPostProductionIcon,
  "media-library": MediaLibraryIcon,
  "video-editor": VideoEditorIcon,
  "cloning": VoiceCloningIcon,
  "podcasts": PodcastHostingIcon,
  "campaigns": MarketingCampaignsIcon,
  "email": EmailNewsletterIcon,
  "newsletter": NewsletterIcon,
  "events": EventsMeetingsIcon,
  "meetings": EventsMeetingsIcon,
  "crm": CRMContactsIcon,
  "contacts": CRMContactsIcon,
  "spark-ai": SparkAIIcon,
  "deals": DealsPipelineIcon,
  "blog": BlogContentIcon,
  "identity-verification": IdentityVerificationIcon,
};

// Category-specific gradient configurations
export const CATEGORY_GRADIENTS: Record<string, { bg: string; iconRing: string }> = {
  "creator-studio": {
    bg: "bg-gradient-to-br from-rose-200 via-pink-100 to-fuchsia-200",
    iconRing: "ring-rose-200/60",
  },
  "ai-tools": {
    bg: "bg-gradient-to-br from-violet-200 via-purple-100 to-indigo-200",
    iconRing: "ring-violet-200/60",
  },
  "podcasting": {
    bg: "bg-gradient-to-br from-emerald-200 via-green-100 to-teal-200",
    iconRing: "ring-emerald-200/60",
  },
  "campaigns": {
    bg: "bg-gradient-to-br from-amber-200 via-orange-100 to-yellow-200",
    iconRing: "ring-amber-200/60",
  },
  "events": {
    bg: "bg-gradient-to-br from-fuchsia-200 via-pink-100 to-rose-200",
    iconRing: "ring-fuchsia-200/60",
  },
  "crm-business": {
    bg: "bg-gradient-to-br from-blue-200 via-cyan-100 to-teal-200",
    iconRing: "ring-blue-200/60",
  },
  "analytics": {
    bg: "bg-gradient-to-br from-indigo-200 via-blue-100 to-violet-200",
    iconRing: "ring-indigo-200/60",
  },
  "identity": {
    bg: "bg-gradient-to-br from-emerald-200 via-teal-100 to-cyan-200",
    iconRing: "ring-emerald-200/60",
  },
  "content": {
    bg: "bg-gradient-to-br from-slate-200 via-gray-100 to-zinc-200",
    iconRing: "ring-slate-200/60",
  },
};
