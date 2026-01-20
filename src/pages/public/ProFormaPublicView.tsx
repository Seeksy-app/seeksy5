import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Lock, ExternalLink, AlertTriangle, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import ProFormaFinancialTables from '@/components/cfo/proforma/ProFormaFinancialTables';
import ProFormaCharts from '@/components/cfo/proforma/ProFormaCharts';
import { useProFormaData } from '@/hooks/useProFormaData';

export default function ProFormaPublicView() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [step, setStep] = useState<'verify' | 'consent' | 'view'>('verify');
  const [passcode, setPasscode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [linkData, setLinkData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const { financialData } = useProFormaData();

  useEffect(() => {
    // Check if link exists
    const checkLink = async () => {
      if (!token) return;
      
      const { data, error } = await supabase
        .from('proforma_share_links' as any)
        .select('*')
        .eq('token', token)
        .eq('status', 'active')
        .single();

      if (error || !data) {
        setError('This link is invalid or has expired.');
        return;
      }

      const linkRecord = data as any;
      if (linkRecord.expires_at && new Date(linkRecord.expires_at) < new Date()) {
        setError('This link has expired.');
        return;
      }

      setLinkData(linkRecord);
    };

    checkLink();
  }, [token]);

  const handleVerify = async () => {
    if (!passcode.trim()) {
      toast.error('Please enter the access code');
      return;
    }

    setIsVerifying(true);
    try {
      if (linkData?.passcode !== passcode) {
        toast.error('Invalid access code');
        return;
      }

      // Log access
      await supabase.from('proforma_share_links' as any).update({
        views: (linkData.views || 0) + 1,
        last_viewed_at: new Date().toISOString(),
      }).eq('id', linkData.id);

      setStep('consent');
    } catch (err) {
      toast.error('Verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleAcceptConsent = () => {
    if (!accepted) {
      toast.error('Please accept the confidentiality agreement');
      return;
    }
    setStep('view');
  };

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-8 pb-6">
            <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'verify') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-[#053877]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-[#053877]" />
            </div>
            <CardTitle>Seeksy Pro Forma</CardTitle>
            <CardDescription>Enter your access code to continue</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Access Code</Label>
              <Input
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Enter 6-digit code"
                className="mt-1.5 text-center text-2xl tracking-widest"
                maxLength={6}
              />
            </div>
            <Button 
              className="w-full bg-[#053877] hover:bg-[#053877]/90"
              onClick={handleVerify}
              disabled={isVerifying}
            >
              {isVerifying ? 'Verifying...' : 'Verify & Continue'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'consent') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <Card className="max-w-lg w-full">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
            <CardTitle>Confidentiality Agreement</CardTitle>
            <CardDescription>Please review and accept before proceeding</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-lg text-sm space-y-3 max-h-64 overflow-y-auto">
              <p className="font-semibold text-slate-900">CONFIDENTIAL INFORMATION</p>
              <p className="text-slate-600">
                The financial projections and business information contained in this Pro Forma are 
                <b> strictly confidential</b> and proprietary to Seeksy.
              </p>
              <p className="text-slate-700 font-medium mt-4">By proceeding, you agree to:</p>
              <ul className="list-disc list-inside space-y-1 text-slate-600">
                <li>Keep all information <b>strictly confidential</b></li>
                <li><b>Not share, copy, or distribute</b> any content from this document</li>
                <li><b>Not take screenshots</b> or create copies of any information</li>
                <li>Use this information <b>solely for evaluation purposes</b></li>
                <li>Return or destroy all materials upon request</li>
              </ul>
              <p className="text-slate-600 mt-4">
                Unauthorized disclosure may result in legal action. This access is logged and monitored.
              </p>
            </div>

            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
              <Checkbox
                id="accept"
                checked={accepted}
                onCheckedChange={(c) => setAccepted(!!c)}
              />
              <label htmlFor="accept" className="text-sm text-slate-700 cursor-pointer">
                I have read, understood, and agree to the confidentiality terms above. I acknowledge that this document contains proprietary financial information.
              </label>
            </div>

            <Button 
              className="w-full bg-[#053877] hover:bg-[#053877]/90"
              onClick={handleAcceptConsent}
              disabled={!accepted}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              I Agree & Continue
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // View step - show the Pro Forma
  return (
    <div className="min-h-screen bg-background">
      <div className="bg-[#053877] text-white py-4 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Seeksy Events & Awards Pro Forma</h1>
            <p className="text-white/70 text-sm">Confidential Financial Projections</p>
          </div>
          <Button
            variant="outline"
            className="border-white/30 text-white hover:bg-white/10"
            onClick={() => window.open('https://veteranpodcastawards.com/', '_blank')}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            View Veteran Podcast Awards Site
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="charts">Charts</TabsTrigger>
            <TabsTrigger value="summary">Summary</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-l-4 border-l-[#053877] rounded-lg">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    2028 Projected Revenue
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-[#053877]">
                    ${(financialData.revenue[2] / 1000000).toFixed(2)}M
                  </p>
                  <p className="text-sm text-green-600 mt-1">
                    +{(((financialData.revenue[2] - financialData.revenue[0]) / financialData.revenue[0]) * 100).toFixed(0)}% growth from 2026
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-emerald-500 rounded-lg">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    2028 Projected EBITDA
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-emerald-600">
                    ${(financialData.ebitda[2] / 1000).toFixed(0)}K
                  </p>
                  <p className="text-sm text-emerald-600 mt-1">
                    {((financialData.ebitda[2] / financialData.revenue[2]) * 100).toFixed(1)}% margin
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-amber-500 rounded-lg">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    3-Year CAGR
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-amber-600">
                    {(Math.pow(financialData.revenue[2] / financialData.revenue[0], 1/2) * 100 - 100).toFixed(1)}%
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Compound Annual Growth Rate
                  </p>
                </CardContent>
              </Card>
            </div>

            <ProFormaFinancialTables data={financialData} />
          </TabsContent>

          <TabsContent value="charts">
            <ProFormaCharts data={financialData} />
          </TabsContent>

          <TabsContent value="summary">
            <Card className="rounded-lg">
              <CardHeader>
                <CardTitle className="text-xl text-[#053877]">
                  Events & Awards Platform — Offering Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="prose prose-slate max-w-none">
                <p>
                  The Seeksy Events & Awards Platform is a fully developed, production-ready system designed to power category-based award shows, live competitions, creator recognition programs, and branded event experiences across multiple verticals.
                </p>
                <h3>Strategic Opportunity</h3>
                <p>
                  The platform supports high-margin, repeatable annual revenue through presenting sponsors, category sponsorships, livestream ads, branded editorial content, and event licensing.
                </p>
                <h3>Financial Outlook</h3>
                <ul>
                  <li>$503K revenue in Year 1 post-acquisition</li>
                  <li>$1.55M+ revenue by Year 3</li>
                  <li>EBITDA approaching $1M annually by Year 3</li>
                  <li>57%+ CAGR</li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* VPA Link */}
        <div className="mt-8 text-center">
          <a 
            href="https://veteranpodcastawards.com/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-[#053877] hover:underline font-medium"
          >
            <ExternalLink className="w-4 h-4" />
            View the Veteran Podcast Awards site
          </a>
        </div>
      </div>
    </div>
  );
}
