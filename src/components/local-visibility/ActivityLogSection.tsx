import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  History, 
  Database, 
  User, 
  Sparkles, 
  CheckCircle2,
  Link2,
  Clock
} from "lucide-react";
import { useLocalVisibilityStore } from "@/hooks/useLocalVisibilityStore";
import type { ActivityLogEntry } from "@/types/local-visibility";
import { formatDistanceToNow } from "date-fns";

const EntryTypeIcon = ({ type, isAI }: { type: ActivityLogEntry['type']; isAI: boolean }) => {
  if (isAI) return <Sparkles className="h-4 w-4 text-primary" />;
  
  const icons = {
    data_pull: <Database className="h-4 w-4 text-blue-600" />,
    user_action: <User className="h-4 w-4 text-green-600" />,
    ai_suggestion: <Sparkles className="h-4 w-4 text-primary" />,
    executed_change: <CheckCircle2 className="h-4 w-4 text-green-600" />,
    connection_change: <Link2 className="h-4 w-4 text-yellow-600" />,
  };
  return icons[type];
};

const EntryTypeBadge = ({ type }: { type: ActivityLogEntry['type'] }) => {
  const config = {
    data_pull: { label: 'Data Sync', className: 'bg-blue-500/10 text-blue-600' },
    user_action: { label: 'User Action', className: 'bg-green-500/10 text-green-600' },
    ai_suggestion: { label: 'AI Suggestion', className: 'bg-primary/10 text-primary' },
    executed_change: { label: 'Change Made', className: 'bg-green-500/10 text-green-600' },
    connection_change: { label: 'Connection', className: 'bg-yellow-500/10 text-yellow-600' },
  };
  return <Badge variant="outline" className={`text-[10px] ${config[type].className}`}>{config[type].label}</Badge>;
};

const LogEntry = ({ entry }: { entry: ActivityLogEntry }) => (
  <div className="flex items-start gap-3 py-3 border-b last:border-0">
    <div className="p-1.5 rounded-lg bg-muted">
      <EntryTypeIcon type={entry.type} isAI={entry.isAI} />
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between gap-2">
        <p className="font-medium text-sm truncate">{entry.title}</p>
        <EntryTypeBadge type={entry.type} />
      </div>
      <p className="text-xs text-muted-foreground mt-0.5">{entry.description}</p>
      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
        <Clock className="h-3 w-3" />
        {formatDistanceToNow(new Date(entry.timestamp), { addSuffix: true })}
      </p>
    </div>
  </div>
);

export function ActivityLogSection() {
  const { activityLog } = useLocalVisibilityStore();

  // Mock data + real entries
  const mockEntries: ActivityLogEntry[] = [
    {
      id: '1',
      timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      type: 'executed_change',
      title: 'Review reply sent',
      description: 'Replied to review from Sarah M.',
      isAI: false,
    },
    {
      id: '2',
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      type: 'ai_suggestion',
      title: 'AI generated reply suggestion',
      description: 'Created personalized response for 5-star review',
      isAI: true,
    },
    {
      id: '3',
      timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      type: 'data_pull',
      title: 'GBP insights synced',
      description: 'Pulled latest performance data from Google Business Profile',
      isAI: false,
    },
    {
      id: '4',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      type: 'connection_change',
      title: 'Google Business Profile connected',
      description: 'OAuth connection established successfully',
      isAI: false,
    },
    {
      id: '5',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
      type: 'user_action',
      title: 'Holiday hours preview requested',
      description: 'Viewed preview for Christmas hours update',
      isAI: false,
    },
    {
      id: '6',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      type: 'data_pull',
      title: 'Search Console data synced',
      description: 'Pulled top queries and page performance data',
      isAI: false,
    },
  ];

  const allEntries = [...activityLog, ...mockEntries].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  // Group by date
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  
  const groupedEntries = allEntries.reduce((acc, entry) => {
    const date = new Date(entry.timestamp).toDateString();
    const label = date === today ? 'Today' : date === yesterday ? 'Yesterday' : date;
    if (!acc[label]) acc[label] = [];
    acc[label].push(entry);
    return acc;
  }, {} as Record<string, ActivityLogEntry[]>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <History className="h-5 w-5" />
                Activity Log
              </CardTitle>
              <CardDescription>
                Immutable history of all actions and changes
              </CardDescription>
            </div>
            <Badge variant="outline">{allEntries.length} entries</Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Log Entries */}
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="h-[500px]">
            {Object.entries(groupedEntries).map(([dateLabel, entries]) => (
              <div key={dateLabel}>
                <div className="sticky top-0 bg-muted/80 backdrop-blur-sm px-4 py-2 border-b">
                  <p className="text-xs font-medium text-muted-foreground">{dateLabel}</p>
                </div>
                <div className="px-4">
                  {entries.map((entry) => (
                    <LogEntry key={entry.id} entry={entry} />
                  ))}
                </div>
              </div>
            ))}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Note */}
      <Card className="border-dashed">
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground text-center">
            Activity logs are immutable and retained for audit purposes. All AI actions and user changes are recorded.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
