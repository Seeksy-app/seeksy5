/**
 * GoogleConnectBanner - Optional banner for post-onboarding Google connect prompt
 * Shows on dashboard if user hasn't connected Google yet
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, Mail, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function GoogleConnectBanner() {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    checkGoogleConnection();
  }, []);

  const checkGoogleConnection = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if user dismissed this banner
      const dismissed = localStorage.getItem('google_connect_banner_dismissed');
      if (dismissed === 'true') {
        setIsDismissed(true);
        return;
      }

      // Check if Google is already connected via gmail_connections or google_calendar_connections
      const { data: gmailConnection } = await supabase
        .from('gmail_connections')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      const { data: calendarConnection } = await supabase
        .from('google_calendar_connections')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      // Only show if not connected
      if (!gmailConnection && !calendarConnection) {
        setIsVisible(true);
      }
    } catch (error) {
      // Silently fail - don't show banner if we can't check
      console.log('[GoogleConnectBanner] Check failed:', error);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('google_connect_banner_dismissed', 'true');
    setIsDismissed(true);
    setIsVisible(false);
  };

  const handleConnect = () => {
    navigate('/integrations');
  };

  if (!isVisible || isDismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white dark:bg-background flex items-center justify-center shadow-sm">
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              </div>
              <div>
                <p className="font-medium text-foreground">Connect Gmail (optional)</p>
                <p className="text-sm text-muted-foreground">Sync contacts and track email interactions</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleConnect}
                className="gap-2 bg-white dark:bg-background hover:bg-white/80"
              >
                Connect
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDismiss}
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
