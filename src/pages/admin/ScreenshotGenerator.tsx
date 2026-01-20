import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Camera, Loader2, CheckCircle, Trash2, Folder, Globe, Download, ExternalLink, Activity, AlertCircle, CheckCircle2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { captureScreenshot, fetchScreenshots, deleteScreenshot, runHealthCheck, HealthCheckResult } from "@/lib/screenshot/captureScreenshot";
import { BackButton } from "@/components/navigation/BackButton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface Screenshot {
  id: string;
  page_name: string;
  url: string;
  category: string;
  screenshot_path: string;
  public_url: string;
  created_at: string;
  selected?: boolean;
}

const SCREENSHOT_CATEGORIES = [
  { value: "external", label: "External Pages" },
  { value: "internal", label: "Internal Pages" },
  { value: "onboarding", label: "Onboarding Flows" },
  { value: "creator-tools", label: "Creator Tools" },
  { value: "advertiser-tools", label: "Advertiser Tools" },
];

const PRESET_PAGES = [
  // External Pages
  { name: "Homepage", url: "https://seeksy.io", category: "external", description: "Landing page with hero section, features overview, call-to-action buttons, and navigation menu" },
  { name: "Pricing Page", url: "https://seeksy.io/pricing", category: "external", description: "Pricing tiers comparison with features list and purchase buttons" },
  { name: "Signup Page", url: "https://seeksy.io/auth", category: "external", description: "User registration form with email, password fields and social login options" },
  { name: "Comparison Page", url: "https://seeksy.io/comparison", category: "external", description: "Feature comparison with competitors, benefits overview" },
  
  // Internal Pages
  { name: "Creator Dashboard", url: "https://seeksy.io/dashboard", category: "internal", description: "Analytics dashboard with charts showing views, revenue, engagement metrics, and recent activity" },
  { name: "Admin Console", url: "https://seeksy.io/admin", category: "internal", description: "Admin dashboard with user management, system status, and analytics overview" },
  { name: "CFO Dashboard", url: "https://seeksy.io/cfo-dashboard", category: "internal", description: "Financial metrics, revenue insights, and business intelligence" },
  { name: "Board Portal", url: "https://seeksy.io/board", category: "internal", description: "Board member view with business model, GTM strategy, and forecasts" },
  { name: "Pro Forma", url: "https://seeksy.io/proforma", category: "internal", description: "Financial projections, AI-generated and custom scenarios" },
  { name: "GTM Strategy", url: "https://seeksy.io/gtm", category: "internal", description: "Go-to-market strategy, market analysis, and quarterly projections" },
  
  // Creator Tools
  { name: "Media Vault", url: "https://seeksy.io/media-vault", category: "creator-tools", description: "Grid of video thumbnails with upload button, search bar, and filtering options" },
  { name: "Podcast Manager", url: "https://seeksy.io/podcasts", category: "creator-tools", description: "List of podcast episodes with status badges, publish dates, and edit buttons" },
  { name: "Studio Hub", url: "https://seeksy.io/studio", category: "creator-tools", description: "Audio and video recording studio with AI production features" },
  { name: "Audio Recording", url: "https://seeksy.io/studio/audio", category: "creator-tools", description: "Audio recording studio with waveform, enhancement toggles, and script panel" },
  { name: "Video Recording", url: "https://seeksy.io/studio/video", category: "creator-tools", description: "Video recording studio with scenes, layouts, and broadcast controls" },
  { name: "AI Clips Studio", url: "https://seeksy.io/studio/clips", category: "creator-tools", description: "AI clip generation with timeline, transcript, and export options" },
  { name: "My Page Editor", url: "https://seeksy.io/profile/edit", category: "creator-tools", description: "Customization interface with section builder, module toggles, and live preview" },
  { name: "Voice Identity", url: "https://seeksy.io/my-voice-identity", category: "creator-tools", description: "Voice certification, fingerprint verification, and blockchain credentials" },
  { name: "Identity Hub", url: "https://seeksy.io/identity", category: "creator-tools", description: "Face and voice verification status, rights management" },
  { name: "Social Analytics", url: "https://seeksy.io/social-analytics", category: "creator-tools", description: "Instagram, YouTube, Facebook metrics and creator valuation" },
  
  // Advertiser Tools
  { name: "Advertiser Dashboard", url: "https://seeksy.io/advertiser", category: "advertiser-tools", description: "Campaign performance dashboard with impression stats, budget tracking, and active campaigns list" },
  { name: "Ad Library", url: "https://seeksy.io/advertiser/creatives", category: "advertiser-tools", description: "Audio ads, scripts, and creative management" },
  
  // Events & Awards
  { name: "Events", url: "https://seeksy.io/events", category: "internal", description: "Event list with registration, check-in, and analytics" },
  { name: "Create Event", url: "https://seeksy.io/events/create", category: "internal", description: "Event creation wizard with details, ticketing, and scheduling" },
  { name: "Awards Programs", url: "https://seeksy.io/awards", category: "internal", description: "Awards programs with categories, nominees, and voting" },
  { name: "Create Awards", url: "https://seeksy.io/awards/create", category: "internal", description: "Awards program creation with categories and nomination setup" },
  { name: "Meetings", url: "https://seeksy.io/meetings", category: "internal", description: "Meeting types, booking links, and scheduling" },
  
  // Onboarding
  { name: "Onboarding Wizard", url: "https://seeksy.io/onboarding", category: "onboarding", description: "Welcome screen with user type selection and getting started guide" },
];

