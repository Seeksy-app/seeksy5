import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { 
  Search, FileText, Calendar, Mail, Users, Megaphone, Ticket, Image, Radio, 
  ClipboardList, Award, DollarSign, FileSpreadsheet, Newspaper, Smartphone, 
  User, Settings, LayoutDashboard, Inbox, CreditCard, MessageCircle, CalendarCheck,
  Link, Clock, Flag, Sliders, Trophy, Target, Calculator, Send, GitBranch, Palette,
  Tv, BookOpen, Library, Folder, Video, Bot, Headphones, ShieldCheck, Fingerprint,
  UserCog, Rss, Brain, Globe, Puzzle, Key, Webhook, ScrollText, Network, Activity,
  DatabaseBackup, HelpCircle, LayoutGrid, Wrench, ListTodo, PenTool, Package,
  TrendingUp, BarChart2, UserPlus, CheckSquare
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { NAVIGATION_CONFIG } from "@/config/navigation";

interface SearchResult {
  id: string;
  title: string;
  type: string;
  category: string;
  url: string;
  icon: any;
  description?: string;
}

interface GroupedResults {
  [category: string]: SearchResult[];
}

// Icon mapping from string names to components
const iconMap: Record<string, any> = {
  "layout-dashboard": LayoutDashboard,
  "inbox": Inbox,
  "mail": Mail,
  "pen-tool": PenTool,
  "megaphone": Megaphone,
  "dollar-sign": DollarSign,
  "radio": Radio,
  "package": Package,
  "trending-up": TrendingUp,
  "bar-chart-2": BarChart2,
  "user-plus": UserPlus,
  "users": Users,
  "globe": Globe,
  "credit-card": CreditCard,
  "message-circle": MessageCircle,
  "calendar-check": CalendarCheck,
  "calendar": Calendar,
  "link": Link,
  "clock": Clock,
  "settings": Settings,
  "flag": Flag,
  "sliders": Sliders,
  "trophy": Trophy,
  "target": Target,
  "file-spreadsheet": FileSpreadsheet,
  "calculator": Calculator,
  "send": Send,
  "git-branch": GitBranch,
  "search": Search,
  "image": Image,
  "layout": LayoutDashboard,
  "palette": Palette,
  "tv": Tv,
  "book-open": BookOpen,
  "library": Library,
  "settings-2": Settings,
  "folder": Folder,
  "video": Video,
  "bot": Bot,
  "headphones": Headphones,
  "shield-check": ShieldCheck,
  "fingerprint": Fingerprint,
  "user-cog": UserCog,
  "rss": Rss,
  "brain": Brain,
  "puzzle": Puzzle,
  "key": Key,
  "webhook": Webhook,
  "scroll-text": ScrollText,
  "network": Network,
  "activity": Activity,
  "database-backup": DatabaseBackup,
  "help-circle": HelpCircle,
  "layout-grid": LayoutGrid,
  "wrench": Wrench,
  "list-todo": ListTodo,
  "gantt-chart": BarChart2,
  "file-text": FileText,
  "check-square": CheckSquare,
};

export const MasterSearch = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [flatResults, setFlatResults] = useState<SearchResult[]>([]);
  const [isAISearching, setIsAISearching] = useState(false);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  // Build searchable pages from navigation config + static pages
  const staticPages: SearchResult[] = useMemo(() => {
    const pages: SearchResult[] = [];
    
    // Add all pages from navigation config
    NAVIGATION_CONFIG.navigation.forEach(group => {
      group.items.forEach(item => {
        const IconComponent = iconMap[item.icon] || FileText;
        pages.push({
          id: item.id,
          title: item.label,
          type: "Page",
          category: group.group,
          url: item.path,
          icon: IconComponent,
          description: item.description,
        });
      });
    });

    // Add additional pages not in admin nav
    const additionalPages: SearchResult[] = [
      { id: "tasks", title: "Tasks", type: "Page", category: "Project Management", url: "/tasks", icon: ListTodo, description: "Task management" },
      { id: "creator-dashboard", title: "Creator Dashboard", type: "Page", category: "Creator", url: "/dashboard", icon: LayoutDashboard },
      { id: "meetings", title: "Meetings", type: "Page", category: "Pages", url: "/meetings", icon: Calendar },
      { id: "events", title: "Events", type: "Page", category: "Pages", url: "/events", icon: Calendar },
      { id: "marketing", title: "Marketing", type: "Page", category: "Marketing", url: "/marketing", icon: Megaphone },
      { id: "crm", title: "CRM & Contacts", type: "Page", category: "Pages", url: "/crm", icon: Users },
      { id: "podcasts", title: "Podcasts", type: "Page", category: "Media", url: "/podcasts", icon: Radio },
      { id: "awards", title: "Awards", type: "Page", category: "Pages", url: "/awards", icon: Award },
      { id: "blog", title: "Blog", type: "Page", category: "Content", url: "/blog", icon: Newspaper },
      { id: "profile", title: "Profile Settings", type: "Page", category: "Settings", url: "/profile-settings", icon: User },
      { id: "app-audio", title: "App Audio", type: "Page", category: "Marketing", url: "/marketing/app-audio", icon: Megaphone, description: "Manage app audio descriptions" },
      { id: "board-dashboard", title: "Board Dashboard", type: "Page", category: "Board Portal", url: "/board", icon: LayoutDashboard },
      { id: "board-proforma", title: "Board Pro Forma", type: "Page", category: "Board Portal", url: "/board/proforma", icon: DollarSign },
      { id: "board-gtm", title: "Board GTM Strategy", type: "Page", category: "Board Portal", url: "/board/gtm", icon: Target },
      { id: "veterans", title: "Veteran Benefits", type: "Page", category: "Veterans", url: "/yourbenefits", icon: Users },
      { id: "veterans-claims", title: "Veteran Claims Agent", type: "Page", category: "Veterans", url: "/yourbenefits/claims-agent", icon: MessageCircle },
    ];

    // Add additional pages, avoiding duplicates
    additionalPages.forEach(page => {
      if (!pages.find(p => p.url === page.url)) {
        pages.push(page);
      }
    });

    return pages;
  }, []);

  useEffect(() => {
    const searchContent = async () => {
      if (!searchQuery.trim() || !user) {
        setResults([]);
        return;
      }

      const query = searchQuery.toLowerCase();
      
      // Filter static pages - search by title, type, category, and description
      const pageResults = staticPages.filter(page => 
        page.title.toLowerCase().includes(query) ||
        page.type.toLowerCase().includes(query) ||
        page.category.toLowerCase().includes(query) ||
        (page.description && page.description.toLowerCase().includes(query))
      );

      // Try AI search for better results
      setIsAISearching(true);
      try {
        const { data: aiData, error: aiError } = await supabase.functions.invoke("ai-admin-search", {
          body: { query: searchQuery, searchType: "all" },
        });

        if (!aiError && aiData?.results?.length > 0) {
          // Convert AI results to SearchResult format
          const aiResults: SearchResult[] = aiData.results.map((result: any) => ({
            id: result.id,
            title: result.name,
            type: result.type === 'profile' ? 'Creator' : result.type === 'contact' ? 'Contact' : result.type === 'meeting' ? 'Meeting' : 'Ticket',
            category: result.type === 'profile' ? 'Creators' : result.type === 'contact' ? 'Contacts' : result.type === 'meeting' ? 'Meetings' : 'Tickets',
            url: result.type === 'profile' ? '/admin/creators' : result.type === 'contact' ? '/crm' : result.type === 'meeting' ? '/meetings' : '/project-management',
            icon: result.type === 'profile' ? Users : result.type === 'contact' ? Users : result.type === 'meeting' ? Calendar : Ticket,
            description: result.matchReason,
          }));

          const allResults = [...pageResults, ...aiResults];
          const limitedResults = allResults.slice(0, 15);
          setResults(limitedResults);
          setFlatResults(limitedResults);
          setSelectedIndex(0);
          setIsAISearching(false);
          return;
        }
      } catch (error) {
        console.error("AI search error:", error);
      }
      setIsAISearching(false);

      // Fallback to basic search
      // Search contacts
      const { data: contacts } = await supabase
        .from("contacts")
        .select("id, name, email")
        .eq("user_id", user.id)
        .or(`name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
        .limit(5);

      const contactResults: SearchResult[] = (contacts || []).map(contact => ({
        id: contact.id,
        title: contact.name,
        type: "Contact",
        category: "Contacts",
        url: "/crm",
        icon: Users,
        description: contact.email,
      }));

      // Search tickets
      const { data: tickets } = await supabase
        .from("tickets")
        .select("id, title, ticket_number")
        .eq("user_id", user.id)
        .or(`title.ilike.%${searchQuery}%,ticket_number.ilike.%${searchQuery}%`)
        .limit(5);

      const ticketResults: SearchResult[] = (tickets || []).map(ticket => ({
        id: ticket.id,
        title: ticket.title,
        type: "Ticket",
        category: "Tickets",
        url: "/project-management",
        icon: Ticket,
        description: ticket.ticket_number,
      }));

      // Search meetings with attendees
      const { data: meetings } = await supabase
        .from("meetings")
        .select(`
          id, 
          title, 
          start_time,
          meeting_attendees (
            attendee_name
          )
        `)
        .eq("user_id", user.id)
        .ilike('title', `%${searchQuery}%`)
        .limit(5);

      const meetingResults: SearchResult[] = (meetings || []).map(meeting => {
        const firstAttendee = (meeting.meeting_attendees as any)?.[0];
        return {
          id: meeting.id,
          title: meeting.title,
          type: "Meeting",
          category: "Meetings",
          url: "/meetings",
          icon: Calendar,
          description: firstAttendee ? `with ${firstAttendee.attendee_name}` : 'Meeting',
        };
      });

      // Search events
      const { data: events } = await supabase
        .from("events")
        .select("id, title")
        .eq("user_id", user.id)
        .ilike("title", `%${searchQuery}%`)
        .limit(5);

      const eventResults: SearchResult[] = (events || []).map(event => ({
        id: event.id,
        title: event.title,
        type: "Event",
        category: "Events",
        url: "/events",
        icon: Calendar,
      }));

      // Search podcasts
      const { data: podcasts } = await supabase
        .from("podcasts")
        .select("id, title")
        .eq("user_id", user.id)
        .ilike("title", `%${searchQuery}%`)
        .limit(5);

      const podcastResults: SearchResult[] = (podcasts || []).map(podcast => ({
        id: podcast.id,
        title: podcast.title,
        type: "Podcast",
        category: "Media",
        url: "/podcasts",
        icon: Radio,
      }));

      // Search blog posts
      const { data: posts } = await supabase
        .from("blog_posts")
        .select("id, title")
        .eq("user_id", user.id)
        .ilike("title", `%${searchQuery}%`)
        .limit(5);

      const blogResults: SearchResult[] = (posts || []).map(post => ({
        id: post.id,
        title: post.title,
        type: "Blog Post",
        category: "Content",
        url: "/blog",
        icon: Newspaper,
      }));

      // Combine all results
      const allResults = [
        ...pageResults,
        ...contactResults,
        ...ticketResults,
        ...meetingResults,
        ...eventResults,
        ...podcastResults,
        ...blogResults,
      ];

      const limitedResults = allResults.slice(0, 15);
      setResults(limitedResults);
      setFlatResults(limitedResults);
      setSelectedIndex(0);
    };

    const debounce = setTimeout(() => {
      searchContent();
    }, 300);

    return () => clearTimeout(debounce);
  }, [searchQuery, user]);

  const handleResultClick = useCallback((result: SearchResult) => {
    navigate(result.url);
    setSearchQuery("");
    setIsOpen(false);
    setSelectedIndex(0);
  }, [navigate]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen || flatResults.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, flatResults.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
        break;
      case "Enter":
        e.preventDefault();
        if (flatResults[selectedIndex]) {
          handleResultClick(flatResults[selectedIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        inputRef.current?.blur();
        break;
    }
  }, [isOpen, flatResults, selectedIndex, handleResultClick]);

  // Group results by category
  const groupedResults: GroupedResults = results.reduce((acc, result) => {
    const category = result.category || "Other";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(result);
    return acc;
  }, {} as GroupedResults);

  return (
    <div className="relative w-full max-w-2xl">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search anything... (contacts, meetings, events, pages) - AI powered"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          onKeyDown={handleKeyDown}
          className="pl-10 pr-4 h-11 bg-background/80 backdrop-blur-sm border-muted-foreground/20"
        />
      </div>

      {isOpen && searchQuery && results.length > 0 && (
        <Card ref={resultsRef} className="absolute top-full mt-2 w-full z-50 shadow-xl border-muted-foreground/20">
          <ScrollArea className="max-h-[500px]">
            <div className="p-2">
              {Object.entries(groupedResults).map(([category, categoryResults], categoryIndex) => (
                <div key={category}>
                  {categoryIndex > 0 && <Separator className="my-2" />}
                  <div className="px-2 py-1.5">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {category}
                    </p>
                  </div>
                  <div className="space-y-1">
                    {categoryResults.map((result, index) => {
                      const Icon = result.icon;
                      const globalIndex = flatResults.indexOf(result);
                      const isSelected = globalIndex === selectedIndex;
                      
                      return (
                        <button
                          key={result.id}
                          onClick={() => handleResultClick(result)}
                          className={cn(
                            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left",
                            "focus:outline-none",
                            isSelected 
                              ? "bg-primary/10 border border-primary/20" 
                              : "hover:bg-muted/50"
                          )}
                        >
                          <div className={cn(
                            "flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center",
                            isSelected ? "bg-primary/20" : "bg-muted"
                          )}>
                            <Icon className={cn(
                              "h-4 w-4",
                              isSelected ? "text-primary" : "text-muted-foreground"
                            )} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className={cn(
                                "font-medium truncate",
                                isSelected && "text-primary"
                              )}>
                                {result.title}
                              </p>
                              <span className={cn(
                                "text-xs px-2 py-0.5 rounded-full",
                                isSelected 
                                  ? "bg-primary/20 text-primary" 
                                  : "bg-muted text-muted-foreground"
                              )}>
                                {result.type}
                              </span>
                            </div>
                            {result.description && (
                              <p className="text-sm text-muted-foreground truncate mt-0.5">
                                {result.description}
                              </p>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          <div className="border-t px-3 py-2 bg-muted/30">
            <p className="text-xs text-muted-foreground">
              Use <kbd className="px-1.5 py-0.5 bg-background rounded text-xs border">↑</kbd> <kbd className="px-1.5 py-0.5 bg-background rounded text-xs border">↓</kbd> to navigate, <kbd className="px-1.5 py-0.5 bg-background rounded text-xs border">Enter</kbd> to select, <kbd className="px-1.5 py-0.5 bg-background rounded text-xs border">Esc</kbd> to close
            </p>
          </div>
        </Card>
      )}

      {isOpen && searchQuery && results.length === 0 && (
        <Card className="absolute top-full mt-2 w-full p-4 z-50 shadow-xl">
          <p className="text-sm text-muted-foreground text-center">
            No results found for "{searchQuery}"
          </p>
        </Card>
      )}
    </div>
  );
};