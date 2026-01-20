import { useState } from 'react';
import { useGlobalDataMode } from '@/contexts/GlobalDataModeContext';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Database, FlaskConical, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export function DataModeToggle() {
  const { dataMode, isAdmin, setDataMode, isLoading } = useGlobalDataMode();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingMode, setPendingMode] = useState<'demo' | 'live' | null>(null);
  const [isSwitching, setIsSwitching] = useState(false);

  const isDemo = dataMode === 'demo';

  const handleToggleRequest = (checked: boolean) => {
    const newMode = checked ? 'demo' : 'live';
    setPendingMode(newMode);
    setShowConfirmDialog(true);
  };

  const handleConfirm = async () => {
    if (!pendingMode) return;

    setIsSwitching(true);
    try {
      await setDataMode(pendingMode);
      toast.success(
        pendingMode === 'live'
          ? 'Switched to LIVE mode. Demo data is now hidden.'
          : 'Switched to DEMO mode. Demo data is now visible.'
      );
    } catch (error) {
      toast.error('Failed to switch data mode. Please try again.');
    } finally {
      setIsSwitching(false);
      setShowConfirmDialog(false);
      setPendingMode(null);
    }
  };

  const handleCancel = () => {
    setShowConfirmDialog(false);
    setPendingMode(null);
  };

  if (!isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isDemo ? (
              <FlaskConical className="w-5 h-5 text-orange-500" />
            ) : (
              <Database className="w-5 h-5 text-green-500" />
            )}
            Data Mode
          </CardTitle>
          <CardDescription>
            Current mode: <strong>{dataMode.toUpperCase()}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Only administrators can change the data mode setting.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isDemo ? (
              <FlaskConical className="w-5 h-5 text-orange-500" />
            ) : (
              <Database className="w-5 h-5 text-green-500" />
            )}
            Data Mode
          </CardTitle>
          <CardDescription>
            Switch between demo and live data across all dashboards
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="data-mode-toggle" className="text-base">
                {isDemo ? 'DEMO Mode' : 'LIVE Mode'}
              </Label>
              <p className="text-sm text-muted-foreground">
                {isDemo
                  ? 'Showing sample data for testing and presentations'
                  : 'Showing real production data only'}
              </p>
            </div>
            <Switch
              id="data-mode-toggle"
              checked={isDemo}
              onCheckedChange={handleToggleRequest}
              disabled={isLoading || isSwitching}
            />
          </div>

          <div className="rounded-lg border p-3 bg-muted/50">
            <p className="text-xs text-muted-foreground">
              <strong>Note:</strong> Demo data is never deleted. When in LIVE mode, 
              demo records are simply hidden from view. You can switch back to DEMO 
              mode at any time.
            </p>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {pendingMode === 'live' ? (
                <>
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  Switch to LIVE Mode?
                </>
              ) : (
                <>
                  <FlaskConical className="w-5 h-5 text-orange-500" />
                  Switch to DEMO Mode?
                </>
              )}
            </DialogTitle>
            <DialogDescription className="pt-2">
              {pendingMode === 'live' ? (
                <>
                  Demo data will be <strong>hidden</strong> across all dashboards, 
                  but <strong>not deleted</strong>. You can switch back to DEMO mode 
                  at any time.
                </>
              ) : (
                <>
                  Demo data will be <strong>visible again</strong> for testing and 
                  presentations. Real data will still be shown alongside demo records.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancel} disabled={isSwitching}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={isSwitching}
              variant={pendingMode === 'live' ? 'default' : 'secondary'}
            >
              {isSwitching ? 'Switching...' : `Switch to ${pendingMode?.toUpperCase()}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
