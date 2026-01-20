import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { clearPortalStorage } from "@/contexts/PortalContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeSliderPopover } from "@/components/ThemeSliderPopover";
import { GlobalSearch } from "@/components/GlobalSearch";
import { ModuleCenterModal } from "@/components/modules";
import { SparkMascot } from "@/components/myday/SparkMascot";
import { DataModePill } from "@/components/data-mode/DataModePill";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAIAssistant } from "@/components/ai/AIAssistantProvider";
import {
  Bell,
  MoreHorizontal,
  Settings,
  HelpCircle,
  CreditCard,
  Layers,
  LifeBuoy,
  LogOut,
  User,
  MessageCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function GlobalTopNav() {
  const navigate = useNavigate();
  const [showModuleCenter, setShowModuleCenter] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [userInitials, setUserInitials] = useState("U");
  const { open: openAIChat } = useAIAssistant();

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('avatar_url, full_name, username')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          setAvatarUrl(profile.avatar_url);
          const name = profile.full_name || profile.username || user.email || '';
          const initials = name
            .split(' ')
            .map((n: string) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2) || 'U';
          setUserInitials(initials);
        }
      }
    };
    fetchProfile();
  }, []);

  const handleLogout = async () => {
    try {
      clearPortalStorage();
      await supabase.auth.signOut();
      navigate('/auth');
      toast.success("Logged out successfully");
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-[hsl(var(--header-background))] border-b border-white/10 shadow-lg">
        {/* Taller header with more vertical breathing room */}
        <div className="flex items-center justify-between h-16 px-4">
          {/* Left section - Spark Mascot & Logo */}
          <div className="flex items-center gap-3">
            <SidebarTrigger className="text-[hsl(var(--header-foreground))] hover:bg-white/10" />
            
            {/* Spark Mascot + Seeksy branding */}
            <div className="flex items-center gap-2">
              <SparkMascot size="sm" animate />
              <span className="font-semibold text-[hsl(var(--header-foreground))] hidden sm:inline">
                Seeksy
              </span>
            </div>
          </div>

          {/* Center section - Search with more breathing room */}
          <div className="flex-1 max-w-lg mx-6">
            <GlobalSearch />
          </div>

          {/* Right section */}
          <div className="flex items-center gap-1.5">
            {/* Data Mode Pill */}
            <DataModePill />
            
            {/* Ask Seeksy AI Chat button */}
            <Button 
              variant="ghost" 
              size="sm"
              onClick={openAIChat}
              className="text-[hsl(var(--header-foreground))] hover:bg-white/10 gap-2 hidden sm:flex"
            >
              <MessageCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Ask Seeksy</span>
            </Button>
            
            {/* Mobile AI button */}
            <Button 
              variant="ghost" 
              size="icon"
              onClick={openAIChat}
              className="text-[hsl(var(--header-foreground))] hover:bg-white/10 sm:hidden"
            >
              <MessageCircle className="h-5 w-5" />
            </Button>

            {/* Help / Knowledge Base */}
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate('/helpdesk')}
              className="text-[hsl(var(--header-foreground))] hover:bg-white/10"
              title="Help Center"
            >
              <HelpCircle className="h-5 w-5" />
            </Button>
            
            {/* Notifications */}
            <Button variant="ghost" size="icon" className="text-[hsl(var(--header-foreground))] hover:bg-white/10">
              <Bell className="h-5 w-5" />
            </Button>
            
            {/* More menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-[hsl(var(--header-foreground))] hover:bg-white/10">
                  <MoreHorizontal className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-popover border shadow-lg z-50">
                <DropdownMenuItem onClick={() => navigate('/help')}>
                  <HelpCircle className="h-4 w-4 mr-2" />
                  Help Center
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowModuleCenter(true)}>
                  <Layers className="h-4 w-4 mr-2" />
                  App Store
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/settings')}>
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/settings/billing')}>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Billing
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/support')}>
                  <LifeBuoy className="h-4 w-4 mr-2" />
                  Contact Support
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Theme slider */}
            <div className="hidden sm:block">
              <ThemeSliderPopover />
            </div>

            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full text-[hsl(var(--header-foreground))] hover:bg-white/10 p-0">
                  <Avatar className="h-8 w-8 border-2 border-white/20">
                    <AvatarImage src={avatarUrl ? `${avatarUrl}?t=${Date.now()}` : undefined} alt="Profile" />
                    <AvatarFallback className="bg-primary/20 text-[hsl(var(--header-foreground))] text-xs font-medium">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-popover border shadow-lg z-50">
                <DropdownMenuItem onClick={() => navigate('/profile/edit')}>
                  <User className="h-4 w-4 mr-2" />
                  My Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/settings')}>
                  <Settings className="h-4 w-4 mr-2" />
                  Account Settings
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
      
      {/* Module Center Modal */}
      <ModuleCenterModal 
        isOpen={showModuleCenter} 
        onClose={() => setShowModuleCenter(false)} 
      />
    </>
  );
}
