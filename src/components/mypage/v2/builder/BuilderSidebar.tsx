import { useState } from "react";
import { User, Palette, Layers, Share2 } from "lucide-react";
import { MyPageTheme } from "@/config/myPageThemes";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ProfileSection } from "./sections/ProfileSection";
import { ThemeSection } from "./sections/ThemeSection";
import { SectionsPanel } from "./sections/SectionsPanel";
import { ShareSection } from "./sections/ShareSection";

interface BuilderSidebarProps {
  theme: MyPageTheme;
  onThemeChange: (theme: MyPageTheme) => void;
}

const navItems = [
  { id: "profile", icon: User, label: "Profile", color: "from-blue-500 to-cyan-500" },
  { id: "theme", icon: Palette, label: "Theme", color: "from-pink-500 to-purple-500" },
  { id: "sections", icon: Layers, label: "Sections", color: "from-emerald-500 to-teal-500" },
  { id: "share", icon: Share2, label: "Share", color: "from-violet-500 to-indigo-500" },
];

export function BuilderSidebar({ theme, onThemeChange }: BuilderSidebarProps) {
  const [activeSection, setActiveSection] = useState("profile");

  return (
    <div className="flex border-r bg-card">
      {/* Icon Navigation */}
      <div className="w-20 border-r flex-shrink-0">
        <div className="flex flex-col items-center py-4 gap-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all ${
                activeSection === item.id
                  ? `bg-gradient-to-br ${item.color} text-white shadow-lg scale-105`
                  : "hover:bg-muted text-muted-foreground hover:scale-105"
              }`}
              title={item.label}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[9px] font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Settings Panel */}
      <ScrollArea className="w-[420px] flex-shrink-0">
        <div className="p-6">
          {activeSection === "profile" && (
            <ProfileSection theme={theme} onUpdate={onThemeChange} />
          )}
          {activeSection === "theme" && (
            <ThemeSection theme={theme} onUpdate={onThemeChange} />
          )}
          {activeSection === "sections" && (
            <SectionsPanel theme={theme} onUpdate={onThemeChange} />
          )}
          {activeSection === "share" && (
            <ShareSection theme={theme} />
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
