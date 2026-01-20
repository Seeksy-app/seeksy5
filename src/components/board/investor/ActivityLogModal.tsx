import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Clock, Eye, MousePointer, Mail, CheckCircle, ExternalLink, Globe } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface ActivityLogModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  linkId: string;
  investorName?: string;
}

interface Activity {
  id: string;
  event_type: string;
  tab_viewed: string | null;
  ip_region: string | null;
  user_agent: string | null;
  time_on_page_seconds: number | null;
  created_at: string;
}

interface Email {
  id: string;
  investor_email: string;
  status: string;
  sent_at: string | null;
  delivered_at: string | null;
  opened_at: string | null;
  clicked_at: string | null;
}

export function ActivityLogModal({
  open,
  onOpenChange,
  linkId,
  investorName,
}: ActivityLogModalProps) {
  const { data: activities, isLoading: activitiesLoading } = useQuery({
    queryKey: ['linkActivity', linkId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('investor_link_activity')
        .select('*')
        .eq('link_id', linkId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Activity[];
    },
    enabled: open,
  });

  const { data: emails, isLoading: emailsLoading } = useQuery({
    queryKey: ['linkEmails', linkId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('investor_emails')
        .select('*')
        .eq('link_id', linkId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Email[];
    },
    enabled: open,
  });

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'authenticated':
        return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case 'page_view':
      case 'tab_viewed':
        return <Eye className="w-4 h-4 text-blue-500" />;
      case 'click':
        return <MousePointer className="w-4 h-4 text-purple-500" />;
      default:
        return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  const getEmailStatusBadge = (email: Email) => {
    if (email.clicked_at) return <Badge className="bg-emerald-100 text-emerald-700">Clicked</Badge>;
    if (email.opened_at) return <Badge className="bg-blue-100 text-blue-700">Opened</Badge>;
    if (email.delivered_at) return <Badge className="bg-slate-100 text-slate-700">Delivered</Badge>;
    if (email.sent_at) return <Badge className="bg-amber-100 text-amber-700">Sent</Badge>;
    return <Badge variant="secondary">Pending</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            Activity Log: {investorName || 'Investor'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 py-4">
          {/* Email Activity */}
          {emails && emails.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Activity
              </h3>
              <div className="space-y-2">
                {emails.map((email) => (
                  <div key={email.id} className="p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">{email.investor_email}</span>
                      {getEmailStatusBadge(email)}
                    </div>
                    <div className="flex flex-wrap gap-4 mt-2 text-xs text-slate-500">
                      {email.sent_at && (
                        <span>Sent: {format(new Date(email.sent_at), 'MMM d, h:mm a')}</span>
                      )}
                      {email.opened_at && (
                        <span className="text-blue-600">Opened: {format(new Date(email.opened_at), 'MMM d, h:mm a')}</span>
                      )}
                      {email.clicked_at && (
                        <span className="text-emerald-600">Clicked: {format(new Date(email.clicked_at), 'MMM d, h:mm a')}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* View Activity */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <Eye className="w-4 h-4" />
              View Activity
            </h3>
            {activitiesLoading ? (
              <p className="text-sm text-slate-500">Loading...</p>
            ) : activities?.length === 0 ? (
              <p className="text-sm text-slate-500">No activity recorded yet.</p>
            ) : (
              <div className="space-y-2">
                {activities?.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                    {getEventIcon(activity.event_type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 capitalize">
                        {activity.event_type.replace(/_/g, ' ')}
                      </p>
                      <div className="flex flex-wrap gap-3 mt-1">
                        {activity.tab_viewed && (
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <ExternalLink className="w-3 h-3" />
                            {activity.tab_viewed}
                          </span>
                        )}
                        {activity.ip_region && (
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Globe className="w-3 h-3" />
                            {activity.ip_region}
                          </span>
                        )}
                        {activity.time_on_page_seconds && (
                          <span className="text-xs text-slate-500">
                            {Math.floor(activity.time_on_page_seconds / 60)}m {activity.time_on_page_seconds % 60}s on page
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        {format(new Date(activity.created_at), 'MMM d, h:mm:ss a')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
