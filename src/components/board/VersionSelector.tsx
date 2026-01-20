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
import { ChevronDown, History, Sparkles, Trash2 } from 'lucide-react';
import { ProFormaVersion } from '@/hooks/useProFormaVersions';
import { cn } from '@/lib/utils';

interface VersionSelectorProps {
  versions: ProFormaVersion[] | undefined;
  selectedVersion: ProFormaVersion | null;
  onSelectVersion: (version: ProFormaVersion | null) => void;
  onDeleteVersion: (id: string) => void;
  isLiveMode: boolean;
}

export function VersionSelector({
  versions,
  selectedVersion,
  onSelectVersion,
  onDeleteVersion,
  isLiveMode,
}: VersionSelectorProps) {
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

  const handleSelect = (version: ProFormaVersion | null) => {
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
              <Sparkles className="w-3 h-3 text-yellow-500" />
              Live Forecast
            </>
          ) : (
            <span className="max-w-[150px] truncate">
              {selectedVersion?.label || 'Select Version'}
            </span>
          )}
          <ChevronDown className="w-3 h-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72">
        <DropdownMenuLabel>Forecast Versions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* Live Mode Option */}
        <DropdownMenuItem
          onClick={() => handleSelect(null)}
          className={cn(
            'flex items-center justify-between',
            isLiveMode && 'bg-blue-50'
          )}
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-yellow-500" />
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
                'flex items-center justify-between group',
                selectedVersion?.id === version.id && 'bg-blue-50'
              )}
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{version.label}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(version.created_at)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs capitalize">
                  {version.scenario_key}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteVersion(version.id);
                  }}
                >
                  <Trash2 className="w-3 h-3 text-destructive" />
                </Button>
              </div>
            </DropdownMenuItem>
          ))
        ) : (
          <div className="px-2 py-4 text-center text-sm text-muted-foreground">
            No saved versions yet.
            <br />
            Generate a forecast and click "Save Version".
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
