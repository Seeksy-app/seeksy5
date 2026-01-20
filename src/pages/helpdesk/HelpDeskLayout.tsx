import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Headphones, Inbox, Zap, FileText, Users, Settings, Link2, BarChart3, Search, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePermissions, Permission } from "@/hooks/usePermissions";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";

const navItems: { id: string; label: string; icon: any; path: string; permission: Permission }[] = [
  { id: "tickets", label: "Tickets", icon: Inbox, path: "/helpdesk", permission: "supportdesk.view" },
  { id: "automations", label: "Automations", icon: Zap, path: "/helpdesk/automations", permission: "supportdesk.manage" },
  { id: "templates", label: "Templates", icon: FileText, path: "/helpdesk/templates", permission: "supportdesk.manage" },
  { id: "users", label: "Users", icon: Users, path: "/helpdesk/users", permission: "supportdesk.view" },
  { id: "analytics", label: "Analytics", icon: BarChart3, path: "/helpdesk/analytics", permission: "supportdesk.manage" },
  { id: "integrations", label: "Integrations", icon: Link2, path: "/helpdesk/integrations", permission: "supportdesk.settings" },
  { id: "settings", label: "Settings", icon: Settings, path: "/helpdesk/settings", permission: "supportdesk.settings" },
];

export default function HelpDeskLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { hasPermission, hasAnyPermission, isLoading } = usePermissions();
  const [searchQuery, setSearchQuery] = useState("");

  const getActiveTab = () => {
    if (location.pathname === "/helpdesk" || location.pathname.startsWith("/helpdesk/ticket/")) {
      return "tickets";
    }
    const match = navItems.find(item => location.pathname.startsWith(item.path) && item.path !== "/helpdesk");
    return match?.id || "tickets";
  };

  // Check if user has any support desk permission
  const hasSupportAccess = hasAnyPermission(['supportdesk.view', 'supportdesk.reply', 'supportdesk.manage', 'supportdesk.settings']);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      toast.info(`Searching for: ${searchQuery}`);
      // In production, this would navigate to search results or filter tickets
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!hasSupportAccess) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center p-8">
          <Headphones className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">You do not have permission to access the Help Desk.</p>
        </div>
      </div>
    );
  }

  const visibleNavItems = navItems.filter(item => hasPermission(item.permission));

  return (
    <div className="flex flex-col h-full w-full">
      {/* Header with tabs - Firecrawl inspired */}
      <div className="border-b border-border bg-background">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                <Headphones className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Help Desk</h1>
                <p className="text-sm text-muted-foreground">Customer support management</p>
              </div>
            </div>
          </div>
          
          <Tabs value={getActiveTab()} onValueChange={(v) => {
            const item = navItems.find(i => i.id === v);
            if (item) navigate(item.path);
          }}>
            <TabsList className="bg-muted/50">
              {visibleNavItems.map((item) => (
                <TabsTrigger key={item.id} value={item.id} className="flex items-center gap-2 data-[state=active]:bg-background">
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-auto relative">
        <Outlet />
        
        {/* Floating search bar - Firecrawl style */}
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <form onSubmit={handleSearch} className="relative">
            <div className="flex items-center bg-white rounded-full shadow-lg border border-slate-200 px-4 py-2 min-w-[320px] hover:shadow-xl transition-shadow">
              <Search className="h-4 w-4 text-slate-400 mr-2 flex-shrink-0" />
              <Input
                type="text"
                placeholder="Ask a question..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border-0 focus-visible:ring-0 bg-transparent text-sm placeholder:text-slate-400 flex-1 h-8 px-0"
              />
              <div className="flex items-center gap-2 ml-2">
                <span className="text-xs text-slate-400 font-medium hidden sm:inline">⌘I</span>
                <Button 
                  type="submit" 
                  size="icon" 
                  className="h-8 w-8 rounded-full bg-orange-500 hover:bg-orange-600"
                  disabled={!searchQuery.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
