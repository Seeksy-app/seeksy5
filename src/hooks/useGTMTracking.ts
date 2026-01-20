import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  trackPageLoaded, 
  initScrollTracking, 
  resetScrollTracking 
} from '@/lib/analytics';

/**
 * Hook to initialize GTM tracking for page views and scroll depth
 * Should be used once at the app root level
 */
export function useGTMTracking() {
  const location = useLocation();

  // Track page loads and reset scroll tracking on route change
  useEffect(() => {
    // Reset scroll tracking for new page
    resetScrollTracking();
    
    // Track page load
    trackPageLoaded(location.pathname);
    
    // Initialize scroll depth tracking
    initScrollTracking();
  }, [location.pathname]);
}
