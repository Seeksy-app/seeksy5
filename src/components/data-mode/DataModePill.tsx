import { useGlobalDataMode } from '@/contexts/GlobalDataModeContext';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Database, FlaskConical } from 'lucide-react';

export function DataModePill() {
  const { dataMode, isLoading } = useGlobalDataMode();

  if (isLoading) {
    return null;
  }

  const isDemo = dataMode === 'demo';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant={isDemo ? 'outline' : 'default'}
            className={
              isDemo
                ? 'bg-orange-500/20 text-orange-600 border-orange-500/30 hover:bg-orange-500/30 cursor-help'
                : 'bg-white text-slate-700 border-white/80 hover:bg-white/90 cursor-help shadow-sm'
            }
          >
            {isDemo ? (
              <>
                <FlaskConical className="w-3 h-3 mr-1" />
                DEMO
              </>
            ) : (
              <>
                <Database className="w-3 h-3 mr-1" />
                LIVE
              </>
            )}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          {isDemo ? (
            <p>Using sample data for testing and presentations.</p>
          ) : (
            <p>Using real production data. Demo records are hidden.</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
