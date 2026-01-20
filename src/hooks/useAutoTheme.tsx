import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { useLocation } from "react-router-dom";

// ONLY these specific Studio recording routes use dark theme
const DARK_STUDIO_ROUTES = ['/studio/video', '/studio/audio', '/studio/record'];

export function useAutoTheme() {
  const { setTheme, resolvedTheme } = useTheme();
  const location = useLocation();
  
  // Only force dark mode for actual recording studio pages
  const isStudioRecording = DARK_STUDIO_ROUTES.some(route => 
    location.pathname === route || location.pathname.startsWith(route + '/')
  );
  
  const wasInStudioRecording = useRef(false);

  useEffect(() => {
    if (isStudioRecording) {
      // Entering Studio recording - force dark theme
      if (!wasInStudioRecording.current) {
        wasInStudioRecording.current = true;
      }
      if (resolvedTheme !== 'dark') {
        setTheme('dark');
      }
      return;
    }

    // All other pages: force light theme immediately
    if (wasInStudioRecording.current) {
      wasInStudioRecording.current = false;
    }
    
    // Always use light theme for non-studio pages - no async calls, no flicker
    if (resolvedTheme !== 'light') {
      setTheme('light');
    }
  }, [resolvedTheme, setTheme, isStudioRecording, location.pathname]);
}
