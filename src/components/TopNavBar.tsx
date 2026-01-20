/**
 * Firecrawl-inspired TopNavBar
 * Clean, minimal design with: Team selector, Search, Help, Docs, Notifications
 * 
 * Help menu uses portal-scoped modals (no page refresh/redirect)
 */

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { GlobalSearch } from "@/components/GlobalSearch";
import { NotificationsBell } from "@/components/NotificationsBell";
import { DataModePill } from "@/components/data-mode/DataModePill";
import { AdminViewSwitcher } from "@/components/admin/AdminViewSwitcher";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { HelpCircle, FileText, ChevronDown, Sparkles, Settings, LogOut, User, BookOpen, MessageCircle, Pin, PinOff, Megaphone, Mail } from "lucide-react";
import { useUnreadUpdates } from "@/hooks/useUnreadUpdates";
import { useUserRoles } from "@/hooks/useUserRoles";
import { supabase } from "@/integrations/supabase/client";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { clearPortalStorage } from "@/contexts/PortalContext";
import { usePinnedHeaderItems, HeaderItemId } from "@/hooks/usePinnedHeaderItems";
import { useHelpMenuActions, HelpActionKey, PORTAL_LABELS } from "@/hooks/useHelpDrawer";

export function TopNavBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin } = useUserRoles();
  const { pinnedItems, togglePin, isPinned } = usePinnedHeaderItems();
  const { handleHelpMenuAction, effectivePortal } = useHelpMenuActions();
  const [teamName, setTeamName] = useState("Personal Workspace");
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || "");
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, account_full_name, avatar_url, account_avatar_url')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          const name = profile.full_name || profile.account_full_name;
          if (name) {
            setTeamName(`${name.split(' ')[0]}'s Workspace`);
            setUserName(name);
          }
          const avatar = profile.avatar_url || profile.account_avatar_url;
          if (avatar) {
            setAvatarUrl(avatar);
          }
        }
      }
    };
    fetchProfile();
  }, []);

  const handleLogout = async () => {
    try {
      // Clear portal state before signing out
      clearPortalStorage();
      await supabase.auth.signOut();
      toast.success("Logged out successfully");
      navigate('/auth');
    } catch (error) {
      toast.error("Failed to log out");
    }
  };

  const isAdminRoute = location.pathname.startsWith('/admin') || location.pathname.startsWith('/cfo');
  const isBoardRoute = location.pathname.startsWith('/board');
  
  // Help menu items - portal-scoped (Glossary is Admin-only per KB memory)
  const isAdminPortal = effectivePortal === 'admin';
  const helpMenuItems: { id: HelpActionKey; label: string; icon: 'book' | 'file' | 'help' | 'mail' }[] = [
    { id: 'knowledge_hub', label: 'Knowledge Hub', icon: 'book' },
    { id: 'daily_brief', label: 'Daily Brief', icon: 'file' },
    // Glossary only for Admin portal
    ...(isAdminPortal ? [{ id: 'glossary' as HelpActionKey, label: 'Glossary', icon: 'book' as const }] : []),
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between gap-4 px-4">
        {/* Left: Admin View Switcher for admins, context indicator for others */}
        {isAdmin ? (
          <AdminViewSwitcher />
        ) : isBoardRoute ? (
          // Board context - no workspace dropdown
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-amber-500/10 flex items-center justify-center">
              <span className="text-xs font-bold text-amber-600">B</span>
            </div>
            <span className="font-medium text-foreground">Board Portal</span>
          </div>
        ) : null}

        {/* Center: Global Search - Firecrawl has search in sidebar, we keep it in top bar */}
        <div className="flex-1 max-w-xl mx-4">
          <GlobalSearch />
        </div>

        {/* Right: Actions - Firecrawl style */}
        <div className="flex items-center gap-1">
          {/* Data Mode Pill */}
          <DataModePill />

          {/* Pinned Header Items - open modals, no navigation */}
          {helpMenuItems.filter(item => isPinned(item.id as HeaderItemId)).map(item => (
            <Button
              key={item.id}
              variant="ghost"
              size="sm"
              onClick={() => handleHelpMenuAction(item.id)}
              className="gap-2 hidden sm:flex"
            >
              {item.icon === 'book' && <BookOpen className="h-4 w-4" />}
              {item.icon === 'file' && <FileText className="h-4 w-4" />}
              <span className="text-sm font-medium">{item.label}</span>
            </Button>
          ))}

          {/* Ask Seeksy - for Admin routes */}
          {isAdminRoute && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => handleHelpMenuAction('ai_assistant')}
              className="gap-2 hidden sm:flex"
            >
              <MessageCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Ask Seeksy</span>
            </Button>
          )}

          {/* What's New Button */}
          <WhatsNewButton isAdminRoute={isAdminRoute} />

          {/* Notifications */}
          <NotificationsBell />

          {/* Help Dropdown - ALL items open modals/drawers (no navigation/refresh) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1.5">
                <HelpCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Help</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 bg-background">
              {/* AI Assistant - opens Spark drawer */}
              <DropdownMenuItem 
                onClick={() => handleHelpMenuAction('ai_assistant')} 
                className="bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 cursor-pointer"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Ask AI Assistant
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              
              {/* Portal-scoped help items - all open modals */}
              {helpMenuItems.map(item => (
                <DropdownMenuItem 
                  key={item.id}
                  className="flex items-center justify-between group cursor-pointer"
                  onClick={() => handleHelpMenuAction(item.id)}
                >
                  <div className="flex items-center">
                    {item.icon === 'book' && <BookOpen className="h-4 w-4 mr-2" />}
                    {item.icon === 'file' && <FileText className="h-4 w-4 mr-2" />}
                    {item.label}
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePin(item.id as HeaderItemId);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded"
                    title={isPinned(item.id as HeaderItemId) ? 'Unpin from header' : 'Pin to header'}
                  >
                    {isPinned(item.id as HeaderItemId) ? (
                      <PinOff className="h-3.5 w-3.5 text-muted-foreground" />
                    ) : (
                      <Pin className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </button>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              
              {/* Help Center - opens modal */}
              <DropdownMenuItem 
                onClick={() => handleHelpMenuAction('help_center')}
                className="cursor-pointer"
              >
                <HelpCircle className="h-4 w-4 mr-2" />
                Help Center
              </DropdownMenuItem>
              
              {/* Contact Support - opens modal with portal context */}
              <DropdownMenuItem 
                onClick={() => handleHelpMenuAction('contact_support')}
                className="cursor-pointer"
              >
                <Mail className="h-4 w-4 mr-2" />
                Contact Support
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {/* Theme Slider removed temporarily */}

          {/* User Menu with Logout */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2 ml-1">
                <Avatar className="h-7 w-7">
                  <AvatarImage src={avatarUrl} alt={userName} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {userName?.[0]?.toUpperCase() || userEmail?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{userName || "User"}</p>
                <p className="text-xs text-muted-foreground">{userEmail}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to={isAdminRoute ? '/admin/profile-settings' : '/profile-settings'}>
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to={isAdminRoute ? '/admin/settings' : '/settings'}>
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                <LogOut className="h-4 w-4 mr-2" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

// What's New Button Component
function WhatsNewButton({ isAdminRoute }: { isAdminRoute: boolean }) {
  const navigate = useNavigate();
  const { unreadCount } = useUnreadUpdates(isAdminRoute ? 'admin' : 'creator');
  
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => navigate(isAdminRoute ? '/admin/changelog' : '/changelog')}
      className="gap-1.5 hidden sm:flex"
    >
      <Megaphone className="h-4 w-4" />
      <span className="text-sm font-medium">What's New</span>
      {unreadCount > 0 && (
        <Badge variant="secondary" className="h-5 px-1.5 text-xs bg-primary text-primary-foreground">
          {unreadCount}
        </Badge>
      )}
    </Button>
  );
}
