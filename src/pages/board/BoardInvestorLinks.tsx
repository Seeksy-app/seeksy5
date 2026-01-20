import { useState } from 'react';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, Link2, Copy, Trash2, Eye, Clock, Users, AlertTriangle, Plus, 
  Mail, BarChart3, Send
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

import { SendInvestorEmailModal } from '@/components/board/investor/SendInvestorEmailModal';
import { ActivityLogModal } from '@/components/board/investor/ActivityLogModal';
import { InvestorAnalyticsCards } from '@/components/board/investor/InvestorAnalyticsCards';

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
  tabs_viewed: string[];
}

export default function BoardInvestorLinks() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [sendEmailModal, setSendEmailModal] = useState<{ open: boolean; link: InvestorLink | null }>({ open: false, link: null });
  const [activityModal, setActivityModal] = useState<{ open: boolean; link: InvestorLink | null }>({ open: false, link: null });
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
  const [linkToRevoke, setLinkToRevoke] = useState<InvestorLink | null>(null);

  const { data: links, isLoading } = useQuery({
    queryKey: ['investorLinks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('investor_links')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as InvestorLink[];
    },
  });

  const revokeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('investor_links')
        .update({ status: 'revoked' })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investorLinks'] });
      toast.success('Link revoked successfully');
      setRevokeDialogOpen(false);
      setLinkToRevoke(null);
    },
  });

  const copyLink = (link: InvestorLink) => {
    const url = `${window.location.origin}/investor/${link.token}`;
    navigator.clipboard.writeText(`${url}\n\nAccess Code: ${link.passcode}`);
    toast.success('Link and code copied');
  };

  const getStatusBadge = (link: InvestorLink) => {
    if (link.status === 'revoked') {
      return <Badge variant="destructive">Revoked</Badge>;
    }
    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      return <Badge variant="secondary">Expired</Badge>;
    }
    return <Badge className="bg-emerald-100 text-emerald-700">Active</Badge>;
  };

  return (
    <>
      <div className="w-full space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
              <Users className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Investor Sharing</h1>
              <p className="text-slate-500">Create and manage secure investor access links</p>
            </div>
          </div>
          <Button onClick={() => window.open('/board/generate-investor-link', '_blank')}>
            <Plus className="w-4 h-4 mr-2" />
            Generate New Link
          </Button>
        </div>

        <Tabs defaultValue="links" className="w-full">
          <TabsList className="bg-slate-100 p-1 rounded-xl">
            <TabsTrigger value="links" className="rounded-lg">
              <Link2 className="w-4 h-4 mr-2" />
              Links
            </TabsTrigger>
            <TabsTrigger value="analytics" className="rounded-lg">
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="links" className="mt-6">
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="p-8 text-center text-slate-500">Loading...</div>
                ) : links?.length === 0 ? (
                  <div className="p-8 text-center">
                    <Link2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500">No investor links created yet.</p>
                    <Button className="mt-4" onClick={() => window.open('/board/generate-investor-link', '_blank')}>
                      Create Your First Link
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wide px-6 py-3">Investor</th>
                          <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wide px-6 py-3">Scope</th>
                          <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wide px-6 py-3">Data Mode</th>
                          <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wide px-6 py-3">Status</th>
                          <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wide px-6 py-3">Views</th>
                          <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wide px-6 py-3">Expires</th>
                          <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wide px-6 py-3">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {links?.map((link) => (
                          <tr key={link.id} className="hover:bg-slate-50">
                            <td className="px-6 py-4">
                              <p className="font-medium text-slate-900">{link.investor_name || 'Unnamed'}</p>
                              <p className="text-xs text-slate-500">{format(new Date(link.created_at), 'MMM d, yyyy')}</p>
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-sm text-slate-600">{link.scope.slice(0, 2).join(', ')}{link.scope.length > 2 && ` +${link.scope.length - 2}`}</p>
                            </td>
                            <td className="px-6 py-4">
                              <Badge variant="outline" className={link.data_mode === 'demo' ? 'border-amber-300 text-amber-700' : 'border-emerald-300 text-emerald-700'}>
                                {link.data_mode === 'demo' ? 'Demo' : 'Live'}
                              </Badge>
                            </td>
                            <td className="px-6 py-4">{getStatusBadge(link)}</td>
                            <td className="px-6 py-4">
                              <span className="text-sm text-slate-600">{link.total_views || 0}</span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm text-slate-500">
                                {link.expires_at ? format(new Date(link.expires_at), 'MMM d, h:mm a') : 'Never'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex justify-end gap-1">
                                <Button variant="ghost" size="sm" title="Copy link" onClick={() => copyLink(link)}>
                                  <Copy className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="sm" title="Send email" onClick={() => setSendEmailModal({ open: true, link })}>
                                  <Send className="w-4 h-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  title="View activity"
                                  onClick={() => setActivityModal({ open: true, link })}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                {link.status === 'active' && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="text-red-600 hover:text-red-700"
                                    title="Revoke access"
                                    onClick={() => { setLinkToRevoke(link); setRevokeDialogOpen(true); }}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <InvestorAnalyticsCards />
          </TabsContent>
        </Tabs>
      </div>

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

      {/* Revoke Dialog */}
      <Dialog open={revokeDialogOpen} onOpenChange={setRevokeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Revoke Access
            </DialogTitle>
          </DialogHeader>
          <p className="text-slate-600">
            Are you sure you want to revoke access for <b>{linkToRevoke?.investor_name || 'this investor'}</b>? 
            They will see a message indicating that their link is no longer active.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRevokeDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => linkToRevoke && revokeMutation.mutate(linkToRevoke.id)}>
              Revoke Access
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
