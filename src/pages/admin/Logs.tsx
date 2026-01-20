import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollText, Search, RefreshCw, Filter } from "lucide-react";

export default function Logs() {
  const mockLogs = [
    { id: 1, level: 'info', message: 'User login successful', timestamp: '2024-12-04 12:30:45', source: 'auth' },
    { id: 2, level: 'warn', message: 'Rate limit approaching for API key', timestamp: '2024-12-04 12:28:12', source: 'api' },
    { id: 3, level: 'info', message: 'Email campaign sent successfully', timestamp: '2024-12-04 12:25:00', source: 'email' },
    { id: 4, level: 'error', message: 'Failed to process webhook', timestamp: '2024-12-04 12:20:33', source: 'webhook' },
    { id: 5, level: 'info', message: 'New podcast episode published', timestamp: '2024-12-04 12:15:22', source: 'content' },
  ];

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'text-red-600 bg-red-100';
      case 'warn': return 'text-yellow-600 bg-yellow-100';
      case 'info': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Logs</h1>
          <p className="text-muted-foreground">View and search application logs</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search logs..." className="pl-10" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ScrollText className="h-5 w-5" />
            Recent Logs
          </CardTitle>
          <CardDescription>
            Application events and system activity.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 font-mono text-sm">
            {mockLogs.map((log) => (
              <div key={log.id} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                <Badge className={getLevelColor(log.level)}>{log.level.toUpperCase()}</Badge>
                <div className="flex-1">
                  <p>{log.message}</p>
                  <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                    <span>{log.timestamp}</span>
                    <span>Source: {log.source}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}