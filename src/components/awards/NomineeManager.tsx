import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Check, X, Edit2, Mail, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface NomineeManagerProps {
  programId: string;
}

export function NomineeManager({ programId }: NomineeManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingNominee, setEditingNominee] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    nominee_name: "",
    nominee_email: "",
    nominee_description: "",
    rss_feed_url: "",
  });

  const { data: nominees, isLoading } = useQuery({
    queryKey: ["nominees", programId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("award_nominees")
        .select(`
          *,
          award_categories (
            name
          )
        `)
        .eq("program_id", programId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ nomineeId, status }: { nomineeId: string; status: "pending" | "approved" | "rejected" }) => {
      const { error } = await supabase
        .from("award_nominees")
        .update({ status })
        .eq("id", nomineeId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nominees", programId] });
      toast({
        title: "Status Updated",
        description: "Nominee status has been updated successfully.",
      });
    },
  });

  const updateNomineeMutation = useMutation({
    mutationFn: async ({ nomineeId, updates }: { nomineeId: string; updates: any }) => {
      const { error } = await supabase
        .from("award_nominees")
        .update(updates)
        .eq("id", nomineeId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nominees", programId] });
      setEditingNominee(null);
      toast({
        title: "Nominee Updated",
        description: "Nominee details have been updated successfully.",
      });
    },
  });

  const sendApprovalEmailMutation = useMutation({
    mutationFn: async (nomineeId: string) => {
      const { error } = await supabase.functions.invoke("send-nominee-approval-email", {
        body: { nomineeId },
      });
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Email Sent",
        description: "Approval email with voting link sent to nominee.",
      });
    },
  });

  const handleApprove = async (nominee: any) => {
    await updateStatusMutation.mutateAsync({
      nomineeId: nominee.id,
      status: "approved",
    });
    
    // Send approval email if nominee has an email
    if (nominee.nominee_email) {
      await sendApprovalEmailMutation.mutateAsync(nominee.id);
    }
  };

  const handleReject = async (nomineeId: string) => {
    await updateStatusMutation.mutateAsync({
      nomineeId,
      status: "rejected",
    });
  };

  const handleEdit = (nominee: any) => {
    setEditingNominee(nominee);
    setEditForm({
      nominee_name: nominee.nominee_name || "",
      nominee_email: nominee.nominee_email || "",
      nominee_description: nominee.nominee_description || "",
      rss_feed_url: nominee.rss_feed_url || "",
    });
  };

  const handleSaveEdit = async () => {
    if (!editingNominee) return;
    
    await updateNomineeMutation.mutateAsync({
      nomineeId: editingNominee.id,
      updates: editForm,
    });
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: { variant: "outline" as const, color: "text-yellow-600", label: "Pending" },
      approved: { variant: "default" as const, color: "text-green-600", label: "Approved" },
      rejected: { variant: "destructive" as const, color: "text-red-600", label: "Rejected" },
    };
    
    const config = variants[status as keyof typeof variants] || variants.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-brand-gold border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!nominees || nominees.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No nominees yet. Share your nomination link to get started!</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {nominees.map((nominee) => (
          <Card key={nominee.id} className="p-6">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-semibold">{nominee.nominee_name}</h3>
                  {getStatusBadge(nominee.status)}
                </div>
                
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>
                    <strong>Category:</strong> {nominee.award_categories?.name}
                  </p>
                  {nominee.nominee_email && (
                    <p>
                      <strong>Email:</strong> {nominee.nominee_email}
                    </p>
                  )}
                  {nominee.nominee_description && (
                    <p className="mt-2">{nominee.nominee_description}</p>
                  )}
                  {nominee.rss_feed_url && (
                    <p>
                      <strong>RSS Feed:</strong>{" "}
                      <a
                        href={nominee.rss_feed_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand-gold hover:underline inline-flex items-center gap-1"
                      >
                        View Feed <ExternalLink className="h-3 w-3" />
                      </a>
                    </p>
                  )}
                  {nominee.unique_voting_link && (
                    <p>
                      <strong>Voting Link:</strong>{" "}
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {window.location.origin}/vote/{nominee.unique_voting_link}
                      </code>
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                {nominee.status === "pending" && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(nominee)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => handleApprove(nominee)}
                      disabled={updateStatusMutation.isPending}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleReject(nominee.id)}
                      disabled={updateStatusMutation.isPending}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  </>
                )}
                
                {nominee.status === "approved" && nominee.nominee_email && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => sendApprovalEmailMutation.mutateAsync(nominee.id)}
                    disabled={sendApprovalEmailMutation.isPending}
                  >
                    <Mail className="h-4 w-4 mr-1" />
                    Resend Email
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingNominee} onOpenChange={() => setEditingNominee(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Nominee</DialogTitle>
            <DialogDescription>
              Update nominee information before approving.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="edit_nominee_name">Nominee Name</Label>
              <Input
                id="edit_nominee_name"
                value={editForm.nominee_name}
                onChange={(e) => setEditForm({ ...editForm, nominee_name: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="edit_nominee_email">Email</Label>
              <Input
                id="edit_nominee_email"
                type="email"
                value={editForm.nominee_email}
                onChange={(e) => setEditForm({ ...editForm, nominee_email: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="edit_nominee_description">Description</Label>
              <Textarea
                id="edit_nominee_description"
                value={editForm.nominee_description}
                onChange={(e) => setEditForm({ ...editForm, nominee_description: e.target.value })}
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="edit_rss_feed_url">RSS Feed URL</Label>
              <Input
                id="edit_rss_feed_url"
                type="url"
                value={editForm.rss_feed_url}
                onChange={(e) => setEditForm({ ...editForm, rss_feed_url: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingNominee(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={updateNomineeMutation.isPending}
              className="bg-brand-gold hover:bg-brand-darkGold"
            >
              {updateNomineeMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
