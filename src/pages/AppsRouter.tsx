import { lazy, Suspense, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";

// Single source of truth: AppsRedesigned only
const AppsRedesigned = lazy(() => import("./AppsRedesigned"));

/**
 * AppsRouter - Single source of truth for the Apps/Seeksy directory
 * 
 * IMPORTANT: Legacy Apps.tsx is RETIRED. All paths now use AppsRedesigned.
 * Default view is always "modules" (Individual Seekies) - never bundles/collections
 */
export default function AppsRouter() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Enforce default view=modules if no view specified
  useEffect(() => {
    const currentView = searchParams.get("view");
    
    // If someone lands on /apps without view param, default to modules
    if (!currentView) {
      const newParams = new URLSearchParams(searchParams);
      newParams.set("view", "modules");
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);
  
  const LoadingFallback = (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
    </div>
  );
  
  return (
    <Suspense fallback={LoadingFallback}>
      <AppsRedesigned />
    </Suspense>
  );
}
