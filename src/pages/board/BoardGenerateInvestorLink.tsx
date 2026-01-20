import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { 
  Link2, Shield, Copy, Check, AlertTriangle, ArrowRight, ArrowLeft, 
  Mail, Video, ChevronDown, ChevronUp, TrendingUp, Send, ExternalLink
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';

interface DemoVideo {
  id: string;
  title: string;
  description: string | null;
  category: string;
  thumbnail_url: string | null;
}

const scopeOptions = [
  { id: 'dashboard', label: 'Dashboard KPIs' },
  { id: 'business-model', label: 'Business Model' },
  { id: 'gtm', label: 'GTM Strategy' },
  { id: 'forecasts', label: '3-Year Forecasts' },
  { id: 'videos', label: 'Platform Videos' },
  { id: 'documents', label: 'Documents' },
];

const durationOptions = [
  { value: '24h', label: '24 hours' },
  { value: '3d', label: '3 days' },
  { value: '7d', label: '7 days' },
  { value: 'custom', label: 'Custom' },
  { value: 'never', label: 'No expiration' },
];

export default function BoardGenerateInvestorLink() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'configure' | 'confirm' | 'success'>('configure');
  const [isCreating, setIsCreating] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [copied, setCopied] = useState(false);

  // Form state
  const [investorName, setInvestorName] = useState('');
  const [investorEmail, setInvestorEmail] = useState('');
  const [personalMessage, setPersonalMessage] = useState('');
  const [scope, setScope] = useState<string[]>(['dashboard', 'gtm', 'forecasts', 'videos']);
  const [selectedVideos, setSelectedVideos] = useState<string[]>([]);
  const [showVideoSelector, setShowVideoSelector] = useState(false);
  const [dataMode, setDataMode] = useState<'demo' | 'real'>('demo');
  const [duration, setDuration] = useState('7d');
  const [customDays, setCustomDays] = useState('14');
  const [allowAI, setAllowAI] = useState(true);
  const [allowPDF, setAllowPDF] = useState(false);
  const [maskFinancials, setMaskFinancials] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  
  // Financial options
  const [overallAdjustment, setOverallAdjustment] = useState<'+' | '-'>('+');
  const [adjustmentPercent, setAdjustmentPercent] = useState('0');
  const [useRealTimeFinancials, setUseRealTimeFinancials] = useState(false);
  const [allowSpreadsheetView, setAllowSpreadsheetView] = useState(true);
  const [allowDownload, setAllowDownload] = useState(false);
  
  // Board member info
  const [boardMemberName, setBoardMemberName] = useState('');
  const [boardMemberEmail, setBoardMemberEmail] = useState('');

  // Generated link
  const [generatedData, setGeneratedData] = useState<{
    id: string;
    url: string;
    passcode: string;
    token: string;
  } | null>(null);

  // Fetch user info
  useState(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setBoardMemberEmail(user.email || '');
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();
        setBoardMemberName(profile?.full_name || user.email?.split('@')[0] || 'Board Member');
      }
    };
    fetchUser();
  });

  // Fetch available demo videos
  const { data: demoVideos } = useQuery({
    queryKey: ['demo-videos-for-share'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('demo_videos')
        .select('id, title, description, category, thumbnail_url')
        .order('order_index');
      if (error) throw error;
      return data as DemoVideo[];
    },
  });

  const toggleVideo = (videoId: string) => {
    setSelectedVideos(prev => 
      prev.includes(videoId) 
        ? prev.filter(id => id !== videoId)
        : [...prev, videoId]
    );
  };

  const selectAllVideos = () => {
    if (demoVideos) {
      setSelectedVideos(demoVideos.map(v => v.id));
    }
  };

  const clearAllVideos = () => {
    setSelectedVideos([]);
  };

  const toggleScope = (id: string) => {
    setScope(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  const calculateExpiration = () => {
    if (duration === 'never') return null;
    const now = new Date();
    switch (duration) {
      case '24h': return new Date(now.getTime() + 24 * 60 * 60 * 1000);
      case '3d': return new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
      case '7d': return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      case 'custom': return new Date(now.getTime() + parseInt(customDays) * 24 * 60 * 60 * 1000);
      default: return null;
    }
  };

  const generateToken = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let token = '';
    for (let i = 0; i < 12; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  };

  const generatePasscode = () => Math.floor(100000 + Math.random() * 900000).toString();

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const token = generateToken();
      const passcode = generatePasscode();
      const expiresAt = calculateExpiration();

      const { data, error } = await supabase.from('investor_links').insert({
        token,
        passcode,
        investor_name: investorName || null,
        created_by: user.id,
        expires_at: expiresAt?.toISOString(),
        data_mode: dataMode,
        scope,
        allow_ai: allowAI,
        allow_pdf_export: allowPDF,
        mask_financials: maskFinancials,
        what_was_shared: scope,
        selected_videos: selectedVideos.length > 0 ? selectedVideos : null,
        status: 'active',
      }).select().single();

      if (error) throw error;

      const url = `${window.location.origin}/investor/${token}`;
      setGeneratedData({ id: data.id, url, passcode, token });
      setStep('success');
      toast.success('Investor link created');
    } catch (error) {
      console.error('Error creating link:', error);
      toast.error('Failed to create link');
    } finally {
      setIsCreating(false);
    }
  };

  const handleSendEmail = async () => {
    if (!investorEmail || !generatedData) return;
    
    setIsSendingEmail(true);
    try {
      const { error } = await supabase.functions.invoke('send-investor-email', {
        body: {
          linkId: generatedData.id,
          investorEmail,
          investorName,
          message: personalMessage,
          boardMemberName,
          boardMemberEmail,
        },
      });

      if (error) throw error;

      toast.success('Invitation email sent successfully!');
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error('Failed to send email');
    } finally {
      setIsSendingEmail(false);
    }
  };

  const copyToClipboard = (text: string, label?: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success(label || 'Copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const scopeLabels: Record<string, string> = {
    dashboard: 'Dashboard KPIs',
    'business-model': 'Business Model',
    gtm: 'GTM Strategy',
    forecasts: '3-Year Forecasts',
    videos: 'Platform Videos',
    documents: 'Documents',
  };

  return (
    <div className="w-full space-y-6">
      <Button
        variant="ghost"
        className="text-slate-500 hover:text-slate-700 -ml-2"
        onClick={() => navigate('/board/investor-links')}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Investor Links
      </Button>

      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
          <Link2 className="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Generate Investor Link</h1>
          <p className="text-slate-500">Create a secure, time-limited link to share with investors</p>
        </div>
      </div>

      {step === 'configure' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Configuration */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Investor Details</CardTitle>
                <CardDescription>Enter the investor's information for personalization</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Investor Name</Label>
                    <Input
                      value={investorName}
                      onChange={(e) => setInvestorName(e.target.value)}
                      placeholder="e.g., Sequoia Capital"
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label>Investor Email <span className="text-red-500">*</span></Label>
                    <Input
                      type="email"
                      value={investorEmail}
                      onChange={(e) => setInvestorEmail(e.target.value)}
                      placeholder="investor@example.com"
                      className="mt-1.5"
                    />
                  </div>
                </div>
                <div>
                  <Label>Personal Message (optional)</Label>
                  <Textarea
                    value={personalMessage}
                    onChange={(e) => setPersonalMessage(e.target.value)}
                    placeholder="Add a personal note to the investor..."
                    className="mt-1.5"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Content Access</CardTitle>
                <CardDescription>Select what the investor can view</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {scopeOptions.map((opt) => (
                    <div key={opt.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50">
                      <Checkbox
                        id={opt.id}
                        checked={scope.includes(opt.id)}
                        onCheckedChange={() => toggleScope(opt.id)}
                      />
                      <label htmlFor={opt.id} className="text-sm cursor-pointer flex-1">{opt.label}</label>
                    </div>
                  ))}
                </div>

                {/* Video Selection */}
                {scope.includes('videos') && demoVideos && demoVideos.length > 0 && (
                  <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50">
                    <button
                      type="button"
                      onClick={() => setShowVideoSelector(!showVideoSelector)}
                      className="flex items-center justify-between w-full text-left"
                    >
                      <div className="flex items-center gap-2">
                        <Video className="w-4 h-4 text-purple-600" />
                        <span className="text-sm font-medium text-slate-700">
                          Select Specific Videos
                        </span>
                        <span className="text-xs text-slate-500">
                          ({selectedVideos.length === 0 ? 'All videos' : `${selectedVideos.length} selected`})
                        </span>
                      </div>
                      {showVideoSelector ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                    
                    {showVideoSelector && (
                      <div className="mt-3 space-y-2">
                        <div className="flex gap-2 mb-2">
                          <button
                            type="button"
                            onClick={selectAllVideos}
                            className="text-xs text-blue-600 hover:text-blue-700"
                          >
                            Select all
                          </button>
                          <span className="text-slate-300">|</span>
                          <button
                            type="button"
                            onClick={clearAllVideos}
                            className="text-xs text-slate-500 hover:text-slate-700"
                          >
                            Clear all
                          </button>
                        </div>
                        {demoVideos.map((video) => (
                          <div 
                            key={video.id} 
                            className="flex items-center gap-2 p-2 rounded-md hover:bg-white transition-colors"
                          >
                            <Checkbox
                              id={`video-${video.id}`}
                              checked={selectedVideos.includes(video.id)}
                              onCheckedChange={() => toggleVideo(video.id)}
                            />
                            <label 
                              htmlFor={`video-${video.id}`} 
                              className="flex-1 text-sm cursor-pointer text-slate-700"
                            >
                              {video.title}
                            </label>
                            <span className="text-xs text-slate-400">{video.category}</span>
                          </div>
                        ))}
                        <p className="text-xs text-slate-400 mt-2">
                          Leave empty to include all videos
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Data & Permissions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="mb-3 block">Data Mode</Label>
                  <RadioGroup value={dataMode} onValueChange={(v) => setDataMode(v as 'demo' | 'real')}>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="demo" id="demo" />
                      <label htmlFor="demo" className="text-sm cursor-pointer">
                        Demo Data Only <span className="text-emerald-600">(Recommended)</span>
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="real" id="real" />
                      <label htmlFor="real" className="text-sm cursor-pointer">
                        Real Data <span className="text-amber-600">(Restricted)</span>
                      </label>
                    </div>
                  </RadioGroup>
                  {dataMode === 'real' && (
                    <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Real data exposes live platform metrics
                    </p>
                  )}
                </div>

                <Separator />

                <div>
                  <Label className="mb-3 block">Access Duration</Label>
                  <div className="flex flex-wrap gap-2">
                    {durationOptions.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setDuration(opt.value)}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                          duration === opt.value
                            ? 'bg-blue-100 text-blue-700 font-medium'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  {duration === 'custom' && (
                    <div className="flex items-center gap-2 mt-2">
                      <Input
                        type="number"
                        value={customDays}
                        onChange={(e) => setCustomDays(e.target.value)}
                        className="w-20"
                        min="1"
                        max="90"
                      />
                      <span className="text-sm text-slate-600">days</span>
                    </div>
                  )}
                </div>

                <Separator />

                <div>
                  <Label className="mb-3 block">Permissions</Label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Checkbox id="ai" checked={allowAI} onCheckedChange={(c) => setAllowAI(!!c)} />
                      <label htmlFor="ai" className="text-sm cursor-pointer">Allow AI Q&A</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox id="pdf" checked={allowPDF} onCheckedChange={(c) => setAllowPDF(!!c)} />
                      <label htmlFor="pdf" className="text-sm cursor-pointer">Allow PDF export</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox id="mask" checked={maskFinancials} onCheckedChange={(c) => setMaskFinancials(!!c)} />
                      <label htmlFor="mask" className="text-sm cursor-pointer">Mask financial details</label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Financial Adjustments
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!useRealTimeFinancials && (
                  <div className="p-4 bg-slate-50 rounded-lg space-y-3">
                    <div className="text-sm font-medium text-slate-700">Overall Adjustment (All Scenarios)</div>
                    <p className="text-xs text-slate-500">
                      Apply +/- % adjustment to Conservative, Growth, and Aggressive projections
                    </p>
                    <div className="flex items-center gap-2">
                      <Select value={overallAdjustment} onValueChange={(v) => setOverallAdjustment(v as '+' | '-')}>
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="+">+</SelectItem>
                          <SelectItem value="-">-</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        value={adjustmentPercent}
                        onChange={(e) => setAdjustmentPercent(e.target.value)}
                        className="flex-1"
                        min="0"
                        max="100"
                      />
                      <span className="text-sm text-slate-600">%</span>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <div className="p-4 bg-slate-50 rounded-lg flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-slate-700">Use Real-Time Financials</div>
                      <p className="text-xs text-slate-500">Show live data from your actual system metrics</p>
                    </div>
                    <Switch checked={useRealTimeFinancials} onCheckedChange={setUseRealTimeFinancials} />
                  </div>
                  
                  <div className="p-4 bg-slate-50 rounded-lg flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-slate-700">Allow HTML Spreadsheet View</div>
                      <p className="text-xs text-slate-500">Investors can view spreadsheet in browser (read-only)</p>
                    </div>
                    <Switch checked={allowSpreadsheetView} onCheckedChange={setAllowSpreadsheetView} />
                  </div>
                  
                  <div className="p-4 bg-slate-50 rounded-lg flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-slate-700">Allow Download</div>
                      <p className="text-xs text-slate-500">Investors can download Excel/PDF files</p>
                    </div>
                    <Switch checked={allowDownload} onCheckedChange={setAllowDownload} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => navigate('/board/investor-links')}>
                Cancel
              </Button>
              <Button onClick={() => setStep('confirm')} disabled={scope.length === 0}>
                Continue to Review <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>

          {/* Sidebar Preview */}
          <div className="space-y-6">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="text-lg">Link Preview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-xs text-slate-500">Investor</Label>
                  <p className="text-sm font-medium">{investorName || 'Unnamed Investor'}</p>
                  {investorEmail && <p className="text-xs text-slate-500">{investorEmail}</p>}
                </div>
                
                <div>
                  <Label className="text-xs text-slate-500">Sections Included</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {scope.map((s) => (
                      <span key={s} className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                        {scopeLabels[s] || s}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-slate-500">Data Mode</Label>
                  <p className={`text-sm font-medium ${dataMode === 'demo' ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {dataMode === 'demo' ? 'Demo Data' : 'Real Data'}
                  </p>
                </div>

                <div>
                  <Label className="text-xs text-slate-500">Duration</Label>
                  <p className="text-sm font-medium">
                    {duration === 'never' ? 'No expiration' : 
                     duration === 'custom' ? `${customDays} days` :
                     durationOptions.find(d => d.value === duration)?.label}
                  </p>
                </div>

                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-amber-700">
                      A confidentiality notice will be automatically included in the email.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {step === 'confirm' && (
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              Confidentiality & Sharing Acknowledgment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-lg text-sm space-y-3">
              <p className="font-semibold text-slate-900">Confidential Information Notice</p>
              <p className="text-slate-600">
                By creating this investor view, you acknowledge that the information shared is 
                <b> confidential</b> and intended for a limited audience.
              </p>
              <p className="text-slate-700">I understand that:</p>
              <ul className="list-disc list-inside space-y-1 text-slate-600">
                <li>This link is for <b>one investor or firm only</b>.</li>
                <li>I am <b>responsible</b> for how this link is forwarded or used.</li>
                <li>Seeksy may <b>revoke access</b> at any time if misuse is detected.</li>
              </ul>
            </div>

            <div className="flex items-start gap-2">
              <Checkbox
                id="ack"
                checked={acknowledged}
                onCheckedChange={(c) => setAcknowledged(!!c)}
              />
              <label htmlFor="ack" className="text-sm text-slate-600 cursor-pointer">
                I confirm that I understand and accept these responsibilities.
              </label>
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep('configure')}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => navigate('/board/investor-links')}>Cancel</Button>
                <Button onClick={handleCreate} disabled={!acknowledged || isCreating}>
                  {isCreating ? 'Creating...' : 'I Agree & Create Link'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'success' && generatedData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-emerald-600">
                <Check className="w-5 h-5" />
                Link Created Successfully
              </CardTitle>
              <CardDescription>
                Your investor link is ready. Share it manually or send via email below.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs text-slate-500">Investor Link</Label>
                <div className="flex gap-2 mt-1">
                  <Input value={generatedData.url} readOnly className="font-mono text-sm" />
                  <Button variant="outline" size="icon" onClick={() => copyToClipboard(generatedData.url, 'Link copied')}>
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <div>
                <Label className="text-xs text-slate-500">Access Code</Label>
                <div className="flex gap-2 mt-1">
                  <Input value={generatedData.passcode} readOnly className="font-mono text-2xl tracking-[0.3em] text-center font-bold" />
                  <Button variant="outline" size="icon" onClick={() => copyToClipboard(generatedData.passcode, 'Code copied')}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => copyToClipboard(
                  `Seeksy Investor View\n\nLink: ${generatedData.url}\nAccess Code: ${generatedData.passcode}`,
                  'Link + code copied'
                )}
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy Link + Code
              </Button>

              <Button 
                variant="outline"
                className="w-full"
                onClick={() => window.open(generatedData.url, '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Preview Link
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-blue-600" />
                Send Email Invitation
              </CardTitle>
              <CardDescription>
                Send the access link directly to the investor's email
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Investor Email <span className="text-red-500">*</span></Label>
                <Input
                  type="email"
                  value={investorEmail}
                  onChange={(e) => setInvestorEmail(e.target.value)}
                  placeholder="investor@example.com"
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label>Investor Name</Label>
                <Input
                  value={investorName}
                  onChange={(e) => setInvestorName(e.target.value)}
                  placeholder="e.g., John Smith"
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label>Personal Message (optional)</Label>
                <Textarea
                  value={personalMessage}
                  onChange={(e) => setPersonalMessage(e.target.value)}
                  placeholder="Add a personal note to the investor..."
                  className="mt-1.5"
                  rows={3}
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-lg">
                <Label className="text-sm text-slate-600">Sections included:</Label>
                <div className="flex flex-wrap gap-1 mt-2">
                  {scope.map((s) => (
                    <span key={s} className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                      {scopeLabels[s] || s}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-amber-700">
                    A confidentiality notice will be automatically included stating this link is for investment evaluation only.
                  </p>
                </div>
              </div>

              <Button 
                className="w-full" 
                onClick={handleSendEmail} 
                disabled={!investorEmail || isSendingEmail}
              >
                {isSendingEmail ? 'Sending...' : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Invitation Email
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <div className="lg:col-span-2">
            <Button variant="outline" onClick={() => navigate('/board/investor-links')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Investor Links
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