export default function ScreenshotGenerator() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [customPageName, setCustomPageName] = useState("");
  const [customUrl, setCustomUrl] = useState("");
  const [customDescription, setCustomDescription] = useState("");
  const [customCategory, setCustomCategory] = useState<'advertiser-tools' | 'creator-tools' | 'internal' | 'external' | 'onboarding'>("internal");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedScreenshots, setSelectedScreenshots] = useState<Set<string>>(new Set());
  const [healthCheckResult, setHealthCheckResult] = useState<HealthCheckResult | null>(null);
  const [isHealthChecking, setIsHealthChecking] = useState(false);

  // Fetch existing screenshots from database
  const { data: screenshots = [], isLoading } = useQuery({
    queryKey: ['ui-screenshots', selectedCategory],
    queryFn: () => fetchScreenshots(selectedCategory),
  });

  // Health check function
  const handleHealthCheck = async () => {
    setIsHealthChecking(true);
    setHealthCheckResult(null);
    try {
      const result = await runHealthCheck();
      setHealthCheckResult(result);
      toast({
        title: result.success ? "Health Check Passed" : "Health Check Failed",
        description: result.success 
          ? `API is working. Response time: ${result.elapsed}` 
          : result.error || "Unknown error",
        variant: result.success ? "default" : "destructive",
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setHealthCheckResult({ success: false, error: errorMsg, code: 'EXCEPTION' });
      toast({
        variant: "destructive",
        title: "Health Check Failed",
        description: errorMsg,
      });
    } finally {
      setIsHealthChecking(false);
    }
  };

  // Single screenshot mutation
  const captureMutation = useMutation({
    mutationFn: async (params: { url: string; pageName: string; category: typeof customCategory; description?: string }) => {
      return captureScreenshot(params);
    },
    onSuccess: (data) => {
      toast({
        title: "Screenshot Captured",
        description: `${data.page_name} screenshot has been saved to library.`,
      });
      // Auto-refresh the library
      queryClient.invalidateQueries({ queryKey: ['ui-screenshots'] });
    },
    onError: (error: Error) => {
      console.error('[ScreenshotGenerator] Capture mutation error:', error);
      toast({
        variant: "destructive",
        title: "Capture Failed",
        description: error.message || "Screenshot capture failed. Check console for details.",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (screenshot: Screenshot) => {
      return deleteScreenshot(screenshot.id, screenshot.screenshot_path);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ui-screenshots'] });
    },
  });

  const generateAllPresets = async () => {
    toast({
      title: "Batch Generation Started",
      description: `Generating ${PRESET_PAGES.length} screenshots...`,
    });

    let successCount = 0;
    let failCount = 0;
    const errors: string[] = [];

    for (const preset of PRESET_PAGES) {
      try {
        console.log(`[Batch] Capturing: ${preset.name} - ${preset.url}`);
        await captureScreenshot({
          url: preset.url,
          pageName: preset.name,
          category: preset.category as typeof customCategory,
          description: preset.description,
        });
        successCount++;
        console.log(`[Batch] Success: ${preset.name}`);
        // Add delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        console.error(`[Batch] Failed: ${preset.name}`, errorMsg);
        errors.push(`${preset.name}: ${errorMsg}`);
        failCount++;
      }
    }

    queryClient.invalidateQueries({ queryKey: ['ui-screenshots'] });

    // Log all errors for debugging
    if (errors.length > 0) {
      console.error('[Batch] All errors:', errors);
    }

    toast({
      title: "Batch Generation Complete",
      description: `Generated ${successCount} screenshots successfully. ${failCount > 0 ? `${failCount} failed.` : ''}`,
      variant: failCount > 0 && successCount === 0 ? "destructive" : "default",
    });
  };

  const generateCustom = async () => {
    if (!customPageName || !customUrl) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please provide both page name and URL.",
      });
      return;
    }

    captureMutation.mutate({
      url: customUrl,
      pageName: customPageName,
      category: customCategory,
      description: customDescription || undefined,
    });

    setCustomPageName("");
    setCustomUrl("");
    setCustomDescription("");
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedScreenshots(new Set(screenshots.map(s => s.id)));
    } else {
      setSelectedScreenshots(new Set());
    }
  };

  const handleSelectScreenshot = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedScreenshots);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedScreenshots(newSelected);
  };

  const deleteSelected = async () => {
    const toDelete = screenshots.filter(s => selectedScreenshots.has(s.id));
    
    if (toDelete.length === 0) {
      toast({
        title: "No Selection",
        description: "Please select screenshots to delete",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Deleting...",
      description: `Removing ${toDelete.length} screenshot(s)...`,
    });

    let successCount = 0;
    for (const screenshot of toDelete) {
      try {
        await deleteMutation.mutateAsync(screenshot);
        successCount++;
      } catch (error) {
        console.error(`Failed to delete ${screenshot.page_name}:`, error);
      }
    }

    setSelectedScreenshots(new Set());

    toast({
      title: "Deleted",
      description: `${successCount} screenshot(s) deleted successfully`,
    });
  };

  const filteredScreenshots = screenshots;
  const selectedCount = selectedScreenshots.size;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <BackButton fallbackPath="/admin" className="mb-2" />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Screenshot Generator</h1>
          <p className="text-muted-foreground mt-2">
            Capture live screenshots from any URL using ScreenshotOne API
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline"
            onClick={handleHealthCheck}
            disabled={isHealthChecking}
          >
            {isHealthChecking ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <Activity className="mr-2 h-4 w-4" />
                Run Health Check
              </>
            )}
          </Button>
          <Button 
            size="lg" 
            onClick={generateAllPresets}
            disabled={captureMutation.isPending}
          >
            {captureMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Camera className="mr-2 h-4 w-4" />
                Generate All Presets ({PRESET_PAGES.length})
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Health Check Result */}
      {healthCheckResult && (
        <Alert variant={healthCheckResult.success ? "default" : "destructive"}>
          {healthCheckResult.success ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertTitle>
            {healthCheckResult.success ? "API Health Check Passed" : "API Health Check Failed"}
          </AlertTitle>
          <AlertDescription>
            {healthCheckResult.success ? (
              <div className="space-y-1 text-sm">
                <p>{healthCheckResult.message}</p>
                <p className="text-muted-foreground">
                  Response time: {healthCheckResult.elapsed} • Image size: {healthCheckResult.imageSize}
                </p>
              </div>
            ) : (
              <div className="space-y-1 text-sm">
                <p>{healthCheckResult.error}</p>
                {healthCheckResult.code && (
                  <p className="text-muted-foreground">Error code: {healthCheckResult.code}</p>
                )}
                {healthCheckResult.rawError && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                      View raw error
                    </summary>
                    <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto max-h-32">
                      {healthCheckResult.rawError}
                    </pre>
                  </details>
                )}
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Custom Screenshot Capture */}
        <Card>
          <CardHeader>
            <CardTitle>Capture Custom Screenshot</CardTitle>
            <CardDescription>
              Enter any live URL to capture a screenshot
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pageName">Page Name</Label>
              <Input
                id="pageName"
                placeholder="e.g., Dashboard Overview"
                value={customPageName}
                onChange={(e) => setCustomPageName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="url">Live URL</Label>
              <Input
                id="url"
                type="url"
                placeholder="e.g., https://seeksy.io/dashboard"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={customCategory} onValueChange={(v) => setCustomCategory(v as typeof customCategory)}>
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SCREENSHOT_CATEGORIES.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Describe the page content and purpose..."
                value={customDescription}
                onChange={(e) => setCustomDescription(e.target.value)}
                rows={3}
              />
            </div>

            <Button 
              onClick={generateCustom} 
              className="w-full"
              disabled={captureMutation.isPending}
            >
              <Camera className="mr-2 h-4 w-4" />
              Capture Screenshot
            </Button>
          </CardContent>
        </Card>

        {/* Preset Pages */}
        <Card>
          <CardHeader>
            <CardTitle>Preset Pages ({PRESET_PAGES.length})</CardTitle>
            <CardDescription>
              Pre-configured URLs for common platform pages
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[420px] pr-4">
              <div className="space-y-2">
                {PRESET_PAGES.map((preset, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{preset.name}</p>
                        <a 
                          href={preset.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-primary"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{preset.url}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => captureMutation.mutate({
                        url: preset.url,
                        pageName: preset.name,
                        category: preset.category as typeof customCategory,
                        description: preset.description,
                      })}
                      disabled={captureMutation.isPending}
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Screenshots Library */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Screenshots Library ({filteredScreenshots.length})</CardTitle>
              <CardDescription>
                All screenshots stored in Supabase (ui-screenshots bucket + database)
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[180px]">
                  <Folder className="mr-2 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {SCREENSHOT_CATEGORIES.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedCount > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={deleteSelected}
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Selected ({selectedCount})
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredScreenshots.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Camera className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No screenshots yet</p>
              <p className="text-sm text-muted-foreground">Capture your first screenshot above</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/50">
                <Checkbox
                  id="select-all"
                  checked={selectedCount > 0 && selectedCount === filteredScreenshots.length}
                  onCheckedChange={handleSelectAll}
                />
                <Label htmlFor="select-all" className="cursor-pointer">
                  Select All ({filteredScreenshots.length} screenshots)
                </Label>
              </div>
              <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredScreenshots.map((screenshot) => (
                  <div key={screenshot.id} className="border rounded-lg overflow-hidden relative group">
                    <div className="absolute top-2 left-2 z-10">
                      <Checkbox
                        checked={selectedScreenshots.has(screenshot.id)}
                        onCheckedChange={(checked) => 
                          handleSelectScreenshot(screenshot.id, checked as boolean)
                        }
                        className="bg-background"
                      />
                    </div>
                    <div className="aspect-video bg-muted flex items-center justify-center relative">
                      <img 
                        src={screenshot.public_url} 
                        alt={screenshot.page_name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 right-2">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      </div>
                    </div>
                    <div className="p-3">
                      <p className="font-medium text-sm truncate">{screenshot.page_name}</p>
                      <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                        <Globe className="h-3 w-3" />
                        {screenshot.url}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {SCREENSHOT_CATEGORIES.find(c => c.value === screenshot.category)?.label}
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full mt-2"
                        onClick={() => window.open(screenshot.public_url, '_blank')}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        View Full Size
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}