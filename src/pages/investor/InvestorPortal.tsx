import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { 
  Shield, Lock, AlertTriangle, BarChart3, Target, TrendingUp, 
  Video, FileText, LayoutDashboard, Globe, Mail, Check, Users, Briefcase
} from 'lucide-react';
import { toast } from 'sonner';
import { MarketOverviewTab } from '@/components/board/gtm/MarketOverviewTab';
import { GTMStrategyTab } from '@/components/board/gtm/GTMStrategyTab';
import { KeyMetricsTab } from '@/components/board/gtm/KeyMetricsTab';
import { CompetitiveLandscapeTab } from '@/components/board/gtm/CompetitiveLandscapeTab';
import { SWOTAnalysisTab } from '@/components/board/gtm/SWOTAnalysisTab';

interface InvestorLink {
  id: string;
  token: string;
  passcode: string;
  investor_name: string | null;
  data_mode: string;
  scope: string[];
  allow_ai: boolean;
  allow_pdf_export: boolean;
  mask_financials: boolean;
  status: string;
  expires_at: string | null;
  created_by: string;
}

export default function InvestorPortal() {
  const { token } = useParams<{ token: string }>();
  const [linkData, setLinkData] = useState<InvestorLink | null>(null);
  const [passcode, setPasscode] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [boardMemberEmail, setBoardMemberEmail] = useState('');

  useEffect(() => {
    fetchLinkData();
  }, [token]);

  const fetchLinkData = async () => {
    if (!token) {
      setError('Invalid link');
      setIsLoading(false);
      return;
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('investor_links')
        .select('*')
        .eq('token', token)
        .single();

      if (fetchError || !data) {
        setError('This investor link is no longer active. Please contact your Seeksy board contact for an updated link.');
        setIsLoading(false);
        return;
      }

      if (data.status === 'revoked') {
        setError('This investor link has been revoked. Please contact your Seeksy board contact for an updated link.');
        setIsLoading(false);
        return;
      }

      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        setError('This investor link has expired. Please contact your Seeksy board contact for an updated link.');
        setIsLoading(false);
        return;
      }

      // Get board member email for contact
      if (data.created_by) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', data.created_by)
          .single();
        if (profile?.full_name) {
          setBoardMemberEmail(profile.full_name);
        }
      }

      setLinkData(data);
      setIsLoading(false);
    } catch (err) {
      setError('Failed to load investor view');
      setIsLoading(false);
    }
  };

  const logActivity = async (eventType: string, tabViewed?: string) => {
    if (!linkData) return;
    await supabase.from('investor_link_activity').insert({
      link_id: linkData.id,
      event_type: eventType,
      tab_viewed: tabViewed,
    });
  };

  const handleAuthenticate = async () => {
    if (!linkData) return;

    if (passcode !== linkData.passcode) {
      toast.error('Invalid access code');
      return;
    }

    // Show disclaimer after correct passcode
    setShowDisclaimer(true);
  };

  const handleAcceptDisclaimer = async () => {
    if (!linkData || !disclaimerAccepted) return;

    // Log activity
    await logActivity('authenticated');

    // Update view count
    await supabase
      .from('investor_links')
      .update({ 
        last_viewed_at: new Date().toISOString(),
        total_views: (linkData as any).total_views + 1 
      })
      .eq('id', linkData.id);

    setShowDisclaimer(false);
    setIsAuthenticated(true);
    toast.success('Access granted');
  };

  const handleTabChange = (tab: string) => {
    logActivity('tab_viewed', tab);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Link Unavailable</h2>
            <p className="text-slate-600 mb-6">{error}</p>
            <Button variant="outline" asChild>
              <a href="mailto:hello@seeksy.io">Request New Access</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardHeader className="text-center pb-2">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl">Seeksy Investor View</CardTitle>
              <p className="text-slate-500 text-sm mt-2">
                Enter the access code provided by your Seeksy board contact
              </p>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div>
                <Input
                  type="text"
                  placeholder="Enter 6-digit access code"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAuthenticate()}
                  className="text-center text-2xl tracking-[0.5em] font-mono"
                  maxLength={6}
                />
              </div>
              <Button className="w-full" onClick={handleAuthenticate} disabled={passcode.length !== 6}>
                <Lock className="w-4 h-4 mr-2" />
                Access Investor View
              </Button>
              <p className="text-xs text-slate-400 text-center">
                This is a secure, time-limited view of Seeksy's business metrics.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Disclaimer Modal */}
        <Dialog open={showDisclaimer} onOpenChange={setShowDisclaimer}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                Confidentiality Agreement
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <div className="p-4 bg-slate-50 rounded-lg text-sm text-slate-600 space-y-3">
                <p className="font-semibold text-slate-900">Before You Continue</p>
                <p>
                  This material is <b>confidential</b> and is being shared for investment evaluation purposes only.
                </p>
                <p>By proceeding, you agree to the following:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>This view is <b>read-only</b> and for your individual review.</li>
                  <li>You will <b>not redistribute, screenshot, or copy</b> any content.</li>
                  <li>All metrics and projections are <b>indicative</b> and subject to change.</li>
                  <li>Seeksy reserves the right to <b>revoke access</b> at any time.</li>
                </ul>
              </div>

              <div className="flex items-start gap-2 mt-4">
                <Checkbox
                  id="accept-disclaimer"
                  checked={disclaimerAccepted}
                  onCheckedChange={(c) => setDisclaimerAccepted(!!c)}
                />
                <label htmlFor="accept-disclaimer" className="text-sm text-slate-600 cursor-pointer">
                  I understand and agree to these terms.
                </label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDisclaimer(false)}>Cancel</Button>
              <Button onClick={handleAcceptDisclaimer} disabled={!disclaimerAccepted}>
                <Check className="w-4 h-4 mr-2" />
                I Agree & Continue
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Authenticated view
  const availableTabs = linkData?.scope || [];
  const scopeLabels: Record<string, { icon: React.ElementType; label: string }> = {
    dashboard: { icon: LayoutDashboard, label: 'Overview' },
    'business-model': { icon: Briefcase, label: 'Business Model' },
    gtm: { icon: Target, label: 'GTM Strategy' },
    forecasts: { icon: TrendingUp, label: 'Forecasts' },
    videos: { icon: Video, label: 'Videos' },
    documents: { icon: FileText, label: 'Documents' },
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Banner */}
      <div className="bg-blue-600 text-white py-2 px-4 text-center text-sm">
        <Shield className="w-4 h-4 inline-block mr-2" />
        You're viewing a secure investor snapshot of Seeksy. Metrics and projections are for evaluation purposes only.
      </div>

      {/* Header */}
      <header className="bg-white border-b border-slate-200 py-4 px-6 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <div>
              <h1 className="font-semibold text-slate-900">Seeksy Investor View</h1>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {linkData?.data_mode === 'demo' ? 'Demo Data' : 'Live Data'}
                </Badge>
                <span className="text-xs text-slate-500">Read-only access</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {linkData?.investor_name && (
              <span className="text-sm text-slate-500">Welcome, {linkData.investor_name}</span>
            )}
            <Badge className="bg-slate-800 text-white">
              Preview Mode — For Investor Review Only
            </Badge>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <Tabs defaultValue={availableTabs[0]} onValueChange={handleTabChange} className="w-full">
          <TabsList className="bg-slate-100 p-1 rounded-xl mb-6 flex-wrap h-auto gap-1">
            {availableTabs.map((tab) => {
              const config = scopeLabels[tab];
              if (!config) return null;
              const Icon = config.icon;
              return (
                <TabsTrigger key={tab} value={tab} className="rounded-lg">
                  <Icon className="w-4 h-4 mr-2" />
                  {config.label}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {availableTabs.includes('dashboard') && (
            <TabsContent value="dashboard">
              <div className="space-y-8">
                {/* Hero */}
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-8 text-white">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                      <Globe className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">Seeksy</h2>
                      <p className="text-blue-100">A clear window into Seeksy's creator and podcast growth ecosystem.</p>
                    </div>
                  </div>
                  <p className="text-blue-100 text-sm">
                    This investor preview includes strategy, metrics, and market position.
                  </p>
                </div>

                <KeyMetricsTab />
              </div>
            </TabsContent>
          )}

          {availableTabs.includes('business-model') && (
            <TabsContent value="business-model">
              <Card className="bg-white border-slate-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-blue-600" />
                    Business Model Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="p-4 bg-blue-50 rounded-xl">
                      <h3 className="font-semibold text-slate-900 mb-2">Primary Revenue</h3>
                      <p className="text-sm text-slate-600">Creator subscriptions (SaaS model) with tiered pricing.</p>
                    </div>
                    <div className="p-4 bg-emerald-50 rounded-xl">
                      <h3 className="font-semibold text-slate-900 mb-2">Secondary Revenue</h3>
                      <p className="text-sm text-slate-600">Ad marketplace with CPM-based creator revenue share.</p>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <h3 className="font-semibold text-slate-900 mb-2">Competitive Moat</h3>
                    <p className="text-sm text-slate-600">
                      Unified creator OS combining identity, hosting, events, CRM, monetization, and AI into one integrated system.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {availableTabs.includes('gtm') && (
            <TabsContent value="gtm">
              <div className="space-y-8">
                <MarketOverviewTab />
                <GTMStrategyTab />
                <CompetitiveLandscapeTab />
                <SWOTAnalysisTab />
              </div>
            </TabsContent>
          )}

          {availableTabs.includes('forecasts') && (
            <TabsContent value="forecasts">
              <Card className="bg-white border-slate-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    3-Year Growth Forecast
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="p-6 bg-slate-50 rounded-xl text-center">
                      <p className="text-sm text-slate-500 mb-2">Year 1</p>
                      <p className="text-3xl font-bold text-slate-900">10K</p>
                      <p className="text-sm text-slate-600">Creators</p>
                      <p className="text-xs text-slate-400 mt-2">Focus: Product-market fit</p>
                    </div>
                    <div className="p-6 bg-blue-50 rounded-xl text-center">
                      <p className="text-sm text-blue-600 mb-2">Year 2</p>
                      <p className="text-3xl font-bold text-blue-700">50K</p>
                      <p className="text-sm text-blue-600">Creators</p>
                      <p className="text-xs text-blue-400 mt-2">Focus: Marketplace launch</p>
                    </div>
                    <div className="p-6 bg-indigo-50 rounded-xl text-center">
                      <p className="text-sm text-indigo-600 mb-2">Year 3</p>
                      <p className="text-3xl font-bold text-indigo-700">200K</p>
                      <p className="text-sm text-indigo-600">Creators</p>
                      <p className="text-xs text-indigo-400 mt-2">Target: $10M ARR</p>
                    </div>
                  </div>
                  
                  {linkData?.mask_financials && (
                    <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-center">
                      <p className="text-sm text-amber-700">
                        <b>Detailed financials available upon NDA.</b> Contact the board for full projections.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {availableTabs.includes('videos') && (
            <TabsContent value="videos">
              <Card className="bg-white border-slate-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Video className="w-5 h-5 text-blue-600" />
                    Platform Videos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="aspect-video bg-slate-900 rounded-xl overflow-hidden">
                    <video 
                      controls 
                      className="w-full h-full"
                      poster="https://taxqcioheqdqtlmjeaht.supabase.co/storage/v1/object/public/demo-videos/thumbnail.jpg"
                    >
                      <source 
                        src="https://taxqcioheqdqtlmjeaht.supabase.co/storage/v1/object/public/demo-videos/Seeksy_%20Creator's%20Engine.mp4" 
                        type="video/mp4" 
                      />
                    </video>
                  </div>
                  <div className="mt-4">
                    <h3 className="font-semibold text-slate-900">Seeksy Overview — Creator's Engine</h3>
                    <p className="text-sm text-slate-600">Overview of the platform, business model, and growth strategy.</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {availableTabs.includes('documents') && (
            <TabsContent value="documents">
              <Card className="bg-white border-slate-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    Documents
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-500 text-center py-8">
                    No documents have been shared with this link.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>

        {/* Contact CTA */}
        <div className="mt-12 text-center p-8 bg-slate-100 rounded-2xl">
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Interested in Deeper Diligence?</h3>
          <p className="text-slate-600 mb-4">
            Request a live walkthrough or access additional materials.
          </p>
          <Button asChild>
            <a href="mailto:hello@seeksy.io">
              <Mail className="w-4 h-4 mr-2" />
              Contact Seeksy Team
            </a>
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 px-6 mt-12">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-xs text-slate-400">
            © 2024 Seeksy. All rights reserved. This investor view is confidential and for evaluation purposes only.
          </p>
        </div>
      </footer>
    </div>
  );
}
