import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, ChevronUp, ChevronDown, Play, Pause } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScriptDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ScriptSection {
  id: string;
  title: string;
  content: string;
  duration: string;
}

const mockScript: ScriptSection[] = [
  {
    id: "1",
    title: "Introduction",
    content: "Welcome to today's show! I'm your host and we have an amazing lineup for you...",
    duration: "0:30"
  },
  {
    id: "2",
    title: "Sponsor Read",
    content: "Before we dive in, a quick word from our sponsor. This episode is brought to you by...",
    duration: "0:45"
  },
  {
    id: "3",
    title: "Main Topic",
    content: "Today we're discussing the latest trends in creator economy and how you can leverage them...",
    duration: "5:00"
  },
  {
    id: "4",
    title: "Closing",
    content: "Thanks for watching! Don't forget to like, subscribe, and hit that notification bell...",
    duration: "0:30"
  },
];

export function ScriptDrawer({ isOpen, onClose }: ScriptDrawerProps) {
  const [script, setScript] = useState<ScriptSection[]>(mockScript);
  const [activeSection, setActiveSection] = useState<string>("1");
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(1);

  if (!isOpen) return null;

  return (
    <div className="absolute bottom-24 left-4 right-20 h-[280px] bg-[#1a1d21]/95 backdrop-blur-sm border border-white/10 rounded-xl flex flex-col z-20 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-white/10">
        <h3 className="text-sm font-semibold text-white">Host Script</h3>
        <div className="flex items-center gap-2">
          {/* Scroll Controls */}
          <div className="flex items-center gap-1 mr-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-white/60 hover:text-white"
              onClick={() => setScrollSpeed(Math.max(0.5, scrollSpeed - 0.5))}
            >
              <ChevronDown className="w-4 h-4" />
            </Button>
            <span className="text-xs text-white/60 w-8 text-center">{scrollSpeed}x</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-white/60 hover:text-white"
              onClick={() => setScrollSpeed(Math.min(3, scrollSpeed + 0.5))}
            >
              <ChevronUp className="w-4 h-4" />
            </Button>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsScrolling(!isScrolling)}
            className={cn(
              "h-7 px-3 gap-1",
              isScrolling ? "bg-green-500/20 text-green-400" : "text-white/60"
            )}
          >
            {isScrolling ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            {isScrolling ? "Pause" : "Scroll"}
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            className="h-7 w-7 text-white/70 hover:text-white"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Section List */}
        <div className="w-48 border-r border-white/10 p-2 overflow-y-auto">
          {script.map((section, index) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={cn(
                "w-full p-2 rounded text-left mb-1 transition-all",
                activeSection === section.id
                  ? "bg-blue-500/20 text-white"
                  : "text-white/60 hover:bg-white/5"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium truncate">{section.title}</span>
                <span className="text-[10px] text-white/40">{section.duration}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Script Content */}
        <ScrollArea className="flex-1 p-4">
          {script.find(s => s.id === activeSection) && (
            <div className="space-y-2">
              <h4 className="text-lg font-semibold text-white">
                {script.find(s => s.id === activeSection)?.title}
              </h4>
              <p className="text-white/80 text-lg leading-relaxed whitespace-pre-wrap">
                {script.find(s => s.id === activeSection)?.content}
              </p>
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}
