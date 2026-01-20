import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronDown, History, FileCheck2, Trash2, Eye, Star, Clock } from 'lucide-react';
import { CFOProFormaVersion } from '@/hooks/useCFOProFormaVersions';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface ProFormaVersionsControlProps {
  versions: CFOProFormaVersion[] | undefined;
  latestVersion: CFOProFormaVersion | null | undefined;
  onPreview?: (version: CFOProFormaVersion) => void;
  onDelete?: (id: string) => void;
  isLoading?: boolean;
}

export function ProFormaVersionsControl({
  versions,
  latestVersion,
  onPreview,
  onDelete,
  isLoading,
}: ProFormaVersionsControlProps) {
  const [modalOpen, setModalOpen] = useState(false);

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

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2 text-sm">
            <FileCheck2 className="w-4 h-4" />
            Pro Forma Versions
            {latestVersion && (
              <Badge variant="secondary" className="ml-1 text-xs font-normal">
                Latest: {latestVersion.name}
              </Badge>
            )}
            <ChevronDown className="w-3 h-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <DropdownMenuLabel className="flex items-center justify-between">
            <span>Saved Versions</span>
            {versions && versions.length > 0 && (
              <Badge variant="outline" className="text-xs">
                {versions.length} saved
              </Badge>
            )}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {versions && versions.length > 0 ? (
            <>
              {versions.slice(0, 3).map((version) => (
                <DropdownMenuItem
                  key={version.id}
                  className="flex items-start justify-between gap-2 py-2"
                  onClick={() => onPreview?.(version)}
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
                  {version.is_published && (
                    <Badge variant="secondary" className="text-xs shrink-0">
                      Published
                    </Badge>
                  )}
                </DropdownMenuItem>
              ))}
              
              {versions.length > 3 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setModalOpen(true)}>
                    <History className="w-4 h-4 mr-2" />
                    View all {versions.length} versions
                  </DropdownMenuItem>
                </>
              )}
            </>
          ) : (
            <div className="px-2 py-4 text-center text-sm text-muted-foreground">
              No saved versions yet.
              <br />
              Complete all sections and save a version.
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Full Versions Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Pro Forma Versions</DialogTitle>
            <DialogDescription>
              All saved Pro Forma versions. The latest published version is used by the Board.
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="max-h-[400px]">
            <div className="space-y-2">
              {versions?.map((version) => (
                <div
                  key={version.id}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg border",
                    version.is_published && latestVersion?.id === version.id
                      ? "bg-emerald-50 border-emerald-200"
                      : "bg-muted/50 border-border"
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {version.is_published && latestVersion?.id === version.id && (
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                      )}
                      <span className="font-medium">{version.name}</span>
                      {version.is_published && latestVersion?.id === version.id && (
                        <Badge className="bg-emerald-100 text-emerald-700 text-xs">
                          Live
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {formatDate(version.created_at)}
                    </p>
                    {version.notes && (
                      <p className="text-sm text-muted-foreground mt-1 italic">
                        {version.notes}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        onPreview?.(version);
                        setModalOpen(false);
                      }}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Preview
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => onDelete?.(version.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
