import { DataModeToggle, DataModeLabel, CFOModelBanner } from '@/components/board/DataModeToggle';
import { BoardSearchBar } from '@/components/board/BoardSearchBar';
import { useBoardDataMode } from '@/contexts/BoardDataModeContext';
import { Activity } from 'lucide-react';

interface BoardHeaderProps {
  onSearchQuery: (query: string) => void;
}

export function BoardHeader({ onSearchQuery }: BoardHeaderProps) {
  const { isCFO, isLive } = useBoardDataMode();

  return (
    <div className="space-y-4">
      {/* Top row with toggle and search */}
      <div className="flex items-center justify-between gap-4">
        <DataModeToggle />
        <BoardSearchBar 
          onSearch={onSearchQuery} 
          className="flex-1 max-w-md"
        />
      </div>

      {/* CFO Model banner when in CFO mode */}
      <CFOModelBanner />

      {/* Live Data indicator */}
      {isLive && (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3 flex items-start gap-3">
          <Activity className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">Live Platform Data</p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
              Showing real-time operational metrics: creators, podcasts, episodes, and signups.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
