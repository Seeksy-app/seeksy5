import { CheckCircle2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface CFOTabIndicatorProps {
  isSaved: boolean;
  label: string;
  icon: React.ReactNode;
}

export function CFOTabIndicator({ isSaved, label, icon }: CFOTabIndicatorProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-2">
          <span className={cn(
            "transition-colors",
            isSaved ? "text-emerald-600" : "text-muted-foreground"
          )}>
            {icon}
          </span>
          <span>{label}</span>
          {isSaved && (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p className="text-xs">
          {isSaved 
            ? 'Included in Pro Forma.' 
            : 'This section has not been saved to the Pro Forma.'}
        </p>
      </TooltipContent>
    </Tooltip>
  );
}
