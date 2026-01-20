import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, ArrowLeft, Sparkles, Store } from "lucide-react";
import { getModuleById } from "@/utils/routeValidation";

/**
 * Coming Soon page for modules that are installed but not yet enabled/implemented.
 * This provides a friendly experience instead of "Profile Not Found" errors.
 */
export default function ComingSoon() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get module ID from query params
  const searchParams = new URLSearchParams(location.search);
  const moduleId = searchParams.get('module');
  
  // Get module info if available
  const moduleInfo = moduleId ? getModuleById(moduleId) : null;
  
  // Log for debugging
  console.log('[Seeksy Debug] ComingSoon page:', { 
    moduleId, 
    requestedPath: location.pathname,
    moduleInfo: moduleInfo ? { id: moduleInfo.id, name: moduleInfo.name } : null 
  });
  
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full text-center border-border/50 shadow-lg">
        <CardHeader className="pb-4">
          {/* Module icon or default */}
          <div className="mx-auto w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 ring-4 ring-primary/5">
            {moduleInfo?.icon ? (
              <moduleInfo.icon className="h-10 w-10 text-primary" />
            ) : (
              <Package className="h-10 w-10 text-primary" />
            )}
          </div>
          
          <CardTitle className="text-2xl font-bold">
            {moduleInfo ? moduleInfo.name : 'Coming Soon'}
          </CardTitle>
          
          <CardDescription className="text-base text-muted-foreground mt-2">
            {moduleInfo 
              ? 'This Seeksy is installed but not enabled yet.'
              : 'This feature is coming soon. Stay tuned for updates!'}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {moduleInfo?.description && (
            <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
              {moduleInfo.description}
            </p>
          )}
          
          <div className="flex flex-col gap-3 pt-2">
            <Button 
              onClick={() => navigate('/my-day')} 
              className="w-full"
              size="lg"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Back to My Day
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => navigate('/apps?view=modules')} 
              className="w-full"
              size="lg"
            >
              <Store className="h-4 w-4 mr-2" />
              Explore other Seekies
            </Button>
          </div>
          
          {/* Helpful context */}
          <div className="pt-4 mt-4 border-t border-border/50">
            <p className="text-xs text-muted-foreground">
              {moduleInfo?.isNew 
                ? "This is a brand new feature in active development. We're working hard to bring it to you soon!"
                : "We're actively building this feature. Check back soon for updates!"}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
