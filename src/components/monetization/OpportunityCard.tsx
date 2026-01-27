import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  DollarSign, 
  Calendar, 
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  Upload,
  Building2
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface OpportunityCardProps {
  opportunity: any;
  compact?: boolean;
  showProgress?: boolean;
}

export function OpportunityCard({ opportunity, compact = false, showProgress = false }: OpportunityCardProps) {
  const queryClient = useQueryClient();
  const [showAcceptDialog, setShowAcceptDialog] = useState(false);
  const [showDeclineDialog, setShowDeclineDialog] = useState(false);

  const updateStatus = useMutation({
    mutationFn: async (newStatus: string) => {
      const updates: any = { status: newStatus, updated_at: new Date().toISOString() };
      if (newStatus === 'accepted') {
        updates.accepted_at = new Date().toISOString();
      }
      
      const { error } = await (supabase as any)
        .from('creator_opportunities')
        .update(updates)
        .eq('id', opportunity.id);
      
      if (error) throw error;
    },
    onSuccess: (_, newStatus) => {
      queryClient.invalidateQueries({ queryKey: ['creator-opportunities'] });
      toast.success(newStatus === 'accepted' ? 'Opportunity accepted!' : 'Opportunity declined');
      setShowAcceptDialog(false);
      setShowDeclineDialog(false);
    },
    onError: (error) => {
      toast.error('Failed to update opportunity');
      console.error(error);
    }
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      pending: { variant: "secondary", label: "Pending Response" },
      accepted: { variant: "default", label: "Accepted" },
      declined: { variant: "destructive", label: "Declined" },
      submitted: { variant: "outline", label: "Submitted" },
      needs_fix: { variant: "destructive", label: "Needs Revision" },
      approved: { variant: "default", label: "Approved" },
      paid: { variant: "default", label: "Paid" },
      cancelled: { variant: "destructive", label: "Cancelled" },
    };
    const config = variants[status] || { variant: "secondary", label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getDeliverableTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      audio_read: "Audio Ad Read",
      video_post: "Video Post",
      social_share: "Social Share",
      event_read: "Event Ad Read",
      host_read: "Host Read",
      custom: "Custom Deliverable"
    };
    return labels[type] || type;
  };

  const campaign = opportunity.ad_campaigns;
  const advertiser = campaign?.advertisers;

  if (compact) {
    return (
      <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors">
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">
            {advertiser?.company_name || 'Unknown Brand'}
          </p>
          <p className="text-sm text-muted-foreground">
            ${opportunity.offer_amount} • {getDeliverableTypeLabel(opportunity.deliverable_type)}
          </p>
        </div>
        <div className="flex items-center gap-2 ml-4">
          {opportunity.status === 'pending' ? (
            <>
              <Button size="sm" variant="outline" onClick={() => setShowDeclineDialog(true)}>
                Decline
              </Button>
              <Button size="sm" onClick={() => setShowAcceptDialog(true)}>
                Accept
              </Button>
            </>
          ) : (
            getStatusBadge(opportunity.status)
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                {advertiser?.company_name || 'Unknown Brand'}
              </CardTitle>
              <CardDescription>
                {campaign?.name || 'Campaign'}
              </CardDescription>
            </div>
            {getStatusBadge(opportunity.status)}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Offer Amount</p>
              <p className="font-semibold flex items-center gap-1">
                <DollarSign className="h-4 w-4" />
                {opportunity.offer_amount}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Deliverable Type</p>
              <p className="font-medium">{getDeliverableTypeLabel(opportunity.deliverable_type)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Due Date</p>
              <p className="font-medium flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {opportunity.due_date ? format(new Date(opportunity.due_date), 'MMM d, yyyy') : 'No deadline'}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Campaign Objective</p>
              <p className="font-medium capitalize">{campaign?.objective || 'Awareness'}</p>
            </div>
          </div>

          {opportunity.notes && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-1">Notes from Advertiser</p>
              <p className="text-sm text-muted-foreground">{opportunity.notes}</p>
            </div>
          )}

          {showProgress && opportunity.status === 'accepted' && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>0%</span>
              </div>
              <Progress value={0} className="h-2" />
              <Button variant="outline" className="w-full mt-2">
                <Upload className="h-4 w-4 mr-2" />
                Upload Deliverable
              </Button>
            </div>
          )}

          {opportunity.status === 'pending' && (
            <div className="flex gap-2 pt-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setShowDeclineDialog(true)}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Decline
              </Button>
              <Button 
                className="flex-1"
                onClick={() => setShowAcceptDialog(true)}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Accept Opportunity
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Accept Dialog */}
      <Dialog open={showAcceptDialog} onOpenChange={setShowAcceptDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Accept Opportunity</DialogTitle>
            <DialogDescription>
              By accepting, you agree to deliver the requested content by the due date.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-2 text-sm">
              <p><strong>Brand:</strong> {advertiser?.company_name}</p>
              <p><strong>Amount:</strong> ${opportunity.offer_amount}</p>
              <p><strong>Type:</strong> {getDeliverableTypeLabel(opportunity.deliverable_type)}</p>
              <p><strong>Due:</strong> {opportunity.due_date ? format(new Date(opportunity.due_date), 'MMM d, yyyy') : 'No deadline'}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAcceptDialog(false)}>Cancel</Button>
            <Button onClick={() => updateStatus.mutate('accepted')} disabled={updateStatus.isPending}>
              {updateStatus.isPending ? 'Accepting...' : 'Accept'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Decline Dialog */}
      <Dialog open={showDeclineDialog} onOpenChange={setShowDeclineDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Decline Opportunity</DialogTitle>
            <DialogDescription>
              Are you sure you want to decline this opportunity?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeclineDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => updateStatus.mutate('declined')} disabled={updateStatus.isPending}>
              {updateStatus.isPending ? 'Declining...' : 'Decline'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
