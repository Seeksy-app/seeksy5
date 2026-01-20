import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  X, Plus, ChevronDown, ChevronRight, 
  Palette, Info, Trash2, Play, Upload,
  Check, CornerUpLeft, CornerUpRight, CornerDownLeft, CornerDownRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface GraphicsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface GraphicItem {
  id: string;
  name: string;
  url: string;
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
}

export function GraphicsDrawer({ isOpen, onClose }: GraphicsDrawerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadSection, setUploadSection] = useState<string | null>(null);
  
  const [expandedSections, setExpandedSections] = useState<string[]>(["logo", "overlay", "clips", "background"]);
  
  // State for each section
  const [logos, setLogos] = useState<GraphicItem[]>([]);
  const [overlays, setOverlays] = useState<GraphicItem[]>([]);
  const [videoClips, setVideoClips] = useState<GraphicItem[]>([]);
  const [backgrounds, setBackgrounds] = useState<GraphicItem[]>([]);
  
  // Active items
  const [activeLogo, setActiveLogo] = useState<string | null>(null);
  const [activeOverlay, setActiveOverlay] = useState<string | null>(null);
  const [activeBackground, setActiveBackground] = useState<string | null>(null);
  const [selectedLogoPosition, setSelectedLogoPosition] = useState<GraphicItem["position"]>("top-right");

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const handleUpload = (section: string) => {
    setUploadSection(section);
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadSection) return;

    const url = URL.createObjectURL(file);
    const newItem: GraphicItem = {
      id: `${uploadSection}-${Date.now()}`,
      name: file.name,
      url,
      position: uploadSection === "logo" ? selectedLogoPosition : undefined,
    };

    switch (uploadSection) {
      case "logo":
        setLogos(prev => [...prev, newItem]);
        break;
      case "overlay":
        setOverlays(prev => [...prev, newItem]);
        break;
      case "clips":
        setVideoClips(prev => [...prev, newItem]);
        break;
      case "background":
        setBackgrounds(prev => [...prev, newItem]);
        break;
    }

    toast.success(`${file.name} uploaded successfully`);
    e.target.value = "";
    setUploadSection(null);
  };

  const handleDelete = (section: string, id: string) => {
    switch (section) {
      case "logo":
        setLogos(prev => prev.filter(item => item.id !== id));
        if (activeLogo === id) setActiveLogo(null);
        break;
      case "overlay":
        setOverlays(prev => prev.filter(item => item.id !== id));
        if (activeOverlay === id) setActiveOverlay(null);
        break;
      case "clips":
        setVideoClips(prev => prev.filter(item => item.id !== id));
        break;
      case "background":
        setBackgrounds(prev => prev.filter(item => item.id !== id));
        if (activeBackground === id) setActiveBackground(null);
        break;
    }
    toast.success("Item deleted");
  };

  const handlePlayClip = (clip: GraphicItem) => {
    toast.success(`Playing "${clip.name}" to canvas`);
  };

  const positionIcons = {
    "top-left": CornerUpLeft,
    "top-right": CornerUpRight,
    "bottom-left": CornerDownLeft,
    "bottom-right": CornerDownRight,
  };

  if (!isOpen) return null;

  return (
    <div className="absolute top-0 right-16 bottom-0 w-[380px] bg-[#1a1d21] border-l border-white/10 flex flex-col z-20">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <h3 className="text-lg font-semibold text-white">Graphics</h3>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="text-white/70 hover:text-white gap-1.5 h-8">
            <Palette className="w-4 h-4" />
            Theme
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            className="text-white/70 hover:text-white h-8 w-8"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-5">
          {/* Logo Section */}
          <div>
            <button
              onClick={() => toggleSection("logo")}
              className="flex items-center gap-2 w-full text-left mb-3"
            >
              {expandedSections.includes("logo") ? (
                <ChevronDown className="w-4 h-4 text-white/60" />
              ) : (
                <ChevronRight className="w-4 h-4 text-white/60" />
              )}
              <span className="text-white font-medium">Logo</span>
              <span className="text-white/40 text-xs">({logos.length})</span>
            </button>
            
            {expandedSections.includes("logo") && (
              <>
                {/* Position selector */}
                <div className="mb-3">
                  <p className="text-xs text-white/50 mb-2">Position</p>
                  <div className="grid grid-cols-4 gap-1.5">
                    {(Object.keys(positionIcons) as Array<keyof typeof positionIcons>).map(pos => {
                      const Icon = positionIcons[pos];
                      return (
                        <button
                          key={pos}
                          onClick={() => setSelectedLogoPosition(pos)}
                          className={cn(
                            "flex items-center justify-center h-8 rounded border transition-all",
                            selectedLogoPosition === pos
                              ? "border-primary bg-primary/20 text-primary"
                              : "border-white/10 text-white/60 hover:border-white/30 hover:text-white/80"
                          )}
                        >
                          <Icon className="w-4 h-4" />
                        </button>
                      );
                    })}
                  </div>
                </div>
                
                {logos.length === 0 ? (
                  <button 
                    onClick={() => handleUpload("logo")}
                    className="w-full h-20 rounded-lg border-2 border-dashed border-white/20 flex flex-col items-center justify-center text-white/40 hover:text-white/60 hover:border-white/40 transition-all"
                  >
                    <Upload className="w-6 h-6 mb-1" />
                    <span className="text-xs">Upload Logo</span>
                  </button>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {logos.map(logo => (
                      <div
                        key={logo.id}
                        className={cn(
                          "relative aspect-square rounded-lg border-2 p-2 transition-all group cursor-pointer",
                          activeLogo === logo.id
                            ? "border-primary bg-primary/10"
                            : "border-white/10 bg-white/5 hover:bg-white/10"
                        )}
                        onClick={() => setActiveLogo(activeLogo === logo.id ? null : logo.id)}
                      >
                        <img src={logo.url} alt={logo.name} className="w-full h-full object-contain" />
                        {activeLogo === logo.id && (
                          <div className="absolute top-1 right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 text-white" />
                          </div>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete("logo", logo.id); }}
                          className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hidden group-hover:flex"
                        >
                          <Trash2 className="w-3 h-3 text-white" />
                        </button>
                      </div>
                    ))}
                    <button 
                      onClick={() => handleUpload("logo")}
                      className="aspect-square rounded-lg border-2 border-dashed border-white/20 flex items-center justify-center text-white/40 hover:text-white/60 hover:border-white/40 transition-all"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Overlay Section */}
          <div>
            <button
              onClick={() => toggleSection("overlay")}
              className="flex items-center gap-2 w-full text-left mb-3"
            >
              {expandedSections.includes("overlay") ? (
                <ChevronDown className="w-4 h-4 text-white/60" />
              ) : (
                <ChevronRight className="w-4 h-4 text-white/60" />
              )}
              <span className="text-white font-medium">Overlays</span>
              <span className="text-white/40 text-xs">({overlays.length})</span>
              <Info className="w-3.5 h-3.5 text-white/30 ml-auto" />
            </button>
            
            {expandedSections.includes("overlay") && (
              overlays.length === 0 ? (
                <button 
                  onClick={() => handleUpload("overlay")}
                  className="w-full h-20 rounded-lg border-2 border-dashed border-white/20 flex flex-col items-center justify-center text-white/40 hover:text-white/60 hover:border-white/40 transition-all"
                >
                  <Upload className="w-6 h-6 mb-1" />
                  <span className="text-xs">Add Overlay</span>
                </button>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {overlays.map(overlay => (
                    <div
                      key={overlay.id}
                      className={cn(
                        "relative aspect-video rounded-lg border-2 overflow-hidden transition-all group cursor-pointer",
                        activeOverlay === overlay.id
                          ? "border-primary ring-2 ring-primary/30"
                          : "border-white/10 hover:border-white/30"
                      )}
                      onClick={() => setActiveOverlay(activeOverlay === overlay.id ? null : overlay.id)}
                    >
                      <img src={overlay.url} alt={overlay.name} className="w-full h-full object-cover" />
                      {activeOverlay === overlay.id && (
                        <div className="absolute top-1 right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 text-white" />
                        </div>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete("overlay", overlay.id); }}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hidden group-hover:flex"
                      >
                        <Trash2 className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  ))}
                  <button 
                    onClick={() => handleUpload("overlay")}
                    className="aspect-video rounded-lg border-2 border-dashed border-white/20 flex items-center justify-center text-white/40 hover:text-white/60 hover:border-white/40 transition-all"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              )
            )}
          </div>

          {/* Video Clips Section */}
          <div>
            <button
              onClick={() => toggleSection("clips")}
              className="flex items-center gap-2 w-full text-left mb-3"
            >
              {expandedSections.includes("clips") ? (
                <ChevronDown className="w-4 h-4 text-white/60" />
              ) : (
                <ChevronRight className="w-4 h-4 text-white/60" />
              )}
              <span className="text-white font-medium">Video Clips</span>
              <span className="text-white/40 text-xs">(Intro, Stingers, Ads)</span>
            </button>
            
            {expandedSections.includes("clips") && (
              videoClips.length === 0 ? (
                <button 
                  onClick={() => handleUpload("clips")}
                  className="w-full h-20 rounded-lg border-2 border-dashed border-white/20 flex flex-col items-center justify-center text-white/40 hover:text-white/60 hover:border-white/40 transition-all"
                >
                  <Upload className="w-6 h-6 mb-1" />
                  <span className="text-xs">Add Video Clip</span>
                </button>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {videoClips.map(clip => (
                    <div
                      key={clip.id}
                      className="relative aspect-video rounded-lg border-2 border-white/10 overflow-hidden group"
                    >
                      <video src={clip.url} className="w-full h-full object-cover" muted />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          onClick={() => handlePlayClip(clip)}
                          className="w-8 h-8 bg-primary rounded-full flex items-center justify-center hover:bg-primary/80 transition-colors"
                        >
                          <Play className="w-4 h-4 text-white ml-0.5" />
                        </button>
                        <button
                          onClick={() => handleDelete("clips", clip.id)}
                          className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-white" />
                        </button>
                      </div>
                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-1.5">
                        <p className="text-[10px] text-white truncate">{clip.name}</p>
                      </div>
                    </div>
                  ))}
                  <button 
                    onClick={() => handleUpload("clips")}
                    className="aspect-video rounded-lg border-2 border-dashed border-white/20 flex flex-col items-center justify-center text-white/40 hover:text-white/60 hover:border-white/40 transition-all"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              )
            )}
          </div>

          {/* Background Section */}
          <div>
            <button
              onClick={() => toggleSection("background")}
              className="flex items-center gap-2 w-full text-left mb-3"
            >
              {expandedSections.includes("background") ? (
                <ChevronDown className="w-4 h-4 text-white/60" />
              ) : (
                <ChevronRight className="w-4 h-4 text-white/60" />
              )}
              <span className="text-white font-medium">Backgrounds</span>
              <span className="text-white/40 text-xs">({backgrounds.length})</span>
            </button>
            
            {expandedSections.includes("background") && (
              backgrounds.length === 0 ? (
                <button 
                  onClick={() => handleUpload("background")}
                  className="w-full h-20 rounded-lg border-2 border-dashed border-white/20 flex flex-col items-center justify-center text-white/40 hover:text-white/60 hover:border-white/40 transition-all"
                >
                  <Upload className="w-6 h-6 mb-1" />
                  <span className="text-xs">Add Background</span>
                </button>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {backgrounds.map(bg => (
                    <div
                      key={bg.id}
                      className={cn(
                        "relative aspect-video rounded-lg border-2 overflow-hidden transition-all cursor-pointer group",
                        activeBackground === bg.id
                          ? "border-primary ring-2 ring-primary/30"
                          : "border-white/10 hover:border-white/30"
                      )}
                      onClick={() => setActiveBackground(activeBackground === bg.id ? null : bg.id)}
                    >
                      <img src={bg.url} alt={bg.name} className="w-full h-full object-cover" />
                      {activeBackground === bg.id && (
                        <div className="absolute top-1 right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 text-white" />
                        </div>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete("background", bg.id); }}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hidden group-hover:flex"
                      >
                        <Trash2 className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  ))}
                  <button 
                    onClick={() => handleUpload("background")}
                    className="aspect-video rounded-lg border-2 border-dashed border-white/20 flex items-center justify-center text-white/40 hover:text-white/60 hover:border-white/40 transition-all"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              )
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
