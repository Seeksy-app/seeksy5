import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Shield, Copy, Check, AlertTriangle, Link2, ArrowRight, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { User } from '@supabase/supabase-js';

interface InvestorShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const scopeOptions = [
  { id: 'dashboard', label: 'Dashboard KPIs' },
  { id: 'business-model', label: 'Business Model' },
  { id: 'gtm', label: 'GTM Strategy' },
  { id: 'forecasts', label: '3-Year Forecasts' },
  { id: 'videos', label: 'Platform Videos' },
  { id: 'documents', label: 'Documents (Board Decks, Terms, etc.)' },
];

const durationOptions = [
  { value: '24h', label: '24 hours' },
  { value: '3d', label: '3 days' },
  { value: '7d', label: '7 days' },
  { value: 'never', label: 'No expiration' },
];

export function InvestorShareModal({ open, onOpenChange }: InvestorShareModalProps) {
  const [user, setUser] = useState<User | null>(null);
  
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);
  const [step, setStep] = useState(1);
  const [isCreating, setIsCreating] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Form state
  const [investorName, setInvestorName] = useState('');
  const [scope, setScope] = useState<string[]>(['dashboard', 'business-model', 'gtm', 'forecasts', 'videos']);
  const [dataMode, setDataMode] = useState<'demo' | 'real'>('demo');
  const [duration, setDuration] = useState('7d');
  const [allowAI, setAllowAI] = useState(true);
  const [allowPDF, setAllowPDF] = useState(false);
  
  // Generated link state
  const [generatedLink, setGeneratedLink] = useState<{ url: string; passcode: string } | null>(null);

  const resetForm = () => {
    setStep(1);
    setInvestorName('');
    setScope(['dashboard', 'business-model', 'gtm', 'forecasts', 'videos']);
    setDataMode('demo');
    setDuration('7d');
    setAllowAI(true);
    setAllowPDF(false);
    setGeneratedLink(null);
    setCopied(false);
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(resetForm, 300);
  };

  const toggleScope = (id: string) => {
    setScope(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const calculateExpiration = () => {
    if (duration === 'never') return null;
    const now = new Date();
    switch (duration) {
      case '24h': return new Date(now.getTime() + 24 * 60 * 60 * 1000);
      case '3d': return new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
      case '7d': return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      default: return null;
    }
  };

  const generateToken = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  const generatePasscode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const handleCreateLink = async () => {
    setIsCreating(true);
    try {
      const token = generateToken();
      const passcode = generatePasscode();
      const expiresAt = calculateExpiration();

      const result = await (supabase as any).from('investor_links').insert({
        token,
        passcode,
        investor_name: investorName || null,
        created_by: user?.id,
        expires_at: expiresAt?.toISOString(),
        data_mode: dataMode,
        scope,
        allow_ai: allowAI,
        allow_pdf_export: allowPDF,
      });

      if (result.error) throw result.error;

      const url = `${window.location.origin}/investor/${token}`;
      setGeneratedLink({ url, passcode });
      setStep(3);
      toast.success('Investor link created successfully');
    } catch (error) {
      console.error('Error creating investor link:', error);
      toast.error('Failed to create investor link');
    } finally {
      setIsCreating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        {step === 1 && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Link2 className="w-5 h-5 text-blue-600" />
                Create Investor View
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-5 py-4">
              <div>
                <Label className="text-sm text-slate-600">Investor Name (optional)</Label>
                <Input
                  value={investorName}
                  onChange={(e) => setInvestorName(e.target.value)}
                  placeholder="e.g., Sequoia Capital"
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label className="text-sm text-slate-600 mb-3 block">What can they see?</Label>
                <div className="space-y-2">
                  {scopeOptions.map((option) => (
                    <div key={option.id} className="flex items-center gap-2">
                      <Checkbox
                        id={option.id}
                        checked={scope.includes(option.id)}
                        onCheckedChange={() => toggleScope(option.id)}
                      />
                      <label htmlFor={option.id} className="text-sm text-slate-700 cursor-pointer">
                        {option.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-sm text-slate-600 mb-3 block">Data Mode for this link</Label>
                <RadioGroup value={dataMode} onValueChange={(v) => setDataMode(v as 'demo' | 'real')}>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="demo" id="demo" />
                    <label htmlFor="demo" className="text-sm text-slate-700 cursor-pointer">
                      Demo Data Only <span className="text-slate-500">(Recommended)</span>
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="real" id="real" />
                    <label htmlFor="real" className="text-sm text-slate-700 cursor-pointer">
                      Real Data <span className="text-slate-500">(Restricted)</span>
                    </label>
                  </div>
                </RadioGroup>
                {dataMode === 'real' && (
                  <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Real data exposes actual platform metrics
                  </p>
                )}
              </div>

              <div>
                <Label className="text-sm text-slate-600 mb-3 block">Access Duration</Label>
                <div className="flex flex-wrap gap-2">
                  {durationOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setDuration(option.value)}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                        duration === option.value
                          ? 'bg-blue-100 text-blue-700 font-medium'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-sm text-slate-600 mb-3 block">Permissions</Label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox id="ai" checked={allowAI} onCheckedChange={(c) => setAllowAI(!!c)} />
                    <label htmlFor="ai" className="text-sm text-slate-700 cursor-pointer">
                      Allow AI Q&A inside investor view
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox id="pdf" checked={allowPDF} onCheckedChange={(c) => setAllowPDF(!!c)} />
                    <label htmlFor="pdf" className="text-sm text-slate-700 cursor-pointer">
                      Allow export to PDF
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={handleClose}>Cancel</Button>
              <Button onClick={() => setStep(2)} disabled={scope.length === 0}>
                Continue <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                Confidentiality & Sharing Acknowledgment
              </DialogTitle>
            </DialogHeader>
            
            <div className="py-4">
              <div className="p-4 bg-slate-50 rounded-lg text-sm text-slate-600 leading-relaxed space-y-3">
                <p className="font-semibold text-slate-900">Confidential Information Notice</p>
                <p>
                  By creating this investor view, you acknowledge that the information shared is 
                  <strong> confidential</strong> and intended for a limited audience.
                </p>
                <p>I, <strong>{investorName || '[Board Member]'}</strong>, understand that:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>This link is for <strong>one investor or firm only</strong>.</li>
                  <li>I am <strong>responsible</strong> for how this link is forwarded or used.</li>
                  <li>Seeksy may <strong>revoke access</strong> at any time if misuse is detected.</li>
                </ul>
                <p className="text-slate-500 italic">
                  By clicking "I Agree & Create Link", I confirm that I understand and accept these responsibilities.
                </p>
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>
              <div className="flex gap-3">
                <Button variant="outline" onClick={handleClose}>Cancel</Button>
                <Button onClick={handleCreateLink} disabled={isCreating}>
                  {isCreating ? 'Creating...' : 'I Agree & Create Link'}
                </Button>
              </div>
            </div>
          </>
        )}

        {step === 3 && generatedLink && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-emerald-600">
                <Check className="w-5 h-5" />
                Investor Link Created
              </DialogTitle>
            </DialogHeader>
            
            <div className="py-4 space-y-4">
              <div>
                <Label className="text-sm text-slate-600">Unique URL</Label>
                <div className="flex gap-2 mt-1.5">
                  <Input value={generatedLink.url} readOnly className="font-mono text-sm" />
                  <Button variant="outline" size="icon" onClick={() => copyToClipboard(generatedLink.url)}>
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <div>
                <Label className="text-sm text-slate-600">Access Code</Label>
                <div className="flex gap-2 mt-1.5">
                  <Input value={generatedLink.passcode} readOnly className="font-mono text-lg tracking-widest" />
                  <Button variant="outline" size="icon" onClick={() => copyToClipboard(generatedLink.passcode)}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <Button 
                className="w-full" 
                onClick={() => copyToClipboard(`${generatedLink.url}\n\nAccess Code: ${generatedLink.passcode}`)}
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy Link + Code for Email
              </Button>

              <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
                <strong>Tip:</strong> You can now paste this into your investor email. 
                We recommend including the passcode in a separate line for security.
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleClose}>Done</Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
