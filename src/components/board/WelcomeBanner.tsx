import { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BoardSearch } from './BoardSearch';
import { BoardNotificationBell } from './BoardNotificationBell';
import { DataModePill } from '@/components/data-mode/DataModePill';
import { DailyBriefButton } from '@/components/daily-brief/DailyBriefButton';
import { GlossaryButton } from './GlossaryModal';

interface WelcomeBannerProps {
  firstName?: string;
  onOpenAIPanel?: () => void;
}

export function WelcomeBanner({ firstName, onOpenAIPanel }: WelcomeBannerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="w-full rounded-xl bg-gradient-to-r from-slate-50 to-blue-50/50 border border-slate-200/60 px-5 py-3 flex items-center justify-between shadow-sm"
    >
      {/* Left: Avatar & Welcome */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
          <span className="text-white font-bold text-sm">
            {firstName ? firstName.charAt(0).toUpperCase() : 'S'}
          </span>
        </div>
        <div>
          <h1 className="text-lg font-semibold text-slate-900">
            Welcome{firstName ? `, ${firstName}` : ''}
          </h1>
          <p className="text-xs text-slate-500">Board overview</p>
        </div>
      </div>

      {/* Center: Search */}
      <div className="flex-1 max-w-md mx-6">
        <BoardSearch />
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <DataModePill />
        
        {/* Glossary */}
        <GlossaryButton />
        
        {/* Ask Seeksy Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onOpenAIPanel}
          className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 gap-2"
        >
          <MessageCircle className="h-4 w-4" />
          <span className="hidden md:inline text-sm font-medium">Ask Seeksy</span>
        </Button>

        {/* Notifications */}
        <BoardNotificationBell />

        {/* Daily Brief */}
        <DailyBriefButton 
          audienceType="board" 
          variant="default" 
          className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:opacity-90" 
        />
      </div>
    </motion.div>
  );
}
