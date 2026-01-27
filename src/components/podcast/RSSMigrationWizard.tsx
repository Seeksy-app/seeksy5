import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ArrowRight, CheckCircle2, AlertCircle, Loader2, ExternalLink } from "lucide-react";

interface RSSMigrationWizardProps {
  userId: string;
  podcastId: string;
}

type MigrationStep = 'input_urls' | 'host_detection' | 'redirect_setup' | 'verification' | 'complete';
type HostType = 'seeksy_managed' | 'third_party' | 'self_hosted' | null;

export function RSSMigrationWizard({ userId, podcastId }: RSSMigrationWizardProps) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<MigrationStep>('input_urls');
  const [oldRssUrl, setOldRssUrl] = useState('');
  const [newRssUrl, setNewRssUrl] = useState('');
  const [hostType, setHostType] = useState<HostType>(null);
  const [detectedPlatform, setDetectedPlatform] = useState<string | null>(null);
  const [migrationId, setMigrationId] = useState<string | null>(null);
  const [userNotes, setUserNotes] = useState('');

  // Fetch podcast details to generate RSS URL
  const { data: podcast } = useQuery({
    queryKey: ['podcast', podcastId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('podcasts')
        .select('*')
        .eq('id', podcastId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  // Pre-populate old RSS URL if podcast was imported via RSS
  useEffect(() => {
    const rssUrl = (podcast as any)?.rss_feed_url || (podcast as any)?.rss_url;
    if (rssUrl && !oldRssUrl) {
      setOldRssUrl(rssUrl);
    }
  }, [(podcast as any)?.rss_feed_url, (podcast as any)?.rss_url]);

  // Auto-generate new RSS URL from podcast title
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const { data: instructions } = useQuery({
    queryKey: ['rss-redirect-instructions'],
    queryFn: async () => {
      const result = await (supabase as any)
        .from('rss_redirect_instructions')
        .select('*')
        .order('platform_display_name');
      if (result.error) throw result.error;
      return result.data as any[];
    },
  });

  const { data: redirectStatus, refetch: checkRedirect, isLoading: isChecking } = useQuery({
    queryKey: ['redirect-status', migrationId],
    queryFn: async () => {
      if (!oldRssUrl || !newRssUrl) return null;
      const { data, error } = await supabase.functions.invoke('check-rss-redirect', {
        body: { oldRssUrl, newRssUrl, migrationId },
      });
      if (error) throw error;
      return data;
    },
    enabled: false,
  });

  const createMigration = useMutation({
    mutationFn: async () => {
      const result = await (supabase as any)
        .from('rss_migrations')
        .insert({
          podcast_id: podcastId,
          old_rss_url: oldRssUrl,
          new_rss_url: newRssUrl,
          host_type: hostType,
          third_party_platform: detectedPlatform,
          migration_step: step,
          user_notes: userNotes,
        })
        .select()
        .single();
      if (result.error) throw result.error;
      return result.data as any;
    },
    onSuccess: (data: any) => {
      setMigrationId(data.id);
      queryClient.invalidateQueries({ queryKey: ['rss-migrations'] });
    },
  });

  const updateMigration = useMutation({
    mutationFn: async (updates: any) => {
      if (!migrationId) return;
      const result = await (supabase as any)
        .from('rss_migrations')
        .update(updates)
        .eq('id', migrationId);
      if (result.error) throw result.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rss-migrations'] });
    },
  });

  const detectHostType = () => {
    const url = oldRssUrl.toLowerCase();
    
    // Check for Seeksy-managed hosts
    if (url.includes('seeksy.io') || url.includes('lovableproject.com')) {
      setHostType('seeksy_managed');
      setDetectedPlatform('seeksy');
      setStep('redirect_setup');
      return;
    }

    // Check for known third-party hosts
    const platformMap: Record<string, string> = {
      'anchor.fm': 'anchor',
      'spotify.com/podcasters': 'anchor',
      'libsyn.com': 'libsyn',
      'buzzsprout.com': 'buzzsprout',
      'podbean.com': 'podbean',
      'simplecast.com': 'simplecast',
      'transistor.fm': 'transistor',
      'spreaker.com': 'spreaker',
      'captivate.fm': 'captivate',
      'blubrry.com': 'blubrry',
      'soundcloud.com': 'soundcloud',
      'megaphone.fm': 'megaphone',
      'acast.com': 'acast',
    };

    for (const [domain, platform] of Object.entries(platformMap)) {
      if (url.includes(domain)) {
        setHostType('third_party');
        setDetectedPlatform(platform);
        setStep('redirect_setup');
        return;
      }
    }

    // Default to self-hosted
    setHostType('self_hosted');
    setDetectedPlatform('self_hosted');
    setStep('redirect_setup');
  };

  const handleInputUrls = async () => {
    if (!oldRssUrl) {
      toast.error('Please enter your current RSS feed URL');
      return;
    }
    if (!podcast) {
      toast.error('Unable to load podcast details');
      return;
    }
    
    // Auto-generate new RSS URL from podcast title
    const slug = generateSlug(podcast.title);
    const generatedRssUrl = `${window.location.origin}/rss/${slug}`;
    setNewRssUrl(generatedRssUrl);
    
    setStep('host_detection');
    detectHostType();
    await createMigration.mutateAsync();
  };

  const handleSeeksyManagedRedirect = async () => {
    // Auto-create 301 redirect for Seeksy-managed hosts
    toast.success('Setting up automatic 301 redirect...');
    await updateMigration.mutateAsync({ 
      redirect_setup: true,
      migration_step: 'verification'
    });
    setStep('verification');
    // Auto-check redirect after a moment
    setTimeout(() => checkRedirect(), 2000);
  };

  const handleManualRedirectComplete = async () => {
    await updateMigration.mutateAsync({ migration_step: 'verification' });
    setStep('verification');
  };

  const handleVerification = async () => {
    await checkRedirect();
    if (redirectStatus?.success) {
      await updateMigration.mutateAsync({ 
        migration_step: 'complete',
        redirect_verified_at: new Date().toISOString()
      });
      setStep('complete');
      toast.success('Migration complete! Your RSS feed has been successfully redirected.');
    } else {
      toast.error('Redirect not detected yet. Please complete the setup and try again.');
    }
  };

  const getStepProgress = () => {
    const steps = ['input_urls', 'host_detection', 'redirect_setup', 'verification', 'complete'];
    return ((steps.indexOf(step) + 1) / steps.length) * 100;
  };

  const platformInstructions = instructions?.find((i: any) => i.platform_name === detectedPlatform) as any;

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Move My Podcast Feed</CardTitle>
        <CardDescription>
          Migrate your existing podcast RSS feed to Seeksy with automatic redirect setup
        </CardDescription>
        <Progress value={getStepProgress()} className="mt-4" />
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Step 1: Input URLs */}
        {step === 'input_urls' && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="oldRssUrl">Your Current RSS Feed URL</Label>
              <Input
                id="oldRssUrl"
                type="url"
                placeholder="https://feeds.youroldhost.com/yourpodcast"
                value={oldRssUrl}
                onChange={(e) => setOldRssUrl(e.target.value)}
              />
              <p className="text-sm text-muted-foreground mt-1">
                Enter the RSS feed URL from your current podcast host
              </p>
            </div>
            
            {podcast && (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  Your new Seeksy RSS feed will be: <br />
                  <code className="text-xs mt-1 block bg-muted px-2 py-1 rounded">
                    {window.location.origin}/rss/{generateSlug(podcast.title)}
                  </code>
                </AlertDescription>
              </Alert>
            )}
            
            <Button onClick={handleInputUrls} className="w-full" disabled={createMigration.isPending || !podcast}>
              Continue <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Step 2: Redirect Setup - Seeksy Managed */}
        {step === 'redirect_setup' && hostType === 'seeksy_managed' && (
          <div className="space-y-4">
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                Great news! Your old feed is hosted on Seeksy infrastructure. We can set up the 301 redirect automatically for you.
              </AlertDescription>
            </Alert>
            <Button onClick={handleSeeksyManagedRedirect} className="w-full">
              Set Up Automatic Redirect <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Step 2: Redirect Setup - Third Party */}
        {step === 'redirect_setup' && hostType === 'third_party' && (
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Your old feed is hosted on {platformInstructions?.platform_display_name || 'a third-party platform'}. 
                Please follow these steps to set up the redirect:
              </AlertDescription>
            </Alert>
            {platformInstructions && (
              <Card className="bg-muted/50">
                <CardHeader>
                  <CardTitle className="text-base">{platformInstructions.platform_display_name} Instructions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm">{platformInstructions.instructions}</p>
                  {platformInstructions.help_url && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={platformInstructions.help_url} target="_blank" rel="noopener noreferrer">
                        View Help Documentation <ExternalLink className="ml-2 h-3 w-3" />
                      </a>
                    </Button>
                  )}
                  <div className="pt-3 space-y-2">
                    <p className="text-sm font-medium">Your New RSS Feed URL:</p>
                    <div className="flex gap-2">
                      <Input value={newRssUrl} readOnly className="font-mono text-xs" />
                      <Button size="sm" onClick={() => {
                        navigator.clipboard.writeText(newRssUrl);
                        toast.success('Copied to clipboard!');
                      }}>
                        Copy
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            <div>
              <Label htmlFor="userNotes">Notes (Optional)</Label>
              <Textarea
                id="userNotes"
                placeholder="Add any notes or questions for our support team..."
                value={userNotes}
                onChange={(e) => setUserNotes(e.target.value)}
              />
            </div>
            <Button onClick={handleManualRedirectComplete} className="w-full">
              I've Set Up the Redirect <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Step 2: Redirect Setup - Self Hosted */}
        {step === 'redirect_setup' && hostType === 'self_hosted' && (
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Your old feed appears to be self-hosted. You'll need to configure a 301 redirect on your server.
              </AlertDescription>
            </Alert>
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-base">What Your Developer Needs to Do</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm">
                  Add a permanent 301 redirect from your old RSS feed URL to your new Seeksy RSS feed URL. 
                  This can typically be done in your web server configuration (.htaccess for Apache, nginx.conf for Nginx) 
                  or in your CMS/WordPress settings.
                </p>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Old RSS URL:</p>
                  <Input value={oldRssUrl} readOnly className="font-mono text-xs" />
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">New RSS URL (redirect target):</p>
                  <Input value={newRssUrl} readOnly className="font-mono text-xs" />
                </div>
                <div className="bg-background p-3 rounded border">
                  <p className="text-xs font-mono">
                    # Apache .htaccess example:<br/>
                    Redirect 301 /your-old-feed {newRssUrl}
                  </p>
                </div>
              </CardContent>
            </Card>
            <div>
              <Label htmlFor="userNotes">Notes or Contact Info for Support</Label>
              <Textarea
                id="userNotes"
                placeholder="Need help? Let us know your hosting setup or contact details and we'll assist you..."
                value={userNotes}
                onChange={(e) => setUserNotes(e.target.value)}
              />
            </div>
            <Button onClick={handleManualRedirectComplete} className="w-full">
              I've Set Up the Redirect <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Step 3: Verification */}
        {step === 'verification' && (
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Let's verify that the 301 redirect is working correctly.
              </AlertDescription>
            </Alert>
            
            {redirectStatus && (
              <Card className={redirectStatus.success ? 'border-green-500' : 'border-yellow-500'}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    {redirectStatus.success ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium">{redirectStatus.statusMessage}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        HTTP Status: {redirectStatus.httpStatus}
                        {redirectStatus.locationHeader && (
                          <> | Redirects to: {redirectStatus.locationHeader}</>
                        )}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex gap-3">
              <Button 
                onClick={() => checkRedirect()} 
                disabled={isChecking}
                variant="outline"
                className="flex-1"
              >
                {isChecking ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Checking...
                  </>
                ) : (
                  'Check Redirect Status'
                )}
              </Button>
              {redirectStatus?.success && (
                <Button onClick={handleVerification} className="flex-1">
                  Complete Migration <CheckCircle2 className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>

            {!redirectStatus?.success && (
              <Alert>
                <AlertDescription className="text-sm">
                  <strong>Redirect not detected yet.</strong> Please ensure you've completed the redirect setup on your old host, 
                  then click "Check Redirect Status" again. It may take a few minutes for changes to propagate.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Step 4: Complete */}
        {step === 'complete' && (
          <div className="space-y-4 text-center">
            <div className="flex justify-center">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Migration Complete!</h3>
              <p className="text-muted-foreground mt-2">
                Your 301 redirect is active and working correctly.
              </p>
            </div>
            <Alert>
              <AlertDescription>
                <strong>What happens next:</strong> Podcast apps and directories like Apple Podcasts and Spotify 
                will automatically begin using your new Seeksy RSS feed. Your subscribers will continue to receive 
                new episodes without any interruption. This process happens gradually over the next few days as 
                podcast apps refresh their feed data.
              </AlertDescription>
            </Alert>
            <Button onClick={() => {
              setStep('input_urls');
              setOldRssUrl('');
              setNewRssUrl('');
              setHostType(null);
              setDetectedPlatform(null);
              setMigrationId(null);
            }} variant="outline">
              Start New Migration
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}