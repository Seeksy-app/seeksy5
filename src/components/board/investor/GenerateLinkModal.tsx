import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Link2, Shield, Copy, Check, AlertTriangle, ArrowRight, ArrowLeft, 
  Mail, Eye, Clock, Calendar, Video, ChevronDown, ChevronUp, Settings, TrendingUp
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { SendInvestorEmailModal } from './SendInvestorEmailModal';
import { useQuery } from '@tanstack/react-query';

interface GenerateLinkModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

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

export function GenerateLinkModal({ open, onOpenChange, onSuccess }: GenerateLinkModalProps) {
  const [step, setStep] = useState<'configure' | 'confirm' | 'success'>('configure');
  const [isCreating, setIsCreating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sendEmailOpen, setSendEmailOpen] = useState(false);

  // Form state
  const [investorName, setInvestorName] = useState('');
  const [investorEmail, setInvestorEmail] = useState('');
  const [personalMessage, setPersonalMessage] = useState('');
  const [scope, setScope] = useState<string[]>(['dashboard', 'gtm', 'forecasts']);
  const [selectedVideos, setSelectedVideos] = useState<string[]>([]);
  const [showVideoSelector, setShowVideoSelector] = useState(false);
  const [dataMode, setDataMode] = useState<'demo' | 'real'>('demo');
  const [duration, setDuration] = useState('7d');
  const [customDays, setCustomDays] = useState('14');
  const [allowAI, setAllowAI] = useState(true);
  const [allowPDF, setAllowPDF] = useState(false);
  const [maskFinancials, setMaskFinancials] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [sendEmail, setSendEmail] = useState(true); // Default to sending email
  
  // New Image 3 options
  const [overallAdjustment, setOverallAdjustment] = useState<'+' | '-'>('+');
  const [adjustmentPercent, setAdjustmentPercent] = useState('0');
  const [useRealTimeFinancials, setUseRealTimeFinancials] = useState(false);
  const [allowSpreadsheetView, setAllowSpreadsheetView] = useState(true);
  const [allowDownload, setAllowDownload] = useState(false);

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

  // Generated link
  const [generatedData, setGeneratedData] = useState<{
    id: string;
    url: string;
    passcode: string;
    token: string;
  } | null>(null);

  const resetForm = () => {
    setStep('configure');
    setInvestorName('');
    setInvestorEmail('');
    setPersonalMessage('');
    setScope(['dashboard', 'gtm', 'forecasts']);
    setSelectedVideos([]);
    setShowVideoSelector(false);
    setDataMode('demo');
    setDuration('7d');
    setCustomDays('14');
    setAllowAI(true);
    setAllowPDF(false);
    setMaskFinancials(false);
    setAcknowledged(false);
    setGeneratedData(null);
    setCopied(false);
    setOverallAdjustment('+');
    setAdjustmentPercent('0');
    setUseRealTimeFinancials(false);
    setAllowSpreadsheetView(true);
    setAllowDownload(false);
    setSendEmail(true);
  };

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

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(resetForm, 300);
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

      // If email is provided and sendEmail is true, send the email automatically
      if (sendEmail && investorEmail) {
        try {
          // Get board member info
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', user.id)
            .single();
          
          const boardMemberName = profile?.full_name || user.email?.split('@')[0] || 'Board Member';

          await supabase.functions.invoke('send-investor-email', {
            body: {
              linkId: data.id,
              investorEmail,
              investorName,
              message: personalMessage,
              boardMemberName,
              boardMemberEmail: user.email,
            },
          });
          toast.success('Link created and email sent to investor');
        } catch (emailError) {
          console.error('Error sending email:', emailError);
          toast.warning('Link created but failed to send email');
        }
      } else {
        toast.success('Investor link created');
      }

      setStep('success');
      onSuccess?.();
    } catch (error) {
      console.error('Error creating link:', error);
      toast.error('Failed to create link');
    } finally {
      setIsCreating(false);
    }
  };

  const copyToClipboard = (text: string, label?: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success(label || 'Copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          {step === 'configure' && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Link2 className="w-5 h-5 text-blue-600" />
                  Generate New Investor Link
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-5 py-4">
                {/* Investor Contact Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Investor Name (optional)</Label>
                    <Input
                      value={investorName}
                      onChange={(e) => setInvestorName(e.target.value)}
                      placeholder="e.g., Sequoia Capital"
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label>Investor Email</Label>
                    <Input
                      type="email"
                      value={investorEmail}
                      onChange={(e) => setInvestorEmail(e.target.value)}
                      placeholder="investor@example.com"
                      className="mt-1.5"
                    />
                  </div>
                </div>

                {/* Personal Message */}
                <div>
                  <Label>Personal Message (optional)</Label>
                  <Textarea
                    value={personalMessage}
                    onChange={(e) => setPersonalMessage(e.target.value)}
                    placeholder="Add a personal note to include in the email invitation..."
                    className="mt-1.5"
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    This message will be included in the email along with the link and access code.
                  </p>
                </div>

                {/* Send Email Toggle */}
                <div className="p-3 bg-blue-50 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-blue-600" />
                    <div>
                      <div className="text-sm font-medium text-slate-700">Send Email Invitation</div>
                      <p className="text-xs text-slate-500">Automatically send the link and access code to the investor</p>
                    </div>
                  </div>
                  <Switch 
                    checked={sendEmail} 
                    onCheckedChange={setSendEmail}
                    disabled={!investorEmail}
                  />
                </div>

                <div>
                  <Label className="mb-3 block">What can they see?</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {scopeOptions.map((opt) => (
                      <div key={opt.id} className="flex items-center gap-2">
                        <Checkbox
                          id={opt.id}
                          checked={scope.includes(opt.id)}
                          onCheckedChange={() => toggleScope(opt.id)}
                        />
                        <label htmlFor={opt.id} className="text-sm cursor-pointer">{opt.label}</label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Available Videos Section - always visible */}
                {demoVideos && demoVideos.length > 0 && (
                  <div className="border border-purple-200 rounded-lg p-4 bg-purple-50/50">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Video className="w-5 h-5 text-purple-600" />
                        <span className="text-sm font-semibold text-slate-800">
                          Available Videos ({demoVideos.length})
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={selectAllVideos}
                          className="text-xs text-purple-600 hover:text-purple-700 font-medium"
                        >
                          Select all
                        </button>
                        <span className="text-slate-300">|</span>
                        <button
                          type="button"
                          onClick={clearAllVideos}
                          className="text-xs text-slate-500 hover:text-slate-700"
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {demoVideos.map((video) => (
                        <div 
                          key={video.id} 
                          className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                            selectedVideos.includes(video.id) 
                              ? 'bg-purple-100 border-purple-300' 
                              : 'bg-white border-slate-200 hover:border-purple-200'
                          }`}
                          onClick={() => toggleVideo(video.id)}
                        >
                          {video.thumbnail_url && (
                            <img 
                              src={video.thumbnail_url} 
                              alt={video.title}
                              className="w-12 h-8 object-cover rounded"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-700 truncate">
                              {video.title}
                            </p>
                            <p className="text-xs text-slate-500">{video.category}</p>
                          </div>
                          <Checkbox
                            id={`video-${video.id}`}
                            checked={selectedVideos.includes(video.id)}
                            onCheckedChange={() => toggleVideo(video.id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      ))}
                    </div>
                    
                    <p className="text-xs text-slate-500 mt-3">
                      {selectedVideos.length === 0 
                        ? 'No videos selected — all videos will be accessible by default'
                        : `${selectedVideos.length} video${selectedVideos.length > 1 ? 's' : ''} selected for sharing`
                      }
                    </p>
                  </div>
                )}

                {/* Data now always uses CFO modeling */}

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

                {/* Share Options Section */}
                <div className="border-t pt-4 space-y-4">
                  
                  <div className="p-4 bg-slate-50 rounded-lg flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-slate-700">Allow HTML Spreadsheet View</div>
                      <p className="text-xs text-slate-500">Investors can view spreadsheet in browser (read-only)</p>
                    </div>
                    <Switch 
                      checked={allowSpreadsheetView} 
                      onCheckedChange={setAllowSpreadsheetView} 
                    />
                  </div>
                  
                  <div className="p-4 bg-slate-50 rounded-lg flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-slate-700">Allow Download</div>
                      <p className="text-xs text-slate-500">Investors can download Excel/PDF files</p>
                    </div>
                    <Switch 
                      checked={allowDownload} 
                      onCheckedChange={setAllowDownload} 
                    />
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={handleClose}>Cancel</Button>
                <Button onClick={() => setStep('confirm')} disabled={scope.length === 0}>
                  Continue <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </DialogFooter>
            </>
          )}

          {step === 'confirm' && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-600" />
                  Confidentiality & Sharing Acknowledgment
                </DialogTitle>
              </DialogHeader>

              <div className="py-4">
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

                <div className="flex items-start gap-2 mt-4">
                  <Checkbox
                    id="ack"
                    checked={acknowledged}
                    onCheckedChange={(c) => setAcknowledged(!!c)}
                  />
                  <label htmlFor="ack" className="text-sm text-slate-600 cursor-pointer">
                    I confirm that I understand and accept these responsibilities.
                  </label>
                </div>
              </div>

              <DialogFooter className="flex justify-between">
                <Button variant="outline" onClick={() => setStep('configure')}>
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleClose}>Cancel</Button>
                  <Button onClick={handleCreate} disabled={!acknowledged || isCreating}>
                    {isCreating ? 'Creating...' : 'I Agree & Create Link'}
                  </Button>
                </div>
              </DialogFooter>
            </>
          )}

          {step === 'success' && generatedData && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-emerald-600">
                  <Check className="w-5 h-5" />
                  {sendEmail && investorEmail ? 'Link Created & Email Sent' : 'Link Created Successfully'}
                </DialogTitle>
              </DialogHeader>

              <div className="py-4 space-y-4">
                {sendEmail && investorEmail && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    <span>Email sent to <b>{investorEmail}</b> with link and access code.</span>
                  </div>
                )}

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
                    <Input value={generatedData.passcode} readOnly className="font-mono text-xl tracking-widest text-center" />
                    <Button variant="outline" size="icon" onClick={() => copyToClipboard(generatedData.passcode, 'Code copied')}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    className="flex-1" 
                    onClick={() => copyToClipboard(
                      `Seeksy Investor View\n\nLink: ${generatedData.url}\nAccess Code: ${generatedData.passcode}`,
                      'Link + code copied'
                    )}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Link + Code
                  </Button>
                  {/* Only show Send Email button if we didn't already send one */}
                  {!(sendEmail && investorEmail) && (
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => setSendEmailOpen(true)}
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      Send Email
                    </Button>
                  )}
                </div>

                <div className="p-3 bg-blue-50 rounded-lg text-xs text-blue-700">
                  <b>Quick Actions:</b> Copy the link to share manually{!(sendEmail && investorEmail) && ', or send an email invitation directly'}.
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={handleClose}>Done</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {generatedData && (
        <SendInvestorEmailModal
          open={sendEmailOpen}
          onOpenChange={setSendEmailOpen}
          linkId={generatedData.id}
          linkToken={generatedData.token}
          passcode={generatedData.passcode}
          defaultInvestorName={investorName}
          scope={scope}
        />
      )}
    </>
  );
}
