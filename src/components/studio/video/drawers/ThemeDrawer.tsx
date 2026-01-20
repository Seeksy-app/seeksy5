import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Check } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface ThemeDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const themePresets = [
  { id: "air", name: "Air", color: "from-sky-400 to-blue-500" },
  { id: "base", name: "Base", color: "from-gray-600 to-gray-800" },
  { id: "news", name: "News", color: "from-red-500 to-red-700" },
  { id: "round", name: "Round", color: "from-purple-500 to-pink-500" },
];

const fontOptions = [
  { id: "default", name: "Default" },
  { id: "inter", name: "Inter" },
  { id: "roboto", name: "Roboto" },
  { id: "poppins", name: "Poppins" },
  { id: "montserrat", name: "Montserrat" },
  { id: "open-sans", name: "Open Sans" },
];

export function ThemeDrawer({ isOpen, onClose }: ThemeDrawerProps) {
  const [activeTheme, setActiveTheme] = useState("air");
  const [selectedFont, setSelectedFont] = useState("default");

  if (!isOpen) return null;

  return (
    <div className="absolute top-0 right-16 bottom-0 w-[320px] bg-[#1a1d21] border-l border-white/10 flex flex-col z-20">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <h3 className="text-lg font-semibold text-white">Theme</h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="text-white/70 hover:text-white"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      <div className="flex-1 p-4 space-y-6">
        {/* Theme Presets */}
        <div>
          <label className="text-sm text-white/60 mb-3 block">Theme Preset</label>
          <div className="grid grid-cols-2 gap-3">
            {themePresets.map(theme => (
              <button
                key={theme.id}
                onClick={() => setActiveTheme(theme.id)}
                className={cn(
                  "relative p-4 rounded-xl transition-all",
                  "bg-gradient-to-br",
                  theme.color,
                  activeTheme === theme.id
                    ? "ring-2 ring-white ring-offset-2 ring-offset-[#1a1d21]"
                    : "hover:opacity-90"
                )}
              >
                <span className="text-white font-medium text-sm">{theme.name}</span>
                {activeTheme === theme.id && (
                  <div className="absolute top-2 right-2 w-5 h-5 bg-white rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-gray-900" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Font Selection */}
        <div>
          <label className="text-sm text-white/60 mb-3 block">Font Family</label>
          <Select value={selectedFont} onValueChange={setSelectedFont}>
            <SelectTrigger className="bg-white/5 border-white/10 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1d21] border-white/10">
              {fontOptions.map(font => (
                <SelectItem
                  key={font.id}
                  value={font.id}
                  className="text-white hover:bg-white/10 focus:bg-white/10"
                >
                  {font.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Preview */}
        <div>
          <label className="text-sm text-white/60 mb-3 block">Preview</label>
          <div className={cn(
            "rounded-lg p-4 bg-gradient-to-br",
            themePresets.find(t => t.id === activeTheme)?.color
          )}>
            <div className="bg-black/40 backdrop-blur-sm rounded-lg p-3">
              <p className="text-white font-semibold text-sm">Lower Third Name</p>
              <p className="text-white/70 text-xs">Subtitle or title here</p>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="p-3 bg-white/5 rounded-lg">
          <p className="text-xs text-white/50">
            Theme settings apply to lower thirds, captions, and overlays.
          </p>
        </div>
      </div>
    </div>
  );
}
