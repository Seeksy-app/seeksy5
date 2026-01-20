/**
 * Admin View Mode Switcher
 * Dropdown for admins to quickly switch between portal views
 */

import { useNavigate } from 'react-router-dom';
import { Shield, Palette, Megaphone, Users, ChevronDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { useAdminViewMode, ViewMode } from '@/hooks/useAdminViewMode';
import { cn } from '@/lib/utils';

const VIEW_MODES = [
  { 
    value: 'admin' as ViewMode, 
    label: 'Admin Panel', 
    icon: Shield, 
    color: 'text-destructive',
    bgColor: 'bg-destructive/10',
    description: 'Full admin access'
  },
  { 
    value: 'creator' as ViewMode, 
    label: 'Creator View', 
    icon: Palette, 
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    description: 'See as a creator'
  },
  { 
    value: 'advertiser' as ViewMode, 
    label: 'Advertiser View', 
    icon: Megaphone, 
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-500/10',
    description: 'See as an advertiser'
  },
  { 
    value: 'board' as ViewMode, 
    label: 'Board View', 
    icon: Users, 
    color: 'text-amber-600',
    bgColor: 'bg-amber-500/10',
    description: 'See as a board member'
  },
];

export function AdminViewSwitcher() {
  const navigate = useNavigate();
  const { viewMode, setViewMode, getRouteForMode, canSwitch } = useAdminViewMode();

  if (!canSwitch) return null;

  const currentMode = VIEW_MODES.find(m => m.value === viewMode) || VIEW_MODES[0];
  const CurrentIcon = currentMode.icon;

  const handleSwitch = (mode: ViewMode) => {
    setViewMode(mode);
    navigate(getRouteForMode(mode));
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="gap-2 font-medium text-foreground hover:bg-accent"
        >
          <div className={cn("w-6 h-6 rounded flex items-center justify-center", currentMode.bgColor)}>
            <CurrentIcon className={cn("h-3.5 w-3.5", currentMode.color)} />
          </div>
          <span className="hidden sm:inline">{currentMode.label}</span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
          Switch View (Session Only)
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {VIEW_MODES.map((mode) => {
          const Icon = mode.icon;
          const isActive = viewMode === mode.value;
          return (
            <DropdownMenuItem
              key={mode.value}
              onClick={() => handleSwitch(mode.value)}
              className={cn("cursor-pointer", isActive && "bg-accent")}
            >
              <div className={cn("w-6 h-6 rounded flex items-center justify-center mr-2", mode.bgColor)}>
                <Icon className={cn("h-3.5 w-3.5", mode.color)} />
              </div>
              <div className="flex-1">
                <span className="font-medium">{mode.label}</span>
                <p className="text-xs text-muted-foreground">{mode.description}</p>
              </div>
              {isActive && <Check className="h-4 w-4 text-primary ml-2" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
