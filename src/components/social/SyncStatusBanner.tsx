import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RefreshCw, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SyncStatusBannerProps {
  syncStatus: string | null;
  platform: string;
  onSyncComplete?: () => void;
  onManualSync?: () => void;
}

export function SyncStatusBanner({ 
  syncStatus, 
  platform, 
  onSyncComplete,
  onManualSync 
}: SyncStatusBannerProps) {
  const [prevStatus, setPrevStatus] = useState<string | null>(null);
  const [showCompleteBanner, setShowCompleteBanner] = useState(false);

  // Track status changes to show completion message
  useEffect(() => {
    if (prevStatus === 'syncing' && syncStatus === 'synced') {
      setShowCompleteBanner(true);
      onSyncComplete?.();
      
      // Auto-hide after 5 seconds
      const timer = setTimeout(() => {
        setShowCompleteBanner(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
    setPrevStatus(syncStatus);
  }, [syncStatus, prevStatus, onSyncComplete]);

  const isSyncing = syncStatus === 'syncing' || syncStatus === 'pending';
  const hasError = syncStatus === 'error';
  
  const platformName = platform === 'instagram' ? 'Instagram' 
    : platform === 'youtube' ? 'YouTube' 
    : platform === 'facebook' ? 'Facebook Page'
    : platform;

  if (showCompleteBanner) {
    return (
      <Alert className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800 dark:text-green-200 ml-2">
          Initial sync complete! Your {platformName} analytics and valuation are now up to date.
        </AlertDescription>
      </Alert>
    );
  }

  if (isSyncing) {
    return (
      <Alert className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
        <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />
        <AlertDescription className="text-blue-800 dark:text-blue-200 ml-2">
          We're syncing your {platformName} posts and insights. This may take a few minutes. 
          You can continue using Seeksy while we work.
        </AlertDescription>
      </Alert>
    );
  }

  if (hasError) {
    return (
      <Alert className="bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800">
        <AlertCircle className="h-4 w-4 text-yellow-600" />
        <AlertDescription className="text-yellow-800 dark:text-yellow-200 ml-2 flex items-center justify-between flex-wrap gap-2">
          <span>We couldn't complete your initial sync. Please try again.</span>
          {onManualSync && (
            <Button variant="outline" size="sm" onClick={onManualSync}>
              <RefreshCw className="h-3 w-3 mr-1" />
              Sync All Data Now
            </Button>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}