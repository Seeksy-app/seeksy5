import { cn } from "@/lib/utils";
import { type SeeksyModule } from "./moduleData";
import { MODULE_CUSTOM_ICONS, CATEGORY_GRADIENTS } from "./ModuleIcons";

interface ModulePreviewProps {
  module: SeeksyModule;
  size?: "sm" | "md" | "lg";
  className?: string;
}

// Auto-generate preview backgrounds based on module type
const MODULE_PREVIEW_PATTERNS: Record<string, React.FC<{ className?: string }>> = {
  // Studio - video timeline pattern
  "studio": ({ className }) => (
    <div className={cn("w-full h-full relative overflow-hidden", className)}>
      <div className="absolute inset-x-4 top-6 h-3 rounded bg-white/60" />
      <div className="absolute inset-x-4 top-11 h-2 rounded bg-white/40" />
      {/* Timeline */}
      <div className="absolute bottom-8 inset-x-4 h-16 bg-white/20 rounded-lg p-2">
        <div className="flex gap-1 h-full">
          <div className="w-8 h-full bg-rose-400/60 rounded" />
          <div className="w-16 h-full bg-rose-300/50 rounded" />
          <div className="w-6 h-full bg-rose-400/60 rounded" />
          <div className="w-20 h-full bg-rose-300/50 rounded" />
          <div className="w-10 h-full bg-rose-400/60 rounded" />
        </div>
      </div>
      {/* Playhead */}
      <div className="absolute bottom-8 left-20 w-0.5 h-16 bg-red-500" />
    </div>
  ),
  
  // AI Clips - scissors + highlights
  "ai-clips": ({ className }) => (
    <div className={cn("w-full h-full relative overflow-hidden", className)}>
      <div className="absolute top-4 left-4 right-4 space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-violet-400/80" />
          <div className="flex-1 h-2 rounded bg-white/50" />
          <div className="text-[10px] text-white/60 font-bold">92%</div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-violet-300/60" />
          <div className="flex-1 h-2 rounded bg-white/40" />
          <div className="text-[10px] text-white/60 font-bold">87%</div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-violet-200/50" />
          <div className="flex-1 h-2 rounded bg-white/30" />
          <div className="text-[10px] text-white/60 font-bold">81%</div>
        </div>
      </div>
      {/* Clip preview cards */}
      <div className="absolute bottom-4 inset-x-4 flex gap-2">
        <div className="flex-1 h-20 rounded-lg bg-white/30 border border-white/20" />
        <div className="flex-1 h-20 rounded-lg bg-white/20 border border-white/10" />
        <div className="flex-1 h-20 rounded-lg bg-white/20 border border-white/10" />
      </div>
    </div>
  ),
  
  // AI Post-Production - waveform
  "ai-post-production": ({ className }) => (
    <div className={cn("w-full h-full relative overflow-hidden", className)}>
      <div className="absolute top-4 left-4 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
        <div className="text-[10px] text-white/70 font-medium">Processing...</div>
      </div>
      {/* Waveform */}
      <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 flex items-center justify-center gap-0.5 h-16">
        {[...Array(40)].map((_, i) => (
          <div 
            key={i} 
            className="w-1 rounded-full bg-gradient-to-t from-blue-400/60 to-cyan-300/60"
            style={{ 
              height: `${Math.sin(i * 0.3) * 30 + 40}%`,
              opacity: i > 25 ? 0.3 : 0.8 
            }} 
          />
        ))}
      </div>
      {/* Enhancement badges */}
      <div className="absolute bottom-4 left-4 flex gap-2">
        <div className="px-2 py-1 rounded bg-green-500/30 text-[9px] text-white font-medium">✓ Filler removed</div>
        <div className="px-2 py-1 rounded bg-green-500/30 text-[9px] text-white font-medium">✓ Enhanced</div>
      </div>
    </div>
  ),
  
  // Media Library - grid
  "media-library": ({ className }) => (
    <div className={cn("w-full h-full relative overflow-hidden p-4", className)}>
      <div className="grid grid-cols-3 gap-2 h-full">
        <div className="bg-white/40 rounded-lg" />
        <div className="bg-white/30 rounded-lg" />
        <div className="bg-white/35 rounded-lg" />
        <div className="bg-white/25 rounded-lg" />
        <div className="bg-white/40 rounded-lg" />
        <div className="bg-white/30 rounded-lg" />
      </div>
    </div>
  ),
  
  // Video Editor - timeline
  "video-editor": ({ className }) => (
    <div className={cn("w-full h-full relative overflow-hidden", className)}>
      {/* Preview monitor */}
      <div className="absolute top-4 inset-x-4 h-16 bg-black/30 rounded-lg flex items-center justify-center">
        <div className="w-0 h-0 border-l-8 border-l-white/60 border-y-4 border-y-transparent" />
      </div>
      {/* Multi-track timeline */}
      <div className="absolute bottom-4 inset-x-4 space-y-1.5">
        <div className="h-4 bg-purple-400/40 rounded flex gap-0.5 p-0.5">
          <div className="w-10 h-full bg-purple-300 rounded-sm" />
          <div className="w-16 h-full bg-purple-400 rounded-sm" />
        </div>
        <div className="h-4 bg-violet-400/30 rounded flex gap-0.5 p-0.5">
          <div className="w-6 h-full bg-violet-300 rounded-sm" />
          <div className="w-12 h-full bg-violet-400 rounded-sm" />
          <div className="w-8 h-full bg-violet-300 rounded-sm" />
        </div>
        <div className="h-4 bg-indigo-400/30 rounded flex gap-0.5 p-0.5">
          <div className="w-20 h-full bg-indigo-300 rounded-sm" />
        </div>
      </div>
    </div>
  ),
  
  // Podcasts - RSS waves
  "podcasts": ({ className }) => (
    <div className={cn("w-full h-full relative overflow-hidden", className)}>
      {/* Podcast card */}
      <div className="absolute top-4 left-4 flex gap-3">
        <div className="w-14 h-14 rounded-lg bg-white/50" />
        <div className="space-y-2 pt-1">
          <div className="w-24 h-2 rounded bg-white/60" />
          <div className="w-16 h-1.5 rounded bg-white/40" />
        </div>
      </div>
      {/* Episode list */}
      <div className="absolute bottom-4 inset-x-4 space-y-2">
        <div className="h-8 rounded bg-white/20 flex items-center px-2 gap-2">
          <div className="w-6 h-6 rounded bg-white/30" />
          <div className="flex-1">
            <div className="w-20 h-1.5 rounded bg-white/40" />
          </div>
          <div className="text-[9px] text-white/50">45:32</div>
        </div>
        <div className="h-8 rounded bg-white/15 flex items-center px-2 gap-2">
          <div className="w-6 h-6 rounded bg-white/20" />
          <div className="flex-1">
            <div className="w-16 h-1.5 rounded bg-white/30" />
          </div>
          <div className="text-[9px] text-white/40">32:15</div>
        </div>
      </div>
    </div>
  ),
  
  // Campaigns - megaphone chart
  "campaigns": ({ className }) => (
    <div className={cn("w-full h-full relative overflow-hidden", className)}>
      {/* Stats */}
      <div className="absolute top-4 left-4 right-4 flex gap-2">
        <div className="flex-1 p-2 rounded bg-white/20">
          <div className="text-[9px] text-white/60">Sent</div>
          <div className="text-sm font-bold text-white/90">2.4k</div>
        </div>
        <div className="flex-1 p-2 rounded bg-white/20">
          <div className="text-[9px] text-white/60">Opens</div>
          <div className="text-sm font-bold text-white/90">68%</div>
        </div>
      </div>
      {/* Chart bars */}
      <div className="absolute bottom-4 inset-x-4 flex items-end gap-1 h-12">
        {[40, 65, 50, 80, 60, 75, 90].map((h, i) => (
          <div key={i} className="flex-1 bg-orange-300/50 rounded-t" style={{ height: `${h}%` }} />
        ))}
      </div>
    </div>
  ),
  
  // CRM - contacts network
  "crm": ({ className }) => (
    <div className={cn("w-full h-full relative overflow-hidden", className)}>
      {/* Contact cards */}
      <div className="absolute top-4 left-4 right-4 grid grid-cols-2 gap-2">
        <div className="p-2 rounded bg-white/25">
          <div className="w-6 h-6 rounded-full bg-white/50 mx-auto mb-1" />
          <div className="w-12 h-1.5 rounded bg-white/40 mx-auto" />
        </div>
        <div className="p-2 rounded bg-white/20">
          <div className="w-6 h-6 rounded-full bg-white/40 mx-auto mb-1" />
          <div className="w-10 h-1.5 rounded bg-white/30 mx-auto" />
        </div>
      </div>
      {/* Pipeline */}
      <div className="absolute bottom-4 inset-x-4 flex gap-1">
        <div className="flex-1 h-6 rounded bg-blue-400/40" />
        <div className="flex-1 h-6 rounded bg-blue-300/30" />
        <div className="flex-1 h-6 rounded bg-blue-200/20" />
      </div>
    </div>
  ),
  
  // Events - calendar
  "events": ({ className }) => (
    <div className={cn("w-full h-full relative overflow-hidden p-4", className)}>
      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {[...Array(28)].map((_, i) => (
          <div 
            key={i} 
            className={cn(
              "aspect-square rounded text-[8px] flex items-center justify-center",
              i === 12 ? "bg-fuchsia-400/60 text-white font-bold" : "bg-white/20 text-white/50"
            )}
          >
            {i + 1}
          </div>
        ))}
      </div>
    </div>
  ),
  
  // Default pattern
  "default": ({ className }) => (
    <div className={cn("w-full h-full relative overflow-hidden", className)}>
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-4 left-4 w-20 h-3 rounded-full bg-white/60" />
        <div className="absolute top-9 left-4 w-28 h-2.5 rounded-full bg-white/40" />
        <div className="absolute top-4 right-4 w-14 h-14 rounded-xl bg-white/30 rotate-12" />
        <div className="absolute bottom-4 left-8 w-24 h-24 rounded-xl bg-white/20 -rotate-6" />
      </div>
    </div>
  ),
};

