import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Search, X, Loader2, Hash, Calendar, Users, FileText, Mail, Video, Mic, DollarSign, Settings, Zap } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";

interface SearchResult {
  id: string;
  type: "contact" | "meeting" | "podcast" | "clip" | "module" | "command" | "email";
  title: string;
  subtitle?: string;
  route: string;
  enabled?: boolean;
}

const iconMap = {
  contact: Users,
  meeting: Calendar,
  podcast: Hash,
  clip: FileText,
  email: Mail,
  module: Zap,
  command: Zap,
};

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Determine if we're in admin context to keep navigation within admin routes
  const isAdminContext = location.pathname.startsWith('/admin');

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const searchData = async () => {
      if (query.trim().length === 0) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      const lowerQuery = query.toLowerCase();
      const allResults: SearchResult[] = [];

      try {
        // Search modules
        const modules = [
          { title: "Inbox", route: "/email", keywords: ["email", "inbox", "mail"] },
          { title: "Contacts & Audience", route: "/audience", keywords: ["contacts", "audience", "people"] },
          { title: "Content & Media", route: "/content", keywords: ["content", "media", "video", "podcast"] },
          { title: "Meetings", route: "/meetings", keywords: ["meetings", "calendar", "schedule"] },
          { title: "Monetization Hub", route: "/monetization", keywords: ["monetization", "ads", "revenue"] },
          { title: "Settings", route: "/settings", keywords: ["settings", "preferences", "account"] },
          { title: "Podcast Studio", route: "/studio/podcast", keywords: ["podcast", "studio", "recording"] },
          { title: "Video Studio", route: "/studio/video", keywords: ["video", "studio", "recording"] },
          { title: "AI Clips", route: "/clips", keywords: ["clips", "ai", "editing"] },
          { title: "Media Library", route: "/media/library", keywords: ["media", "library", "files"] },
          { title: "Email Campaigns", route: "/email-campaigns", keywords: ["campaigns", "email", "marketing"] },
          { title: "Templates", route: "/email-templates", keywords: ["templates", "email"] },
          { title: "Segments", route: "/email-segments", keywords: ["segments", "audience"] },
        ];

        modules.forEach((module) => {
          if (module.keywords.some(k => k.includes(lowerQuery)) || module.title.toLowerCase().includes(lowerQuery)) {
            allResults.push({
              id: module.route,
              type: "module",
              title: module.title,
              subtitle: "Go to module",
              route: module.route,
              enabled: true,
            });
          }
        });

        // Search commands
        const commands = [
          { title: "Create Email", route: "/email?compose=true", keywords: ["create", "email", "compose", "new"] },
          { title: "Create Meeting", route: "/meetings?create=true", keywords: ["create", "meeting", "schedule"] },
          { title: "Upload Media", route: "/content?upload=true", keywords: ["upload", "media", "video"] },
          { title: "Create Clip", route: "/clips?create=true", keywords: ["create", "clip", "ai"] },
        ];

        commands.forEach((command) => {
          if (command.keywords.some(k => k.includes(lowerQuery)) || command.title.toLowerCase().includes(lowerQuery)) {
            allResults.push({
              id: command.route,
              type: "command",
              title: command.title,
              subtitle: "Quick action",
              route: command.route,
              enabled: true,
            });
          }
        });

        // Search contacts
        const { data: contacts } = await supabase
          .from("contacts")
          .select("id, name, email")
          .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
          .limit(5);

        if (contacts) {
          allResults.push(
            ...contacts.map((c) => ({
              id: c.id,
              type: "contact" as const,
              title: c.name || "Unnamed",
              subtitle: c.email,
              // Stay in admin context if currently in admin routes
              route: isAdminContext ? `/admin/contacts/${c.id}` : `/contacts/${c.id}`,
              enabled: true,
            }))
          );
        }

        // Search meetings
        const { data: meetings } = await supabase
          .from("meetings")
          .select("id, title")
          .ilike("title", `%${query}%`)
          .limit(5);

        if (meetings) {
          allResults.push(
            ...meetings.map((m) => ({
              id: m.id,
              type: "meeting" as const,
              title: m.title,
              subtitle: "Meeting",
              route: isAdminContext ? `/admin/meetings/${m.id}` : `/meetings/${m.id}`,
              enabled: true,
            }))
          );
        }

        // Search podcasts
        const { data: podcasts } = await supabase
          .from("podcasts")
          .select("id, title")
          .ilike("title", `%${query}%`)
          .limit(5);

        if (podcasts) {
          allResults.push(
            ...podcasts.map((p) => ({
              id: p.id,
              type: "podcast" as const,
              title: p.title,
              subtitle: "Podcast",
              route: `/podcasts/${p.id}`,
              enabled: true,
            }))
          );
        }

        // Search clips
        const { data: clips } = await supabase
          .from("clips")
          .select("id, title")
          .ilike("title", `%${query}%`)
          .limit(5);

        if (clips) {
          allResults.push(
            ...clips.map((c) => ({
              id: c.id,
              type: "clip" as const,
              title: c.title || "Untitled Clip",
              subtitle: "AI Clip",
              route: `/clips/${c.id}`,
              enabled: true,
            }))
          );
        }

        setResults(allResults);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchData, 300);
    return () => clearTimeout(debounceTimer);
  }, [query]);

  const handleResultClick = (route: string, enabled: boolean = true) => {
    if (!enabled) return;
    navigate(route);
    setIsOpen(false);
    setQuery("");
  };

  // Group results by type
  const groupedResults = results.reduce((acc, result) => {
    const type = result.type;
    if (!acc[type]) acc[type] = [];
    acc[type].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  const typeLabels: Record<string, string> = {
    contact: "Contacts",
    email: "Emails",
    meeting: "Meetings",
    podcast: "Podcasts",
    clip: "Media",
    module: "Modules",
    command: "Quick Actions",
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search everything..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="pl-9 pr-9 bg-white text-foreground rounded-full border-0 focus-visible:ring-2 focus-visible:ring-white/50 transition-all shadow-sm"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
        )}
      </div>

      {isOpen && results.length > 0 && (
        <Card className="absolute top-full mt-2 w-full max-h-[480px] overflow-y-auto shadow-xl z-50 border rounded-xl bg-background">
          <div className="p-2">
            {Object.entries(groupedResults).map(([type, items]) => (
              <div key={type} className="mb-4 last:mb-0">
                <div className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {typeLabels[type] || type}
                </div>
                <div className="space-y-1">
                  {items.slice(0, 3).map((result) => {
                    const Icon = iconMap[result.type];
                    const enabled = result.enabled !== false;
                    return (
                      <button
                        key={`${result.type}-${result.id}`}
                        onClick={() => handleResultClick(result.route, enabled)}
                        disabled={!enabled}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left group ${
                          enabled 
                            ? 'hover:bg-primary/8 cursor-pointer' 
                            : 'opacity-50 cursor-not-allowed'
                        }`}
                      >
                        <div className="flex-shrink-0">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`text-sm font-semibold truncate ${
                            enabled 
                              ? 'text-foreground group-hover:text-primary transition-colors' 
                              : 'text-muted-foreground'
                          }`}>
                            {result.title}
                          </div>
                          {result.subtitle && (
                            <div className="text-xs text-muted-foreground truncate">
                              {result.subtitle}
                            </div>
                          )}
                          {!enabled && (
                            <div className="text-xs text-destructive mt-1">
                              This module is not active yet
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                  {items.length > 3 && (
                    <button
                      onClick={() => handleResultClick(`/${type}s`)}
                      className="w-full px-3 py-2 text-xs text-primary hover:text-primary/80 transition-colors text-left font-medium"
                    >
                      View all {items.length} {typeLabels[type]?.toLowerCase() || type}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {isOpen && query.length >= 2 && !isLoading && results.length === 0 && (
        <Card className="absolute top-full mt-2 w-full p-6 shadow-xl z-50 border rounded-xl bg-background">
          <p className="text-sm text-muted-foreground text-center">No results found</p>
        </Card>
      )}
    </div>
  );
}
