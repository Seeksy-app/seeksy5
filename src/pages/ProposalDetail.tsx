import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Send, Loader2, CheckCircle2, Download } from "lucide-react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function ProposalDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [emailMessage, setEmailMessage] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");

  const { data: proposal, isLoading, isError, error } = useQuery({
    queryKey: ["proposal", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("proposals")
        .select(`
          *,
          contacts (
            id,
            name,
            email,
            company,
            phone
          )
        `)
        .eq("id", id)
        .maybeSingle();
      
      if (error) throw error;
      
      // Set default recipient email from contact
      if (data?.contacts?.email) {
        setRecipientEmail(data.contacts.email);
      }
      
      return data;
    },
    enabled: !!id,
    retry: 1,
  });

  const sendProposalMutation = useMutation({
    mutationFn: async ({ email, message }: { email: string; message: string }) => {
      // Call edge function to send email
      const { data, error } = await supabase.functions.invoke("send-proposal-email", {
        body: {
          proposalId: id,
          recipientEmail: email,
          message,
        },
      });

      if (error) throw error;

      // Update proposal status and sent_at timestamp
      const { error: updateError } = await supabase
        .from("proposals")
        .update({
          status: proposal?.status === "draft" ? "sent" : proposal?.status,
          sent_at: new Date().toISOString(),
          sent_to_email: email,
        })
        .eq("id", id);

      if (updateError) throw updateError;

      // Update contact pipeline stage to "Proposal Sent"
      if (proposal?.client_contact_id) {
        const { data: user } = await supabase.auth.getUser();
        if (user.user) {
          const { data: proposalStage } = await supabase
            .from("pipeline_stages")
            .select("id")
            .eq("user_id", user.user.id)
            .eq("name", "Proposal Sent")
            .single();

          if (proposalStage) {
            await supabase
              .from("contacts")
              .update({ pipeline_stage_id: proposalStage.id })
              .eq("id", proposal.client_contact_id);
          }
        }
      }

      return data;
    },
    onSuccess: () => {
      toast({
        title: "Proposal sent!",
        description: "The proposal has been emailed successfully.",
      });
      setShowSendDialog(false);
      queryClient.invalidateQueries({ queryKey: ["proposal", id] });
      queryClient.invalidateQueries({ queryKey: ["proposals"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error sending proposal",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSendProposal = () => {
    if (!recipientEmail) {
      toast({
        title: "Email required",
        description: "Please enter a recipient email address.",
        variant: "destructive",
      });
      return;
    }

    sendProposalMutation.mutate({ email: recipientEmail, message: emailMessage });
  };

  const getStatusBadge = (status: string) => {
    const config = {
      draft: { color: "bg-gray-500", label: "Draft" },
      sent: { color: "bg-blue-500", label: "Sent" },
      viewed: { color: "bg-yellow-500", label: "Viewed" },
      accepted: { color: "bg-green-500", label: "Accepted" },
      declined: { color: "bg-red-500", label: "Declined" },
    };
    const { color, label } = config[status as keyof typeof config] || config.draft;
    return <Badge className={color}>{label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (isError || !proposal) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-2">
            {isError ? `Error loading proposal: ${error?.message}` : "Proposal not found"}
          </p>
          <Button onClick={() => navigate("/proposals")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Proposals
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-5xl">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/proposals")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{proposal.title}</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Proposal #{proposal.proposal_number}
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            {getStatusBadge(proposal.status)}
            
            <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Send className="h-4 w-4 mr-2" />
                  Send Proposal
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Send Proposal via Email</DialogTitle>
                  <DialogDescription>
                    Send this proposal to your client via email
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Recipient Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      placeholder="client@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">Message (Optional)</Label>
                    <Textarea
                      id="message"
                      value={emailMessage}
                      onChange={(e) => setEmailMessage(e.target.value)}
                      placeholder="Add a personal message..."
                      rows={4}
                    />
                  </div>
                  <Button
                    onClick={handleSendProposal}
                    disabled={sendProposalMutation.isPending}
                    className="w-full"
                  >
                    {sendProposalMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send Proposal
                      </>
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {proposal.sent_at && (
          <Card className="border-blue-500/50 bg-blue-500/5">
            <CardContent className="py-4 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-blue-500" />
              <span className="text-sm">
                Sent to {proposal.sent_to_email} on {format(new Date(proposal.sent_at), "MMM d, yyyy 'at' h:mm a")}
              </span>
            </CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Client Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {proposal.contacts ? (
                <>
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium">{proposal.contacts.name}</p>
                  </div>
                  {proposal.contacts.company && (
                    <div>
                      <p className="text-sm text-muted-foreground">Company</p>
                      <p className="font-medium">{proposal.contacts.company}</p>
                    </div>
                  )}
                  {proposal.contacts.email && (
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{proposal.contacts.email}</p>
                    </div>
                  )}
                  {proposal.contacts.phone && (
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium">{proposal.contacts.phone}</p>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No client assigned</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Proposal Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="font-medium">{format(new Date(proposal.created_at), "MMM d, yyyy")}</p>
              </div>
              {proposal.valid_until && (
                <div>
                  <p className="text-sm text-muted-foreground">Valid Until</p>
                  <p className="font-medium">{format(new Date(proposal.valid_until), "MMM d, yyyy")}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="text-2xl font-bold text-primary">${proposal.total_amount.toFixed(2)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {proposal.description && (
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground whitespace-pre-wrap">{proposal.description}</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Line Items</CardTitle>
            <CardDescription>Services and products included in this proposal</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(proposal.items as any[])?.map((item: any, index: number) => (
                <div key={index}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium">{item.description}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Quantity: {item.quantity} × ${item.unit_price.toFixed(2)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${item.total.toFixed(2)}</p>
                    </div>
                  </div>
                  {index < (proposal.items as any[]).length - 1 && <Separator className="mt-4" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {proposal.notes && (
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground whitespace-pre-wrap">{proposal.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
