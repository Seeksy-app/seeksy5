import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Link2, Shield, Copy, Check, ArrowRight, ArrowLeft, Mail 
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ProFormaShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProFormaShareModal({ open, onOpenChange }: ProFormaShareModalProps) {
  const [step, setStep] = useState<'configure' | 'confirm' | 'success'>('configure');
  const [isCreating, setIsCreating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // Form state
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);

  // Generated link data
  const [generatedData, setGeneratedData] = useState<{
    id: string;
    url: string;
    passcode: string;
    token: string;
  } | null>(null);

  const resetForm = () => {
    setStep('configure');
    setRecipientName('');
    setRecipientEmail('');
    setAcknowledged(false);
    setGeneratedData(null);
    setCopied(false);
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(resetForm, 300);
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
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      const { data, error } = await supabase.from('proforma_share_links' as any).insert({
        token,
        passcode,
        recipient_name: recipientName || null,
        recipient_email: recipientEmail || null,
        created_by: user.id,
        expires_at: expiresAt.toISOString(),
        proforma_type: 'events-awards',
        status: 'active',
      }).select().single();

      if (error) throw error;

      const url = `${window.location.origin}/proforma/events-awards/view/${token}`;
      setGeneratedData({ id: (data as any).id, url, passcode, token });
      setStep('success');
      toast.success('Share link created');
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

  const handleSendEmail = async () => {
    if (!recipientEmail || !generatedData) {
      toast.error('Please enter a recipient email');
      return;
    }
    
    setIsSendingEmail(true);
    try {
      const { error } = await supabase.functions.invoke('send-proforma-share', {
        body: {
          recipientName,
          recipientEmail,
          shareUrl: generatedData.url,
          passcode: generatedData.passcode,
          proformaType: 'Events & Awards Pro Forma',
        }
      });

      if (error) throw error;
      toast.success('Email sent successfully!');
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error('Failed to send email');
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {step === 'configure' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Link2 className="w-5 h-5 text-blue-600" />
                Share Pro Forma
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div>
                <Label>Recipient Name (optional)</Label>
                <Input
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="e.g., John Smith"
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label>Recipient Email (optional)</Label>
                <Input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="e.g., john@example.com"
                  className="mt-1.5"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  If provided, we can send them an email with the link and access code.
                </p>
              </div>

              <div className="p-3 bg-amber-50 rounded-lg text-sm text-amber-800">
                <p className="font-medium">Note:</p>
                <p>Recipients will need to accept a confidentiality agreement before viewing the Pro Forma.</p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>Cancel</Button>
              <Button onClick={() => setStep('confirm')}>
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
                Confidentiality Acknowledgment
              </DialogTitle>
            </DialogHeader>

            <div className="py-4">
              <div className="p-4 bg-slate-50 rounded-lg text-sm space-y-3">
                <p className="font-semibold text-slate-900">Confidential Information Notice</p>
                <p className="text-slate-600">
                  By creating this share link, you acknowledge that the Pro Forma contains 
                  <b> confidential financial projections</b>.
                </p>
                <ul className="list-disc list-inside space-y-1 text-slate-600">
                  <li>This link is for <b>one recipient only</b>.</li>
                  <li>You are <b>responsible</b> for how this link is used.</li>
                  <li>Access can be <b>revoked</b> at any time.</li>
                </ul>
              </div>

              <div className="flex items-start gap-2 mt-4">
                <Checkbox
                  id="ack"
                  checked={acknowledged}
                  onCheckedChange={(c) => setAcknowledged(!!c)}
                />
                <label htmlFor="ack" className="text-sm text-slate-600 cursor-pointer">
                  I confirm that I understand these responsibilities.
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
                  {isCreating ? 'Creating...' : 'Create Link'}
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
                Link Created Successfully
              </DialogTitle>
            </DialogHeader>

            <div className="py-4 space-y-4">
              <div>
                <Label className="text-xs text-slate-500">Share Link</Label>
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
                    `Seeksy Pro Forma\n\nLink: ${generatedData.url}\nAccess Code: ${generatedData.passcode}`,
                    'Link + code copied'
                  )}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Link + Code
                </Button>
                {recipientEmail && (
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={handleSendEmail}
                    disabled={isSendingEmail}
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    {isSendingEmail ? 'Sending...' : 'Send Email'}
                  </Button>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>Done</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
