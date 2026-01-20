import { Button } from "@/components/ui/button";
import { 
  UserPlus, Image, Type, QrCode, FileText, 
  MessageCircle, Music, Palette, HelpCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

type ToolbarTab = "graphics" | "captions" | "qr" | "notes" | "chat" | "music" | "theme" | "help";

interface VideoStudioToolbarProps {
  activeTab: ToolbarTab | null;
  onTabChange: (tab: ToolbarTab) => void;
  notificationCount?: number;
}

const toolbarItems: { id: ToolbarTab; icon: typeof Image; label: string }[] = [
  { id: "graphics", icon: Image, label: "Graphics" },
  { id: "captions", icon: Type, label: "Captions" },
  { id: "qr", icon: QrCode, label: "QR Codes" },
  { id: "notes", icon: FileText, label: "Notes" },
  { id: "chat", icon: MessageCircle, label: "Chat" },
  { id: "music", icon: Music, label: "Music" },
  { id: "theme", icon: Palette, label: "Theme" },
  { id: "help", icon: HelpCircle, label: "Help" },
];

export function VideoStudioToolbar({
  activeTab,
  onTabChange,
  notificationCount = 0,
}: VideoStudioToolbarProps) {
  return (
    <aside className="w-16 bg-[#16181c] border-l border-white/10 flex flex-col items-center py-4">
      {/* Invite Guest Button */}
      <Button
        variant="ghost"
        size="icon"
        className="h-10 w-10 rounded-full mb-4 text-white/60 hover:text-white hover:bg-white/10"
      >
        <UserPlus className="w-5 h-5" />
      </Button>

      {/* Divider */}
      <div className="w-8 h-px bg-white/10 mb-4" />

      {/* Tool Buttons */}
      <div className="flex-1 flex flex-col items-center gap-1">
        {toolbarItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <Button
              key={item.id}
              variant="ghost"
              size="sm"
              onClick={() => onTabChange(item.id)}
              className={cn(
                "h-auto w-12 flex flex-col items-center gap-1 py-2 px-1",
                "rounded-lg transition-all",
                isActive 
                  ? "bg-white/10 text-white" 
                  : "text-white/50 hover:text-white hover:bg-white/5"
              )}
            >
              <div className="relative">
                <item.icon className="w-5 h-5" />
                {item.id === "help" && notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center">
                    {notificationCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] leading-tight">{item.label}</span>
            </Button>
          );
        })}
      </div>
    </aside>
  );
}
