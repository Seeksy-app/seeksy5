/**
 * Dev-only button to reset onboarding state
 * Only visible to allowlisted users or in dev mode
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { RefreshCw, Bug } from 'lucide-react';
import { toast } from 'sonner';
import { isDevUser, fullOnboardingReset } from '@/utils/devOnboardingReset';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export function DevOnboardingResetButton() {
  const [isVisible, setIsVisible] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    isDevUser().then(setIsVisible);
  }, []);

  if (!isVisible) return null;

  const handleReset = async () => {
    setIsResetting(true);
    
    try {
      const result = await fullOnboardingReset();
      
      if (result.success) {
        toast.success('Onboarding reset complete! Redirecting...');
        // Redirect to onboarding with force=true
        setTimeout(() => {
          navigate('/onboarding?force=true');
        }, 500);
      } else {
        toast.error(`Reset failed: ${result.error}`);
      }
    } catch (err) {
      toast.error('Unexpected error during reset');
      console.error(err);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 border-amber-500/50 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20"
        >
          <Bug className="h-4 w-4" />
          Dev: Reset Onboarding
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Bug className="h-5 w-5 text-amber-500" />
            Reset Onboarding State
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>This will:</p>
            <ul className="list-disc ml-4 space-y-1">
              <li>Set <code>onboarding_completed = false</code> in profiles</li>
              <li>Clear <code>onboarding_data</code>, <code>account_type</code>, etc.</li>
              <li>Clear all onboarding localStorage/sessionStorage flags</li>
              <li>Redirect to <code>/onboarding?force=true</code></li>
            </ul>
            <p className="text-amber-600 font-medium mt-3">
              This action is for development/testing only.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleReset}
            disabled={isResetting}
            className="bg-amber-600 hover:bg-amber-700"
          >
            {isResetting ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Resetting...
              </>
            ) : (
              'Reset & Test Onboarding'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
