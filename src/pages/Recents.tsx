import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Clock, 
  FileText, 
  Mail, 
  Users, 
  Calendar, 
  Podcast, 
  Scissors, 
  CheckSquare,
  FolderOpen,
  Image,
  ArrowLeft,
  Mic,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

interface RecentItem {
  id: string;
  title: string;
  type: 'module' | 'task' | 'contact' | 'clip' | 'email' | 'meeting' | 'podcast' | 'media' | 'project';
  route: string;
  timestamp: Date;
  subtitle?: string;
}

// Icon mapping
const TYPE_ICONS: Record<string, React.ElementType> = {
  module: FolderOpen,
  task: CheckSquare,
  contact: Users,
  clip: Scissors,
  email: Mail,
  meeting: Calendar,
  podcast: Podcast,
  media: Image,
  project: FolderOpen,
  studio: Mic,
};

const TYPE_COLORS: Record<string, string> = {
  module: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  task: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  contact: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  clip: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  email: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  meeting: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
  podcast: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  media: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  project: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
};

// Get recent items from localStorage
const getStoredRecents = (): RecentItem[] => {
  try {
    const stored = localStorage.getItem('seeksy_recents');
    if (stored) {
      const items = JSON.parse(stored);
      return items.map((item: any) => ({
        ...item,
        timestamp: new Date(item.timestamp),
      }));
    }
  } catch (e) {
    console.error('Error reading recents:', e);
  }
  return [];
};

// Save recent item to localStorage
export const addToRecents = (item: Omit<RecentItem, 'timestamp'>) => {
  try {
    const recents = getStoredRecents();
    const newItem: RecentItem = {
      ...item,
      timestamp: new Date(),
    };
    
    // Remove duplicates
    const filtered = recents.filter(r => !(r.id === item.id && r.type === item.type));
    
    // Add to front, keep max 50
    const updated = [newItem, ...filtered].slice(0, 50);
    
    localStorage.setItem('seeksy_recents', JSON.stringify(updated));
  } catch (e) {
    console.error('Error saving recent:', e);
  }
};

export default function Recents() {
  const navigate = useNavigate();
  const [recents, setRecents] = useState<RecentItem[]>([]);

  useEffect(() => {
    setRecents(getStoredRecents());
  }, []);

  // Group by date
  const groupedRecents = recents.reduce((acc, item) => {
    const dateKey = format(item.timestamp, 'yyyy-MM-dd');
    const today = format(new Date(), 'yyyy-MM-dd');
    const yesterday = format(new Date(Date.now() - 86400000), 'yyyy-MM-dd');
    
    let label = format(item.timestamp, 'EEEE, MMMM d');
    if (dateKey === today) label = 'Today';
    else if (dateKey === yesterday) label = 'Yesterday';
    
    if (!acc[label]) acc[label] = [];
    acc[label].push(item);
    return acc;
  }, {} as Record<string, RecentItem[]>);

  const handleItemClick = (item: RecentItem) => {
    navigate(item.route);
  };

  // Demo data if no recents
  const demoRecents: RecentItem[] = [
    { id: '1', title: 'Studio', type: 'module', route: '/studio', timestamp: new Date(), subtitle: 'Recording workspace' },
    { id: '2', title: 'AI Clips', type: 'module', route: '/clips', timestamp: new Date(Date.now() - 3600000), subtitle: 'Generate clips' },
    { id: '3', title: 'Podcasts', type: 'module', route: '/podcasts', timestamp: new Date(Date.now() - 7200000), subtitle: 'Podcast hosting' },
    { id: '4', title: 'Email Inbox', type: 'module', route: '/email/inbox', timestamp: new Date(Date.now() - 86400000), subtitle: 'Email marketing' },
    { id: '5', title: 'Contacts', type: 'module', route: '/audience', timestamp: new Date(Date.now() - 86400000 * 2), subtitle: 'Audience management' },
  ];

  const displayRecents = recents.length > 0 ? recents : demoRecents;
  const displayGrouped = recents.length > 0 ? groupedRecents : {
    'Today': demoRecents.slice(0, 3),
    'Yesterday': demoRecents.slice(3, 4),
    'Earlier': demoRecents.slice(4),
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate('/my-day')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Clock className="h-8 w-8 text-primary" />
              Recents
            </h1>
            <p className="text-muted-foreground mt-1">
              Recently accessed modules, records, and pages
            </p>
          </div>
        </div>

        {/* Recents List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Activity History</CardTitle>
          </CardHeader>
          <CardContent>
            {recents.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p className="font-medium">No recent activity yet</p>
                <p className="text-sm mt-1">Your recently visited pages and records will appear here.</p>
                <p className="text-xs mt-4 text-muted-foreground/60">
                  Showing demo items for preview:
                </p>
              </div>
            )}
            
            <ScrollArea className="max-h-[600px]">
              <div className="space-y-6">
                {Object.entries(displayGrouped).map(([dateLabel, items]) => (
                  <div key={dateLabel}>
                    <h3 className="text-sm font-medium text-muted-foreground mb-3">
                      {dateLabel}
                    </h3>
                    <div className="space-y-2">
                      {items.map((item) => {
                        const Icon = TYPE_ICONS[item.type] || FolderOpen;
                        const colorClass = TYPE_COLORS[item.type] || TYPE_COLORS.module;
                        
                        return (
                          <button
                            key={`${item.type}-${item.id}`}
                            onClick={() => handleItemClick(item)}
                            className="w-full flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors text-left group"
                          >
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClass}`}>
                              <Icon className="h-5 w-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-foreground group-hover:text-primary transition-colors truncate">
                                {item.title}
                              </p>
                              {item.subtitle && (
                                <p className="text-sm text-muted-foreground truncate">
                                  {item.subtitle}
                                </p>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground shrink-0">
                              {formatDistanceToNow(item.timestamp, { addSuffix: true })}
                            </div>
                            <Badge variant="secondary" className="text-xs capitalize shrink-0">
                              {item.type}
                            </Badge>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
