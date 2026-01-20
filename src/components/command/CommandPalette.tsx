import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useCommandPalette } from "./CommandPaletteProvider";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Search, Home, Calendar, Mic, Video, Mail, Users, 
  BarChart3, Settings, Sparkles, ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: any;
  category: string;
  action: () => void;
  keywords?: string[];
}

export function CommandPalette() {
  const { isOpen, close } = useCommandPalette();
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  // Define all navigable items
  const commandItems: CommandItem[] = [
    // Main Navigation
    { id: "home", label: "Dashboard", icon: Home, category: "Navigation", action: () => navigate("/") },
    { id: "my-page", label: "My Page", icon: Home, category: "Navigation", action: () => navigate("/my-page") },
    { id: "meetings", label: "Meetings", icon: Calendar, category: "Navigation", action: () => navigate("/meetings") },
    { id: "events", label: "Events", icon: Calendar, category: "Navigation", action: () => navigate("/events") },
    { id: "podcasts", label: "Podcasts", icon: Mic, category: "Navigation", action: () => navigate("/podcasts") },
    { id: "studio", label: "Studio", icon: Video, category: "Navigation", action: () => navigate("/studio") },
    { id: "media", label: "Media Library", icon: Video, category: "Navigation", action: () => navigate("/media") },
    { id: "clips", label: "Clips", icon: Video, category: "Navigation", action: () => navigate("/clips") },
    { id: "contacts", label: "Contacts", icon: Users, category: "Navigation", action: () => navigate("/contacts") },
    { id: "campaigns", label: "Email Campaigns", icon: Mail, category: "Navigation", action: () => navigate("/campaigns") },
    { id: "analytics", label: "Analytics", icon: BarChart3, category: "Navigation", action: () => navigate("/email/analytics") },
    { id: "settings", label: "Settings", icon: Settings, category: "Navigation", action: () => navigate("/settings") },
    
    // Quick Actions
    { id: "create-meeting", label: "Create Meeting", icon: Calendar, category: "Quick Actions", action: () => navigate("/meetings/create") },
    { id: "create-event", label: "Create Event", icon: Calendar, category: "Quick Actions", action: () => navigate("/events/new") },
    { id: "new-episode", label: "New Episode", icon: Mic, category: "Quick Actions", action: () => navigate("/podcasts/episodes/new") },
    { id: "new-campaign", label: "New Campaign", icon: Mail, category: "Quick Actions", action: () => navigate("/campaigns/new") },
    { id: "upload-media", label: "Upload Media", icon: Video, category: "Quick Actions", action: () => navigate("/media") },
    
    // AI Personas
    { id: "ask-mia", label: "Ask Mia (Meetings)", description: "Get help with scheduling and events", icon: Sparkles, category: "AI Assistants", action: () => console.log("Open AI with Mia") },
    { id: "ask-castor", label: "Ask Castor (Podcasts)", description: "Get help with podcast production", icon: Sparkles, category: "AI Assistants", action: () => console.log("Open AI with Castor") },
    { id: "ask-echo", label: "Ask Echo (Studio)", description: "Get help with recording", icon: Sparkles, category: "AI Assistants", action: () => console.log("Open AI with Echo") },
    { id: "ask-scribe", label: "Ask Scribe (Email)", description: "Get help with email writing", icon: Sparkles, category: "AI Assistants", action: () => console.log("Open AI with Scribe") },
    { id: "ask-atlas", label: "Ask Atlas (Analytics)", description: "Get insights on your data", icon: Sparkles, category: "AI Assistants", action: () => console.log("Open AI with Atlas") },
    { id: "ask-lex", label: "Ask Lex (Identity)", description: "Get help with rights and identity", icon: Sparkles, category: "AI Assistants", action: () => console.log("Open AI with Lex") },
  ];

  // Filter items based on search
  const filteredItems = search
    ? commandItems.filter((item) => {
        const searchLower = search.toLowerCase();
        return (
          item.label.toLowerCase().includes(searchLower) ||
          item.description?.toLowerCase().includes(searchLower) ||
          item.category.toLowerCase().includes(searchLower) ||
          item.keywords?.some((k) => k.toLowerCase().includes(searchLower))
        );
      })
    : commandItems;

  // Group items by category
  const groupedItems = filteredItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, CommandItem[]>);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, filteredItems.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const item = filteredItems[selectedIndex];
        if (item) {
          item.action();
          close();
          setSearch("");
          setSelectedIndex(0);
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, selectedIndex, filteredItems, close]);

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setSearch("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={close}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden">
        <div className="flex items-center border-b px-4 py-3">
          <Search className="h-5 w-5 text-muted-foreground mr-3" />
          <Input
            ref={inputRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search or type a command..."
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-auto p-0 text-base"
          />
          <kbd className="pointer-events-none inline-flex h-6 select-none items-center gap-1 rounded border bg-muted px-2 font-mono text-xs font-medium text-muted-foreground ml-3">
            ESC
          </kbd>
        </div>

        <ScrollArea className="max-h-[400px]">
          {Object.entries(groupedItems).map(([category, items]) => (
            <div key={category} className="p-2">
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                {category}
              </div>
              {items.map((item, idx) => {
                const globalIndex = filteredItems.indexOf(item);
                const isSelected = globalIndex === selectedIndex;
                const Icon = item.icon;

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      item.action();
                      close();
                      setSearch("");
                      setSelectedIndex(0);
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors",
                      isSelected
                        ? "bg-accent text-accent-foreground"
                        : "hover:bg-accent/50"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <div className="flex-1 text-left">
                      <div className="font-medium">{item.label}</div>
                      {item.description && (
                        <div className="text-xs text-muted-foreground">
                          {item.description}
                        </div>
                      )}
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </button>
                );
              })}
            </div>
          ))}

          {filteredItems.length === 0 && (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No results found for "{search}"
            </div>
          )}
        </ScrollArea>

        <div className="border-t px-4 py-2 text-xs text-muted-foreground flex items-center justify-between">
          <span>Use ↑↓ to navigate</span>
          <span>Press Enter to select</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
