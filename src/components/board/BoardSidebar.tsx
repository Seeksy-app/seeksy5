import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  Building2,
  Target,
  TrendingUp,
  LogOut,
  BarChart3,
  Calculator,
  DollarSign,
  Sword,
  ChartPie,
  Search,
  Settings,
  HelpCircle,
  BookOpen,
  Briefcase,
  FileText,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useBoardViewMode } from '@/hooks/useBoardViewMode';
import { useMeetingFocusMode } from '@/contexts/MeetingFocusModeContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import seeksyLogo from '@/assets/seeksy-logo-orange.png';

// OVERVIEW section - simplified
const overviewItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    path: '/board',
  },
];

// BUSINESS STRATEGY section - cleaned up, Market Intelligence merged into GTM
const businessItems = [
  {
    id: 'business-model',
    label: 'Business Model',
    icon: Building2,
    path: '/board/business-model',
  },
  {
    id: 'gtm',
    label: 'GTM Strategy',
    icon: Target,
    path: '/board/gtm',
  },
  {
    id: 'competitive',
    label: 'Competitive Landscape',
    icon: Sword,
    path: '/board/competitive-landscape',
  },
  {
    id: 'swot',
    label: 'SWOT Analysis',
    icon: ChartPie,
    path: '/board/swot',
  },
];

// FINANCIALS section - expanded with new tabs
const financialItems = [
  {
    id: 'company-health',
    label: 'Company Health',
    icon: BarChart3,
    path: '/board/company-health',
    isAI: true,
  },
  {
    id: 'financial-statements',
    label: 'Financial Statements',
    icon: DollarSign,
    path: '/board/financial-statements',
  },
  {
    id: 'capital-strategy',
    label: 'Capital Strategy',
    icon: TrendingUp,
    path: '/board/capital-strategy',
  },
  {
    id: 'proforma',
    label: '3-Year Pro Forma',
    icon: Calculator,
    path: '/board/forecasts',
  },
  {
    id: 'milestones',
    label: 'Milestones',
    icon: Target,
    path: '/board/milestones',
  },
  {
    id: 'team-org',
    label: 'Team & Org',
    icon: BarChart3,
    path: '/board/team-org',
  },
];

// RESOURCES section
const resourceItems = [
  {
    id: 'knowledge-hub',
    label: 'Knowledge Hub',
    icon: BookOpen,
    path: '/board/knowledge',
  },
  {
    id: 'sales-opportunities',
    label: 'Sales Opportunities',
    icon: Briefcase,
    path: '/board/sales-opportunities',
  },
  {
    id: 'meeting-notes',
    label: 'Meeting Notes',
    icon: FileText,
    path: '/board/meeting-notes',
  },
];

type NavItem = {
  id: string;
  label: string;
  icon: any;
  path?: string;
  isAI?: boolean;
  external?: boolean;
};

export function BoardSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { canToggleBoardView, toggleBoardView, isViewingAsBoard } = useBoardViewMode();
  const { isFocusMode, navCollapsed } = useMeetingFocusMode();
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const handleExitBoardView = () => {
    toggleBoardView();
    navigate('/admin');
  };

  const isItemActive = (item: NavItem) => {
    if (!item.path) return false;
    if (item.path === '/board/proforma' && location.pathname.startsWith('/board/proforma')) {
      return true;
    }
    return location.pathname === item.path;
  };

  // Filter items based on search
  const filterItems = (items: NavItem[]) => {
    if (!searchQuery.trim()) return items;
    return items.filter(item => 
      item.label.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const renderNavItem = (item: NavItem) => {
    const isActive = isItemActive(item);
    const Icon = item.icon;

    if (item.path) {
      return (
        <SidebarMenuItem key={item.id} className="mb-0">
          <Link
            to={item.path}
            data-tour={item.id === 'dashboard' ? 'nav-dashboard' : item.id === 'swot' ? 'nav-swot' : undefined}
            className={cn(
              'w-full flex items-center gap-2 rounded-lg transition-all duration-150 px-3 py-0.5',
              'text-[13px] font-medium leading-tight',
              isActive 
                ? 'bg-orange-50 text-orange-600' 
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            )}
          >
            <Icon className={cn(
              "w-4 h-4 flex-shrink-0",
              item.isAI ? "text-yellow-500" : isActive ? "text-orange-500" : "text-slate-400"
            )} />
            <span className="flex-1 truncate">{item.label}</span>
          </Link>
        </SidebarMenuItem>
      );
    }

    return (
      <SidebarMenuItem key={item.id} className="mb-0">
        <SidebarMenuButton
          data-tour={item.id === 'dashboard' ? 'nav-dashboard' : item.id === 'swot' ? 'nav-swot' : undefined}
          className={cn(
            'w-full flex items-center gap-2 rounded-lg transition-all duration-150 px-3 py-0.5',
            'text-[13px] font-medium leading-tight',
            isActive 
              ? 'bg-orange-50 text-orange-600' 
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          )}
        >
          <Icon className={cn(
            "w-4 h-4 flex-shrink-0",
            item.isAI ? "text-yellow-500" : isActive ? "text-orange-500" : "text-slate-400"
          )} />
          <span className="flex-1 truncate">{item.label}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  const renderSection = (title: string, items: NavItem[], className?: string) => {
    const filteredItems = filterItems(items);
    if (filteredItems.length === 0 && searchQuery.trim()) return null;
    
    return (
      <SidebarGroup className={cn("py-0.5", className)}>
        <SidebarGroupLabel className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-3 mb-0 py-0">
          {title}
        </SidebarGroupLabel>
        <SidebarMenu className="space-y-0 gap-0">
          {filteredItems.map(renderNavItem)}
        </SidebarMenu>
      </SidebarGroup>
    );
  };

  // Hide sidebar completely in focus mode when collapsed
  if (isFocusMode && navCollapsed) {
    return null;
  }

  return (
    <Sidebar collapsible="none" className="border-r border-slate-200 bg-white w-[260px] flex-shrink-0">
      {/* Header with Logo */}
      <SidebarHeader className="p-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <img src={seeksyLogo} alt="Seeksy" className="w-8 h-8 object-contain" />
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">Seeksy</h2>
            <p className="text-[10px] text-slate-500">Board Portal</p>
          </div>
        </div>
      </SidebarHeader>

      {/* Search Bar - Firecrawl style */}
      <div className="px-2 py-2 border-b border-slate-100">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <Input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 pr-8 h-8 bg-slate-50 border-slate-200 text-xs placeholder:text-slate-400 focus:bg-white focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
          />
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-medium">
            ⌘K
          </span>
        </div>
      </div>

      <SidebarContent className="px-2 py-1 overflow-y-auto">
        {renderSection('Overview', overviewItems)}
        {renderSection('Business Strategy', businessItems)}
        {renderSection('Financials', financialItems)}
        {renderSection('Resources', resourceItems)}
      </SidebarContent>

      <SidebarFooter className="p-2 border-t border-slate-100 space-y-0.5">
        {canToggleBoardView && isViewingAsBoard && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-50 text-[13px] font-medium h-8"
            onClick={handleExitBoardView}
          >
            <LayoutDashboard className="w-4 h-4 text-slate-400" />
            Exit Board View
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-50 text-[13px] font-medium h-8"
          onClick={() => navigate('/board/settings')}
        >
          <Settings className="w-4 h-4 text-slate-400" />
          Settings
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-50 text-[13px] font-medium h-8"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 text-slate-400" />
          Logout
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
