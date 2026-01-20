import { Button } from "@/components/ui/button";
import { 
  UserPlus, Image, Type, QrCode, FileText, 
  MessageCircle, Music, Palette, HelpCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

export type ToolbarTab = "graphics" | "captions" | "qr" | "notes" | "chat" | "music" | "theme" | "help";

interface VideoStudioToolbarEnhancedProps {
  activeTab: ToolbarTab | null;
  onTabChange: (tab: ToolbarTab | null) => void;
  onInviteGuest: () => void;
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

export function VideoStudioToolbarEnhanced({
  activeTab,
  onTabChange,
  onInviteGuest,
  notificationCount = 0,
}: VideoStudioToolbarEnhancedProps) {
  const handleTabClick = (tab: ToolbarTab) => {
    if (activeTab === tab) {
      onTabChange(null);
    } else {
      onTabChange(tab);
    }
  };

  return (
    <aside className="w-16 bg-[#16181c] border-l border-white/10 flex flex-col items-center py-4">
      {/* Invite Guest Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onInviteGuest}
        className="h-12 w-12 rounded-full mb-2 text-white/60 hover:text-white hover:bg-white/10 ring-2 ring-blue-500/50"
      >
        <UserPlus className="w-5 h-5" />
      </Button>

      {/* User Avatar */}
      <div className="w-12 h-12 rounded-full mb-6 bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center border-2 border-green-500 overflow-hidden">
        <span className="text-white font-bold text-sm">S</span>
      </div>

      {/* Divider */}
      <div className="w-10 h-px bg-white/10 mb-4" />

      {/* Tool Buttons */}
      <div className="flex-1 flex flex-col items-center gap-1">
        {toolbarItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <Button
              key={item.id}
              variant="ghost"
              size="sm"
              onClick={() => handleTabClick(item.id)}
              className={cn(
                "h-auto w-14 flex flex-col items-center gap-1 py-2 px-1",
                "rounded-lg transition-all",
                isActive 
                  ? "bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/50" 
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
