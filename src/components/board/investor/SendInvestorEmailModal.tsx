import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Mail, Send, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SendInvestorEmailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  linkId: string;
  linkToken: string;
  passcode: string;
  defaultInvestorName?: string;
  scope: string[];
}

export function SendInvestorEmailModal({
  open,
  onOpenChange,
  linkId,
  linkToken,
  passcode,
  defaultInvestorName,
  scope,
}: SendInvestorEmailModalProps) {
  const [investorName, setInvestorName] = useState(defaultInvestorName || '');
  const [investorEmail, setInvestorEmail] = useState('');
  const [message, setMessage] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [boardMemberName, setBoardMemberName] = useState('');
  const [boardMemberEmail, setBoardMemberEmail] = useState('');

  useEffect(() => {
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
  }, []);

  const handleSend = async () => {
    if (!investorEmail || !accepted) return;
    
    setIsSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-investor-email', {
        body: {
          linkId,
          investorEmail,
          investorName,
          message,
          boardMemberName,
          boardMemberEmail,
        },
      });

      if (error) throw error;

      toast.success('Investor email sent successfully');
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error('Failed to send email');
    } finally {
      setIsSending(false);
    }
  };

  const resetForm = () => {
    setInvestorName(defaultInvestorName || '');
    setInvestorEmail('');
    setMessage('');
    setAccepted(false);
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
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) resetForm(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-blue-600" />
            Send Investor Invitation
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="name">Investor Name</Label>
            <Input
              id="name"
              value={investorName}
              onChange={(e) => setInvestorName(e.target.value)}
              placeholder="e.g., John Smith"
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="email">Investor Email <span className="text-red-500">*</span></Label>
            <Input
              id="email"
              type="email"
              value={investorEmail}
              onChange={(e) => setInvestorEmail(e.target.value)}
              placeholder="investor@example.com"
              className="mt-1.5"
              required
            />
          </div>

          <div>
            <Label htmlFor="message">Personal Message (optional)</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a personal note to the investor..."
              className="mt-1.5"
              rows={3}
            />
          </div>

          <div className="p-3 bg-slate-50 rounded-lg">
            <Label className="text-sm text-slate-600">Sections included in this link:</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {scope.map((s) => (
                <span key={s} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                  {scopeLabels[s] || s}
                </span>
              ))}
            </div>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-amber-700">
                A confidentiality notice will be automatically included in the email stating that this link is for investment evaluation only and redistribution is prohibited.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Checkbox
              id="accept"
              checked={accepted}
              onCheckedChange={(c) => setAccepted(!!c)}
            />
            <label htmlFor="accept" className="text-sm text-slate-600 cursor-pointer">
              I understand that sharing this link grants temporary access to confidential materials.
            </label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={!investorEmail || !accepted || isSending}>
            {isSending ? 'Sending...' : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send Invitation
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
