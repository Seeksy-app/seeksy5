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

export default function AdvertisersTab() {
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

  if (isLoading) {
    return <div className="text-center py-12">Loading advertisers...</div>;
  }

  return (
    <div className="space-y-4">
      {advertisers && advertisers.length > 0 ? (
        <div className="grid gap-4">
          {advertisers.map((advertiser) => (
            <Card key={advertiser.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                      <CardTitle>{advertiser.company_name}</CardTitle>
                      <Badge
                        variant={
                          advertiser.status === "approved"
                            ? "default"
                            : advertiser.status === "pending"
                            ? "secondary"
                            : "destructive"
                        }
                      >
                        {advertiser.status}
                      </Badge>
                    </div>
                    <CardDescription>
                      Applied {format(new Date(advertiser.created_at), "MMM d, yyyy")}
                    </CardDescription>
                  </div>
                  {advertiser.status === "pending" && (
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedAdvertiser(advertiser);
                        setReviewDialogOpen(true);
                      }}
                    >
                      Review Application
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-muted-foreground">Contact Email</div>
                      <div className="font-medium">{advertiser.contact_email}</div>
                    </div>
                  </div>

                  {advertiser.contact_phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-muted-foreground">Phone</div>
                        <div className="font-medium">{advertiser.contact_phone}</div>
                      </div>
                    </div>
                  )}

                  {advertiser.website_url && (
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-muted-foreground">Website</div>
                        <a
                          href={advertiser.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-primary hover:underline"
                        >
                          {advertiser.website_url}
                        </a>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-muted-foreground">Account Balance</div>
                    <div className="font-medium">$0.00</div>
                  </div>
                  </div>
                </div>

                {advertiser.business_description && (
                  <div>
                    <div className="text-sm font-medium mb-1">Business Description</div>
                    <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                      {advertiser.business_description}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No advertisers found
          </CardContent>
        </Card>
      )}

      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Advertiser Application</DialogTitle>
            <DialogDescription>
              Approve or reject the application for {selectedAdvertiser?.company_name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejection-reason">Rejection Reason (optional)</Label>
              <Textarea
                id="rejection-reason"
                placeholder="Enter reason for rejection..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                if (selectedAdvertiser && rejectionReason.trim()) {
                  rejectMutation.mutate({
                    advertiserId: selectedAdvertiser.id,
                    reason: rejectionReason,
                  });
                } else {
                  toast.error("Please provide a rejection reason");
                }
              }}
              className="gap-2"
            >
              <XCircle className="h-4 w-4" />
              Reject
            </Button>
            <Button
              onClick={() => {
                if (selectedAdvertiser) {
                  approveMutation.mutate(selectedAdvertiser.id);
                }
              }}
              className="gap-2"
            >
              <CheckCircle2 className="h-4 w-4" />
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
