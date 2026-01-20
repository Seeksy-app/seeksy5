import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, History, Sparkles, Star, Clock } from 'lucide-react';
import { CFOProFormaVersion } from '@/hooks/useCFOProFormaVersions';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface CFOVersionSelectorProps {
  versions: CFOProFormaVersion[] | undefined;
  selectedVersion: CFOProFormaVersion | null;
  latestVersion: CFOProFormaVersion | null | undefined;
  onSelectVersion: (version: CFOProFormaVersion | null) => void;
  isLiveMode: boolean;
}

export function CFOVersionSelector({
  versions,
  selectedVersion,
  latestVersion,
  onSelectVersion,
  isLiveMode,
}: CFOVersionSelectorProps) {
  const [open, setOpen] = useState(false);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatRelative = (dateStr: string) => {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
  };

  const handleSelect = (version: CFOProFormaVersion | null) => {
    onSelectVersion(version);
    setOpen(false);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <History className="w-4 h-4" />
          {isLiveMode ? (
            <>
              <Sparkles className="w-3 h-3 text-amber-500" />
              Live Forecast
            </>
          ) : (
            <span className="max-w-[180px] truncate">
              {selectedVersion?.name || 'Select Version'}
            </span>
          )}
          <ChevronDown className="w-3 h-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Forecast Versions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* Live Mode Option */}
        <DropdownMenuItem
          onClick={() => handleSelect(null)}
          className={cn(
            'flex items-center justify-between py-2',
            isLiveMode && 'bg-blue-50'
          )}
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span className="font-medium">Live Forecast</span>
          </div>
          {isLiveMode && (
            <Badge variant="secondary" className="text-xs">Active</Badge>
          )}
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        {/* Saved Versions */}
        {versions && versions.length > 0 ? (
          versions.map((version) => (
            <DropdownMenuItem
              key={version.id}
              onClick={() => handleSelect(version)}
              className={cn(
                'flex items-start justify-between gap-2 py-2',
                selectedVersion?.id === version.id && 'bg-blue-50'
              )}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {version.is_published && latestVersion?.id === version.id && (
                    <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                  )}
                  <span className="font-medium truncate">{version.name}</span>
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Clock className="w-3 h-3" />
                  {formatRelative(version.created_at)}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {version.is_published && latestVersion?.id === version.id && (
                  <Badge className="bg-emerald-100 text-emerald-700 text-xs">
                    Live
                  </Badge>
                )}
                {selectedVersion?.id === version.id && (
                  <Badge variant="secondary" className="text-xs">
                    Viewing
                  </Badge>
                )}
              </div>
            </DropdownMenuItem>
          ))
        ) : (
          <div className="px-2 py-4 text-center text-sm text-muted-foreground">
            No saved versions yet.
            <br />
            CFO must save a Pro Forma version first.
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
