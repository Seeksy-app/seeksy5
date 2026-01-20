import { useState } from 'react';
import { useGlobalDataMode } from '@/contexts/GlobalDataModeContext';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Beaker, Database, Info } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function GlobalDemoToggle() {
  const { dataMode, setDataMode, isLoading, isAdmin } = useGlobalDataMode();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingMode, setPendingMode] = useState<'demo' | 'live'>('live');
  
  const isDemo = dataMode === 'demo';
  
  const handleToggle = (checked: boolean) => {
    const newMode = checked ? 'demo' : 'live';
    
    // If switching from demo to live, show confirmation
    if (isDemo && !checked) {
      setPendingMode('live');
      setConfirmOpen(true);
    } else {
      // Switching to demo mode doesn't need confirmation
      setDataMode(newMode).then(() => {
        toast.success(`Switched to ${newMode === 'demo' ? 'Demo' : 'Live'} mode`);
      });
    }
  };
  
  const confirmModeChange = async () => {
    try {
      await setDataMode(pendingMode);
      toast.success(`Switched to ${pendingMode === 'demo' ? 'Demo' : 'Live'} mode`);
    } catch (error) {
      toast.error('Failed to change data mode');
    }
    setConfirmOpen(false);
  };
  
  if (!isAdmin) {
    return null; // Only show for admins
  }
  
  return (
    <>
      <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
        <div className="flex items-center gap-2">
          {isDemo ? (
            <Beaker className="w-4 h-4 text-amber-500" />
          ) : (
            <Database className="w-4 h-4 text-emerald-500" />
          )}
          <Label htmlFor="demo-mode" className="text-sm font-medium cursor-pointer">
            Demo Mode
          </Label>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs">
              <p className="text-xs">
                Demo Mode shows sample data across all modules (Sales, Meetings, Leads, Forecasting, Dashboard).
                Live Mode shows only real company data.
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
        
        <Switch
          id="demo-mode"
          checked={isDemo}
          onCheckedChange={handleToggle}
          disabled={isLoading}
        />
        
        <Badge
          variant="outline"
          className={cn(
            'ml-auto text-xs',
            isDemo
              ? 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
              : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
          )}
        >
          {isDemo ? 'DEMO' : 'LIVE'}
        </Badge>
      </div>
      
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Switch to Live Mode?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Demo data will be hidden across all dashboards, but not deleted.
                You'll only see real company data.
              </p>
              <p className="text-sm text-muted-foreground">
                Affected modules: Sales Leads, Meetings, Contacts, Forecasting, Dashboard KPIs
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmModeChange}>
              Switch to Live Mode
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// Compact indicator for headers
export function DataModeIndicator() {
  const { dataMode } = useGlobalDataMode();
  const isDemo = dataMode === 'demo';
  
  return (
    <Badge
      variant="outline"
      className={cn(
        'text-[10px] px-1.5 py-0.5',
        isDemo
          ? 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
          : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
      )}
    >
      {isDemo ? 'DEMO' : 'LIVE'}
    </Badge>
  );
}
