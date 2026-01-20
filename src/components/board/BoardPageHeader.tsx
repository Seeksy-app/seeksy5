import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BoardSearch } from './BoardSearch';
import { BoardNotificationBell } from './BoardNotificationBell';
import { DataModePill } from '@/components/data-mode/DataModePill';
import { DailyBriefButton } from '@/components/daily-brief/DailyBriefButton';
import { GlossaryButton } from './GlossaryModal';
import { AdminViewSwitcher } from '@/components/admin/AdminViewSwitcher';
import { useUserRoles } from '@/hooks/useUserRoles';
import { ThemeSliderPopover } from '@/components/ThemeSliderPopover';

interface BoardPageHeaderProps {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  onOpenAIPanel?: () => void;
}

export function BoardPageHeader({ 
  icon, 
  title, 
  subtitle, 
  actions,
  onOpenAIPanel 
}: BoardPageHeaderProps) {
  const { isAdmin } = useUserRoles();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="sticky top-0 z-40 bg-slate-50 border-b border-slate-200/60 -mx-6 lg:-mx-8 px-6 lg:px-8 py-3"
    >
      <div className="flex items-center justify-between gap-4">
        {/* Left: Admin View Switcher (for admins) or Icon & Title */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {isAdmin && <AdminViewSwitcher />}
          {icon && (
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
              {icon}
            </div>
          )}
          <div>
            <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
            {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
          </div>
        </div>

        {/* Center: Search */}
        <div className="flex-1 max-w-md mx-4 hidden md:block">
          <BoardSearch />
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <DataModePill />
          
          {/* Theme Slider */}
          <ThemeSliderPopover />
          
          {/* Glossary */}
          <GlossaryButton />
          
          {/* Ask Seeksy Button */}
          {onOpenAIPanel && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onOpenAIPanel}
              className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 gap-2"
            >
              <MessageCircle className="h-4 w-4" />
              <span className="hidden lg:inline text-sm font-medium">Ask Seeksy</span>
            </Button>
          )}

          {/* Notifications */}
          <BoardNotificationBell />

          {/* Daily Brief */}
          <DailyBriefButton 
            audienceType="board" 
            variant="default" 
            className="ml-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:opacity-90" 
          />
          
          {/* Custom Actions */}
          {actions}
        </div>
      </div>
    </motion.div>
  );
}
