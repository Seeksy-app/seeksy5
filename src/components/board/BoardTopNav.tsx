import { useNavigate, Link } from 'react-router-dom';
import { Settings, User, Share2 } from 'lucide-react';
import { clearPortalStorage } from "@/contexts/PortalContext";
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TooltipProvider } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { DataModeToggle } from './DataModeToggle';
import { BoardSearch } from './BoardSearch';
import { BoardNotificationBell } from './BoardNotificationBell';

export function BoardTopNav() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    clearPortalStorage();
    await supabase.auth.signOut();
    navigate('/auth');
  };

  return (
    <TooltipProvider>
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border">
        <div className="flex items-center justify-between h-16 px-4 md:px-6">
          {/* Left side */}
          <div className="flex items-center gap-4">
            <SidebarTrigger className="md:hidden" />
            <Link to="/board" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <div className="hidden sm:flex items-center gap-2">
                <span className="font-semibold text-foreground">Seeksy</span>
                <span className="text-muted-foreground/50">|</span>
                <span className="text-sm text-muted-foreground font-medium">Board Portal</span>
              </div>
            </Link>
          </div>

          {/* Center - Search */}
          <div className="hidden md:flex flex-1 justify-center max-w-md mx-4">
            <BoardSearch />
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <DataModeToggle />
            
            <Button 
              variant="outline" 
              size="sm"
              asChild
              className="text-muted-foreground hidden lg:flex"
            >
              <Link to="/board/generate-investor-link">
                <Share2 className="w-4 h-4 mr-2" />
                Share with Investor
              </Link>
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-muted-foreground hover:text-foreground"
              onClick={() => navigate('/board/settings')}
            >
              <Settings className="w-5 h-5" />
            </Button>
            
            <BoardNotificationBell />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                  <User className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-background">
                <DropdownMenuLabel>Board Member</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/board" className="w-full cursor-pointer">Dashboard</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/board/settings" className="w-full cursor-pointer">Profile Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/board/investor-links" className="w-full cursor-pointer">Shared Investor Links</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/board/docs" className="w-full cursor-pointer">Documents</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer">
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
    </TooltipProvider>
  );
}
