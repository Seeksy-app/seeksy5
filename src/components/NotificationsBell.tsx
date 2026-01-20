import { Bell, Mail, Users, Calendar, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

interface Notification {
  id: string;
  type: "email" | "contact" | "meeting" | "alert";
  title: string;
  timestamp: string;
  read: boolean;
}

export function NotificationsBell() {
  // Mock notifications - will be replaced with real data
  const [notifications] = useState<Notification[]>([]);
  const unreadCount = notifications.filter(n => !n.read).length;

  const getIcon = (type: string) => {
    switch (type) {
      case "email": return <Mail className="h-4 w-4 text-primary" />;
      case "contact": return <Users className="h-4 w-4 text-primary" />;
      case "meeting": return <Calendar className="h-4 w-4 text-primary" />;
      case "alert": return <Zap className="h-4 w-4 text-primary" />;
      default: return <Bell className="h-4 w-4 text-primary" />;
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0 shadow-2xl rounded-xl" align="end">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-foreground">Notifications</h3>
        </div>
        
        {notifications.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <Bell className="h-8 w-8 text-primary" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">✨ You're all caught up!</p>
            <p className="text-xs text-muted-foreground">
              No new notifications.
            </p>
          </div>
        ) : (
          <div className="max-h-[400px] overflow-y-auto">
            {notifications.map((notification) => (
              <button
                key={notification.id}
                className="w-full flex items-start gap-3 p-4 hover:bg-muted/50 transition-colors border-b last:border-b-0 text-left"
              >
                <div className="mt-0.5">
                  {getIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-foreground line-clamp-2">
                      {notification.title}
                    </p>
                    {!notification.read && (
                      <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {notification.timestamp}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
