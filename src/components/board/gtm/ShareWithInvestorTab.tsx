import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link2, Copy, Eye, Trash2, AlertTriangle, Plus, Send } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { GenerateLinkModal } from '@/components/board/investor/GenerateLinkModal';
import { SendInvestorEmailModal } from '@/components/board/investor/SendInvestorEmailModal';
import { ActivityLogModal } from '@/components/board/investor/ActivityLogModal';

interface InvestorLink {
  id: string;
  token: string;
  passcode: string;
  investor_name: string | null;
  created_by: string;
  created_at: string;
  expires_at: string | null;
  data_mode: string;
  scope: string[];
  status: string;
  last_viewed_at: string | null;
  total_views: number;
}

export function ShareWithInvestorTab() {
  const queryClient = useQueryClient();
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [sendEmailModal, setSendEmailModal] = useState<{ open: boolean; link: InvestorLink | null }>({ open: false, link: null });
  const [activityModal, setActivityModal] = useState<{ open: boolean; link: InvestorLink | null }>({ open: false, link: null });

  const { data: links, isLoading } = useQuery({
    queryKey: ['investorLinks'],
    queryFn: async () => {
      const result = await (supabase as any)
        .from('investor_links')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      if (result.error) throw result.error;
      return result.data as InvestorLink[];
    },
  });

  const revokeMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await (supabase as any)
        .from('investor_links')
        .update({ status: 'revoked' })
        .eq('id', id);
      if (result.error) throw result.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investorLinks'] });
      toast.success('Link revoked');
    },
  });

  const copyLink = (link: InvestorLink) => {
    const url = `${window.location.origin}/investor/${link.token}`;
    navigator.clipboard.writeText(`${url}\n\nAccess Code: ${link.passcode}`);
    toast.success('Link and code copied');
  };

  const getStatusBadge = (link: InvestorLink) => {
    if (link.status === 'revoked') {
      return <Badge variant="destructive" className="text-xs">Revoked</Badge>;
    }
    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      return <Badge variant="secondary" className="text-xs">Expired</Badge>;
    }
    return <Badge className="bg-emerald-100 text-emerald-700 text-xs">Active</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Generate New Link */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-slate-900">
            <Link2 className="w-5 h-5 text-blue-600" />
            Generate Investor Access Link
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600 mb-4">
            Create a secure, time-limited link to share the GTM Strategy with potential investors.
          </p>
          <Button onClick={() => setGenerateModalOpen(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Generate New Link
          </Button>
        </CardContent>
      </Card>

      {/* Recent Links */}
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base text-slate-900">Recent Investor Links</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-slate-500 text-center py-6">Loading...</p>
          ) : !links || links.length === 0 ? (
            <div className="text-center py-8">
              <Link2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">No investor links created yet.</p>
              <Button className="mt-4" variant="outline" onClick={() => setGenerateModalOpen(true)}>
                Create Your First Link
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {links.map((link) => (
                <div key={link.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-sm text-slate-900">
                        {link.investor_name || 'Unnamed Investor'}
                      </span>
                      {getStatusBadge(link)}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span>{format(new Date(link.created_at), 'MMM d, yyyy')}</span>
                      <span>{link.total_views || 0} views</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" title="Copy link" onClick={() => copyLink(link)}>
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" title="Send email" onClick={() => setSendEmailModal({ open: true, link })}>
                      <Send className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" title="View activity" onClick={() => setActivityModal({ open: true, link })}>
                      <Eye className="w-4 h-4" />
                    </Button>
                    {link.status === 'active' && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-600 hover:text-red-700"
                        title="Revoke"
                        onClick={() => revokeMutation.mutate(link.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Guidelines */}
      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">Investor Access Guidelines</h3>
              <ul className="text-sm text-slate-600 space-y-1">
                <li><strong>Do NOT</strong> share screenshots or exports of this portal</li>
                <li>All investor access must be initiated via this secure link system</li>
                <li>Links auto-accept NDA and expire based on your settings</li>
                <li><strong>Shareable:</strong> Overview video, pitch deck, demo mode data</li>
                <li><strong>Not shareable:</strong> Internal KPIs, real creator data, R&D feeds</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      <GenerateLinkModal 
        open={generateModalOpen} 
        onOpenChange={setGenerateModalOpen}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['investorLinks'] })}
      />

      {sendEmailModal.link && (
        <SendInvestorEmailModal
          open={sendEmailModal.open}
          onOpenChange={(open) => setSendEmailModal({ open, link: open ? sendEmailModal.link : null })}
          linkId={sendEmailModal.link.id}
          linkToken={sendEmailModal.link.token}
          passcode={sendEmailModal.link.passcode}
          defaultInvestorName={sendEmailModal.link.investor_name || ''}
          scope={sendEmailModal.link.scope}
        />
      )}

      {activityModal.link && (
        <ActivityLogModal
          open={activityModal.open}
          onOpenChange={(open) => setActivityModal({ open, link: open ? activityModal.link : null })}
          linkId={activityModal.link.id}
          investorName={activityModal.link.investor_name || undefined}
        />
      )}
    </div>
  );
}