export function ModulePreview({ module, size = "md", className }: ModulePreviewProps) {
  const PreviewPattern = MODULE_PREVIEW_PATTERNS[module.id] || MODULE_PREVIEW_PATTERNS.default;
  const CustomIcon = MODULE_CUSTOM_ICONS[module.id];
  const LucideIcon = module.icon;
  const categoryGradient = CATEGORY_GRADIENTS[module.category];
  const bgGradient = categoryGradient?.bg || module.bgGradient || "bg-gradient-to-br from-slate-100 to-slate-50";
  
  const sizeClasses = {
    sm: "h-24",
    md: "h-40",
    lg: "h-56",
  };
  
  return (
    <div className={cn("relative overflow-hidden rounded-t-xl", bgGradient, sizeClasses[size], className)}>
      {/* Preview Pattern */}
      <PreviewPattern className="absolute inset-0" />
      
      {/* Module badge in lower-left corner */}
      <div className="absolute bottom-3 left-3 z-10">
        <div className="w-10 h-10 rounded-lg bg-white shadow-lg flex items-center justify-center ring-2 ring-white/50">
          {CustomIcon ? (
            <div className={cn("w-6 h-6", module.iconColor || "text-primary")}>
              <CustomIcon />
            </div>
          ) : (
            <LucideIcon className={cn("h-5 w-5", module.iconColor || "text-primary")} />
          )}
        </div>
      </div>
      
      {/* Top-left Badges */}
      <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
        {module.isAIPowered && (
          <div className="px-2 py-0.5 rounded bg-gradient-to-r from-violet-600 to-purple-600 text-white text-[10px] font-bold shadow-lg flex items-center gap-1">
            <span>✨</span> AI
          </div>
        )}
        {module.isNew && (
          <div className="px-2 py-0.5 rounded bg-gradient-to-r from-emerald-500 to-green-500 text-white text-[10px] font-bold shadow-lg">
            New
          </div>
        )}
      </div>
    </div>
  );
}