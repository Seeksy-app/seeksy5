import { cn } from "@/lib/utils";

export type LayoutTemplate = 
  | "fullscreen" 
  | "side-by-side" 
  | "pip-bottom-right" 
  | "pip-bottom-left" 
  | "grid-2x2" 
  | "presentation" 
  | "speaker-focus" 
  | "gallery";

interface LayoutTemplatesBarProps {
  currentLayout: LayoutTemplate;
  onLayoutChange: (layout: LayoutTemplate) => void;
  sceneType?: "camera" | "media" | "countdown";
}

const LAYOUT_TEMPLATES: {
  id: LayoutTemplate;
  name: string;
  icon: React.ReactNode;
  description: string;
  sceneTypes: Array<"camera" | "media" | "countdown">;
}[] = [
  {
    id: "fullscreen",
    name: "Full Screen",
    icon: (
      <div className="w-full h-full bg-gradient-to-br from-primary/60 to-primary/40 rounded" />
    ),
    description: "Single source fills screen",
    sceneTypes: ["camera", "media", "countdown"],
  },
  {
    id: "side-by-side",
    name: "Side by Side",
    icon: (
      <div className="w-full h-full flex gap-[2px]">
        <div className="flex-1 bg-gradient-to-br from-primary/60 to-primary/40 rounded-l" />
        <div className="flex-1 bg-gradient-to-br from-blue-500/50 to-blue-600/40 rounded-r" />
      </div>
    ),
    description: "Two sources equal width",
    sceneTypes: ["camera"],
  },
  {
    id: "pip-bottom-right",
    name: "PiP Right",
    icon: (
      <div className="w-full h-full relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/50 to-primary/30 rounded" />
        <div className="absolute bottom-[2px] right-[2px] w-[35%] h-[35%] bg-gradient-to-br from-blue-500/70 to-blue-600/60 rounded shadow-sm border border-white/30" />
      </div>
    ),
    description: "Main with small overlay",
    sceneTypes: ["camera", "media"],
  },
  {
    id: "pip-bottom-left",
    name: "PiP Left",
    icon: (
      <div className="w-full h-full relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/50 to-primary/30 rounded" />
        <div className="absolute bottom-[2px] left-[2px] w-[35%] h-[35%] bg-gradient-to-br from-blue-500/70 to-blue-600/60 rounded shadow-sm border border-white/30" />
      </div>
    ),
    description: "Main with left overlay",
    sceneTypes: ["camera", "media"],
  },
  {
    id: "grid-2x2",
    name: "Grid 2×2",
    icon: (
      <div className="w-full h-full grid grid-cols-2 grid-rows-2 gap-[2px]">
        <div className="bg-gradient-to-br from-primary/50 to-primary/40 rounded-tl" />
        <div className="bg-gradient-to-br from-blue-500/50 to-blue-600/40 rounded-tr" />
        <div className="bg-gradient-to-br from-green-500/50 to-green-600/40 rounded-bl" />
        <div className="bg-gradient-to-br from-orange-500/50 to-orange-600/40 rounded-br" />
      </div>
    ),
    description: "Four equal quadrants",
    sceneTypes: ["camera"],
  },
  {
    id: "presentation",
    name: "Presentation",
    icon: (
      <div className="w-full h-full flex gap-[2px]">
        <div className="w-3/4 bg-gradient-to-br from-primary/50 to-primary/40 rounded-l" />
        <div className="w-1/4 bg-gradient-to-br from-blue-500/50 to-blue-600/40 rounded-r" />
      </div>
    ),
    description: "Content + small host",
    sceneTypes: ["camera", "media"],
  },
  {
    id: "speaker-focus",
    name: "Speaker Focus",
    icon: (
      <div className="w-full h-full flex flex-col gap-[2px]">
        <div className="flex-1 bg-gradient-to-br from-primary/50 to-primary/40 rounded-t" />
        <div className="h-1/4 flex gap-[2px]">
          <div className="flex-1 bg-gradient-to-br from-blue-500/30 to-blue-600/30 rounded-bl" />
          <div className="flex-1 bg-gradient-to-br from-green-500/30 to-green-600/30" />
          <div className="flex-1 bg-gradient-to-br from-orange-500/30 to-orange-600/30 rounded-br" />
        </div>
      </div>
    ),
    description: "Active speaker large",
    sceneTypes: ["camera"],
  },
  {
    id: "gallery",
    name: "Gallery",
    icon: (
      <div className="w-full h-full grid grid-cols-3 grid-rows-2 gap-[1px]">
        {[...Array(6)].map((_, i) => (
          <div 
            key={i} 
            className={cn(
              "bg-gradient-to-br",
              i % 3 === 0 ? "from-primary/40 to-primary/30" :
              i % 3 === 1 ? "from-blue-500/40 to-blue-600/30" :
              "from-green-500/40 to-green-600/30",
              i === 0 && "rounded-tl",
              i === 2 && "rounded-tr",
              i === 3 && "rounded-bl",
              i === 5 && "rounded-br"
            )} 
          />
        ))}
      </div>
    ),
    description: "Multiple participants",
    sceneTypes: ["camera"],
  },
];

export function LayoutTemplatesBar({ 
  currentLayout, 
  onLayoutChange, 
  sceneType = "camera" 
}: LayoutTemplatesBarProps) {
  const filteredLayouts = LAYOUT_TEMPLATES.filter(l => l.sceneTypes.includes(sceneType));

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-white/40 uppercase tracking-wider font-medium shrink-0">
        Layouts
      </span>
      
      <div className="flex items-center gap-2 overflow-x-auto">
        {filteredLayouts.map((layout) => (
          <button
            key={layout.id}
            onClick={() => onLayoutChange(layout.id)}
            className={cn(
              "flex flex-col items-center gap-1.5 p-2 rounded-lg transition-all group shrink-0",
              currentLayout === layout.id 
                ? "bg-gradient-to-br from-primary/30 to-primary/10 ring-2 ring-primary" 
                : "hover:bg-white/10"
            )}
            title={layout.description}
          >
            <div className={cn(
              "w-20 h-12 rounded border-2 transition-all overflow-hidden",
              currentLayout === layout.id 
                ? "border-primary bg-black/50" 
                : "border-white/20 bg-black/30 group-hover:border-white/40"
            )}>
              <div className="w-full h-full p-1.5">
                {layout.icon}
              </div>
            </div>
            <span className={cn(
              "text-[10px] font-medium transition-colors",
              currentLayout === layout.id ? "text-primary" : "text-white/50 group-hover:text-white/80"
            )}>
              {layout.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}