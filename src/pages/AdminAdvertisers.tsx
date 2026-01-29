import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Building2, Mail, Phone, Globe, Clock } from "lucide-react";
import { format } from "date-fns";

export default function AdminAdvertisers() {
  const queryClient = useQueryClient();
  const [selectedAdvertiser, setSelectedAdvertiser] = useState<any>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const { data: advertisers, isLoading } = useQuery({
    queryKey: ["admin-advertisers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("advertisers")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (advertiserId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("advertisers")
        .update({
          status: "approved",
          approved_by: user.id,
          approved_at: new Date().toISOString(),
        })
        .eq("id", advertiserId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-advertisers"] });
      setReviewDialogOpen(false);
      setSelectedAdvertiser(null);
      toast.success("Advertiser approved successfully");
    },
    onError: (error: any) => {
      toast.error("Failed to approve: " + error.message);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ advertiserId, reason }: { advertiserId: string; reason: string }) => {
      const { error } = await supabase
        .from("advertisers")
        .update({
          status: "rejected",
          rejection_reason: reason,
        })
        .eq("id", advertiserId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-advertisers"] });
      setReviewDialogOpen(false);
      setSelectedAdvertiser(null);
      setRejectionReason("");
      toast.success("Advertiser application rejected");
    },
    onError: (error: any) => {
      toast.error("Failed to reject: " + error.message);
    },
  });

  const suspendMutation = useMutation({
    mutationFn: async (advertiserId: string) => {
      const { error } = await supabase
        .from("advertisers")
        .update({ status: "suspended" })
        .eq("id", advertiserId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-advertisers"] });
      toast.success("Advertiser suspended");
    },
    onError: (error: any) => {
      toast.error("Failed to suspend: " + error.message);
    },
  });

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: any; label: string }> = {
      pending: { variant: "outline", label: "Pending Review" },
      approved: { variant: "default", label: "Approved" },
      rejected: { variant: "destructive", label: "Rejected" },
      suspended: { variant: "secondary", label: "Suspended" },
    };
    const { variant, label } = config[status] || config.pending;
    return <Badge variant={variant}>{label}</Badge>;
  };

  const pendingCount = advertisers?.filter(a => a.status === "pending").length || 0;
  const approvedCount = advertisers?.filter(a => a.status === "approved").length || 0;

  return (
    <div className="container mx-auto py-8">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Advertiser Management</h1>
            <p className="text-muted-foreground mt-2">
              Review and manage advertiser applications
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingCount}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{approvedCount}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Advertisers</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{advertisers?.length || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Advertisers List */}
        <Card>
          <CardHeader>
            <CardTitle>Advertisers</CardTitle>
            <CardDescription>Manage advertiser accounts and applications</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading advertisers...</div>
            ) : advertisers && advertisers.length > 0 ? (
              <div className="space-y-4">
                {advertisers.map((advertiser) => (
                  <Card key={advertiser.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-3 flex-1">
                        <div className="flex items-center gap-3">
                          <Building2 className="h-5 w-5 text-muted-foreground" />
                          <h3 className="font-semibold text-lg">{advertiser.company_name}</h3>
                          {getStatusBadge(advertiser.status)}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span>{(advertiser as any).contact_name || advertiser.company_name} - {advertiser.contact_email}</span>
                          </div>
                          {advertiser.contact_phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              <span>{advertiser.contact_phone}</span>
                            </div>
                          )}
                          {advertiser.website_url && (
                            <div className="flex items-center gap-2">
                              <Globe className="h-4 w-4 text-muted-foreground" />
                              <a href={advertiser.website_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                {advertiser.website_url}
                              </a>
                            </div>
                          )}
                          <div className="text-muted-foreground">
                            Applied {format(new Date(advertiser.created_at), "MMM d, yyyy")}
                          </div>
                        </div>

                        {advertiser.business_description && (
                          <p className="text-sm text-muted-foreground">{advertiser.business_description}</p>
                        )}

                        {advertiser.status === "approved" && (
                          <div className="text-sm space-y-1">
                            <div>
                              <span className="text-muted-foreground">Balance: </span>
                              <span className="font-semibold">$0.00</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Payment: </span>
                              <span className="text-yellow-600">Pending Setup</span>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 ml-4">
                        {advertiser.status === "pending" && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedAdvertiser(advertiser);
                              setReviewDialogOpen(true);
                            }}
                          >
                            Review
                          </Button>
                        )}
                        {advertiser.status === "approved" && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => suspendMutation.mutate(advertiser.id)}
                          >
                            Suspend
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No advertisers yet</h3>
                <p className="text-muted-foreground">
                  Advertiser applications will appear here
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Review Dialog */}
        <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Review Advertiser Application</DialogTitle>
              <DialogDescription>
                {selectedAdvertiser?.company_name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Rejection Reason (optional)</Label>
                <Textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Provide a reason if rejecting this application..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setReviewDialogOpen(false);
                  setSelectedAdvertiser(null);
                  setRejectionReason("");
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (selectedAdvertiser) {
                    rejectMutation.mutate({
                      advertiserId: selectedAdvertiser.id,
                      reason: rejectionReason || "Application does not meet requirements",
                    });
                  }
                }}
                disabled={rejectMutation.isPending}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
              <Button
                onClick={() => {
                  if (selectedAdvertiser) {
                    approveMutation.mutate(selectedAdvertiser.id);
                  }
                }}
                disabled={approveMutation.isPending}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Approve
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
