import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Share2, Shield, Copy, Check, AlertTriangle, Link2, ChevronDown, ChevronUp, Video } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

const scopeOptions = [
  { id: 'dashboard', label: 'Dashboard KPIs' },
  { id: 'business-model', label: 'Business Model' },
  { id: 'gtm', label: 'GTM Strategy' },
  { id: 'forecasts', label: 'Platform Pro Forma' },
  { id: 'awards-proforma', label: 'Events & Awards Pro Forma' },
  { id: 'videos', label: 'Platform Videos' },
  { id: 'documents', label: 'Documents' },
];

const durationOptions = [
  { value: '24h', label: '24 hours' },
  { value: '3d', label: '3 days' },
  { value: '7d', label: '7 days' },
  { value: 'never', label: 'No expiration' },
];

function generateToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 16; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

function generatePasscode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export default function BoardShare() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'configure' | 'confirm' | 'success'>('configure');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [videosExpanded, setVideosExpanded] = useState(false);
  
  // Fetch available videos
  const { data: availableVideos } = useQuery({
    queryKey: ['boardShareVideos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('demo_videos')
        .select('id, title, category')
        .order('order_index');
      
      if (error) throw error;
      return data || [];
    },
  });
  
  // Form state
  const [investorName, setInvestorName] = useState('');
  const [investorEmail, setInvestorEmail] = useState('');
  const [personalMessage, setPersonalMessage] = useState('');
  const [selectedScope, setSelectedScope] = useState<string[]>(['dashboard', 'gtm', 'forecasts']);
  const [selectedVideos, setSelectedVideos] = useState<string[]>([]);
  const [duration, setDuration] = useState('7d');
  const [allowAI, setAllowAI] = useState(true);
  const [allowPDF, setAllowPDF] = useState(false);
  const [allowHtmlView, setAllowHtmlView] = useState(true);
  const [allowDownload, setAllowDownload] = useState(false);
  const [sendEmail, setSendEmail] = useState(true);
  
  // Generated link data
  const [generatedLink, setGeneratedLink] = useState('');
  const [generatedPasscode, setGeneratedPasscode] = useState('');
  
  // Auto-select all videos when "videos" scope is selected
  useEffect(() => {
    if (selectedScope.includes('videos') && availableVideos && availableVideos.length > 0 && selectedVideos.length === 0) {
      setSelectedVideos(availableVideos.map(v => v.id));
    }
  }, [selectedScope, availableVideos]);

  const handleScopeChange = (scopeId: string, checked: boolean) => {
    if (checked) {
      setSelectedScope([...selectedScope, scopeId]);
    } else {
      setSelectedScope(selectedScope.filter(s => s !== scopeId));
    }
  };

  const handleVideoChange = (videoId: string, checked: boolean) => {
    if (checked) {
      setSelectedVideos([...selectedVideos, videoId]);
    } else {
      setSelectedVideos(selectedVideos.filter(v => v !== videoId));
    }
  };

  const handleContinue = () => {
    if (selectedScope.length === 0) {
      toast.error('Please select at least one section to share');
      return;
    }
    setStep('confirm');
  };

  const handleCreateLink = async () => {
    setIsLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in to create investor links');
        return;
      }

      const token = generateToken();
      const passcode = generatePasscode();
      
      let expiresAt: string | null = null;
      if (duration !== 'never') {
        const now = new Date();
        if (duration === '24h') now.setHours(now.getHours() + 24);
        if (duration === '3d') now.setDate(now.getDate() + 3);
        if (duration === '7d') now.setDate(now.getDate() + 7);
        expiresAt = now.toISOString();
      }

      // Build share configuration for investor viewing
      const shareConfig = {
        allowHtmlView,
        allowDownload,
        selectedVideos: selectedScope.includes('videos') ? selectedVideos : [],
      };

      const { data, error } = await supabase.from('investor_links').insert({
        token,
        passcode,
        investor_name: investorName || null,
        scope: selectedScope,
        allow_ai: allowAI,
        allow_pdf: allowPDF,
        allow_download: allowDownload,
        created_by: user.id,
        expires_at: expiresAt,
        status: 'active',
        share_config: shareConfig,
      }).select().single();

      if (error) throw error;

      const baseUrl = window.location.origin;
      setGeneratedLink(`${baseUrl}/investor/${token}`);
      setGeneratedPasscode(passcode);

      // Send email if email is provided and sendEmail is enabled
      if (sendEmail && investorEmail) {
        try {
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
              shareUrl: `${baseUrl}/investor/${token}`,
              passcode,
            },
          });
          toast.success('Investor link created and email sent');
        } catch (emailError) {
          console.error('Error sending email:', emailError);
          toast.warning('Link created but failed to send email');
        }
      } else {
        toast.success('Investor link created successfully');
      }

      setStep('success');
    } catch (error) {
      console.error('Error creating investor link:', error);
      toast.error('Failed to create investor link');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyAll = () => {
    const fullText = `Seeksy Investor View\n\nLink: ${generatedLink}\nAccess Code: ${generatedPasscode}\n\nThis is a secure, time-limited view of our business metrics.`;
    navigator.clipboard.writeText(fullText);
    toast.success('Link and code copied');
  };

  return (
    <div className="w-full space-y-6">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
            <Share2 className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Share with Investor</h1>
            <p className="text-slate-500">Create a secure, time-limited investor view</p>
          </div>
        </div>

        {step === 'configure' && (
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle>Create Investor View</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Investor Contact Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="investor-name">Investor Name (optional)</Label>
                  <Input
                    id="investor-name"
                    placeholder="e.g., Acme Ventures"
                    value={investorName}
                    onChange={(e) => setInvestorName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="investor-email">Investor Email</Label>
                  <Input
                    id="investor-email"
                    type="email"
                    placeholder="investor@example.com"
                    value={investorEmail}
                    onChange={(e) => setInvestorEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* Personal Message */}
              <div className="space-y-2">
                <Label htmlFor="personal-message">Personal Message (optional)</Label>
                <textarea
                  id="personal-message"
                  className="w-full min-h-[80px] px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Add a personal note to include in the email invitation..."
                  value={personalMessage}
                  onChange={(e) => setPersonalMessage(e.target.value)}
                />
                <p className="text-xs text-slate-500">This message will be included in the email along with the link and access code.</p>
              </div>

              {/* Send Email Toggle */}
              {investorEmail && (
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <div className="flex items-center gap-2">
                    <div>
                      <Label htmlFor="send-email" className="text-sm font-medium text-slate-700">
                        Send Email Invitation
                      </Label>
                      <p className="text-xs text-slate-500">Automatically send the link and access code to the investor</p>
                    </div>
                  </div>
                  <Switch
                    id="send-email"
                    checked={sendEmail}
                    onCheckedChange={setSendEmail}
                  />
                </div>
              )}

              {/* Scope */}
              <div className="space-y-3">
                <Label>What can they see?</Label>
                <div className="grid grid-cols-2 gap-3">
                  {scopeOptions.map((option) => (
                    <div key={option.id}>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={option.id}
                          checked={selectedScope.includes(option.id)}
                          onCheckedChange={(checked) => handleScopeChange(option.id, checked as boolean)}
                        />
                        <label htmlFor={option.id} className="text-sm text-slate-700 cursor-pointer">
                          {option.label}
                        </label>
                      </div>
                      
                      {/* Awards Pro Forma description */}
                      {option.id === 'awards-proforma' && selectedScope.includes('awards-proforma') && (
                        <div className="mt-2 ml-6 p-3 bg-amber-50 rounded-lg border border-amber-200">
                          <p className="text-xs text-amber-800">
                            Includes 3-year outlook for the Veteran Podcast Awards asset with strategic positioning and event metrics.
                          </p>
                          <a 
                            href="https://veteranpodcastawards.com" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-amber-700 underline hover:text-amber-900 mt-1 inline-block"
                          >
                            View VeteranPodcastAwards.com →
                          </a>
                        </div>
                      )}
                      
                      {/* Video Selection Dropdown - only show when videos is selected */}
                      {option.id === 'videos' && selectedScope.includes('videos') && availableVideos && availableVideos.length > 0 && (
                        <Collapsible 
                          open={videosExpanded} 
                          onOpenChange={setVideosExpanded}
                          className="mt-2 ml-6"
                        >
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1 text-slate-600">
                              <Video className="w-3 h-3" />
                              Select Videos ({selectedVideos.length}/{availableVideos.length})
                              {videosExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </Button>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="mt-2 p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                            {availableVideos.map((video) => (
                              <div key={video.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`video-${video.id}`}
                                  checked={selectedVideos.includes(video.id)}
                                  onCheckedChange={(checked) => handleVideoChange(video.id, checked as boolean)}
                                />
                                <label htmlFor={`video-${video.id}`} className="text-xs text-slate-700 cursor-pointer">
                                  {video.title}
                                </label>
                              </div>
                            ))}
                            <div className="flex gap-2 pt-2 border-t border-slate-200">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-6 text-xs"
                                onClick={() => setSelectedVideos(availableVideos.map(v => v.id))}
                              >
                                Select All
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-6 text-xs"
                                onClick={() => setSelectedVideos([])}
                              >
                                Clear
                              </Button>
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Data Mode - removed, now using CFO modeling */}

              {/* Duration */}
              <div className="space-y-3">
                <Label>Access Duration</Label>
                <div className="flex flex-wrap gap-2">
                  {durationOptions.map((option) => (
                    <Button
                      key={option.value}
                      variant={duration === option.value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setDuration(option.value)}
                      className={duration === option.value ? 'bg-blue-600' : ''}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Share Options */}
              <div className="space-y-3">
                <Label>Share Options</Label>
                <div className="space-y-3">

                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="space-y-0.5">
                      <Label htmlFor="html-view" className="text-sm font-medium">
                        Allow HTML Spreadsheet View
                      </Label>
                      <p className="text-xs text-slate-500">
                        Investors can view spreadsheet in browser (read-only)
                      </p>
                    </div>
                    <Switch
                      id="html-view"
                      checked={allowHtmlView}
                      onCheckedChange={setAllowHtmlView}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="space-y-0.5">
                      <Label htmlFor="download" className="text-sm font-medium">
                        Allow Download
                      </Label>
                      <p className="text-xs text-slate-500">
                        Investors can download Excel/PDF files
                      </p>
                    </div>
                    <Switch
                      id="download"
                      checked={allowDownload}
                      onCheckedChange={setAllowDownload}
                    />
                  </div>
                </div>
              </div>

              {/* Permissions */}
              <div className="space-y-3">
                <Label>AI & Export Permissions</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="allow-ai"
                      checked={allowAI}
                      onCheckedChange={(checked) => setAllowAI(checked as boolean)}
                    />
                    <label htmlFor="allow-ai" className="text-sm text-slate-700 cursor-pointer">
                      Allow AI Q&A inside investor view
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="allow-pdf"
                      checked={allowPDF}
                      onCheckedChange={(checked) => setAllowPDF(checked as boolean)}
                    />
                    <label htmlFor="allow-pdf" className="text-sm text-slate-700 cursor-pointer">
                      Allow export to PDF
                    </label>
                  </div>
                </div>
              </div>

              <Button className="w-full" onClick={handleContinue}>
                Continue
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Confirmation Dialog */}
        <Dialog open={step === 'confirm'} onOpenChange={() => setStep('configure')}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                Confidentiality & Sharing Acknowledgment
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="p-4 bg-slate-50 rounded-lg text-sm text-slate-700 space-y-3">
                <p><b>Confidential Information Notice</b></p>
                <p>
                  By creating this investor view, you acknowledge that the information shared is 
                  confidential and intended for a limited audience.
                </p>
                <p>I understand that:</p>
                <ul className="list-disc list-inside space-y-1 text-slate-600">
                  <li>This link is for one investor or firm only.</li>
                  <li>I am responsible for how this link is forwarded or used.</li>
                  <li>Seeksy may revoke access at any time if misuse is detected.</li>
                </ul>
                <p className="text-xs text-slate-500 pt-2">
                  By clicking "I Agree & Create Link", I confirm that I understand and accept these responsibilities.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep('configure')} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleCreateLink} disabled={isLoading} className="flex-1 bg-blue-600">
                {isLoading ? 'Creating...' : 'I Agree & Create Link'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Success State */}
        {step === 'success' && (
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-emerald-600" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900 mb-2">Link Created Successfully</h2>
              <p className="text-slate-500 mb-6">Share these details with your investor</p>

              <div className="space-y-4 text-left">
                <div className="p-4 bg-slate-50 rounded-lg">
                  <Label className="text-xs text-slate-500">Investor Link</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input value={generatedLink} readOnly className="font-mono text-sm" />
                    <Button size="icon" variant="outline" onClick={() => handleCopy(generatedLink)}>
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-lg">
                  <Label className="text-xs text-slate-500">Access Code</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input value={generatedPasscode} readOnly className="font-mono text-2xl tracking-[0.3em] text-center" />
                    <Button size="icon" variant="outline" onClick={() => handleCopy(generatedPasscode)}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <Button className="w-full mt-6" onClick={handleCopyAll}>
                <Link2 className="w-4 h-4 mr-2" />
                Copy Link + Code for Email
              </Button>

              <p className="text-xs text-slate-400 mt-4">
                Tip: We recommend including the passcode in a separate line for security.
              </p>

              <div className="flex gap-3 mt-6">
                <Button variant="outline" onClick={() => navigate('/board/investor-links')} className="flex-1">
                  View All Links
                </Button>
                <Button variant="outline" onClick={() => {
                  setStep('configure');
                  setInvestorName('');
                  setSelectedScope(['dashboard', 'gtm', 'forecasts']);
                }} className="flex-1">
                  Create Another
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
    </div>
  );
}
