import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Loader2, FileText, Eye, Send, Check, X } from "lucide-react";
import { format } from "date-fns";

export default function Proposals() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const { data: contacts } = useQuery({
    queryKey: ["contacts", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("contacts")
        .select("*")
        .eq("user_id", user.id)
        .order("name", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: proposals, isLoading } = useQuery({
    queryKey: ["proposals", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("proposals")
        .select(`
          *,
          contacts (
            id,
            name,
            email,
            company
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const getStatusBadge = (status: string) => {
    const config = {
      draft: { color: "bg-gray-500", icon: FileText },
      sent: { color: "bg-blue-500", icon: Send },
      viewed: { color: "bg-yellow-500", icon: Eye },
      accepted: { color: "bg-green-500", icon: Check },
      declined: { color: "bg-red-500", icon: X },
    };
    const { color, icon: Icon } = config[status as keyof typeof config] || config.draft;
    return (
      <Badge className={color}>
        <Icon className="h-3 w-3 mr-1" />
        {status}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto py-8">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Proposals</h1>
            <p className="text-muted-foreground mt-2">
              Create and manage client proposals with e-signature
            </p>
          </div>
          
          <Button onClick={() => navigate("/proposals/create")}>
            <Plus className="h-4 w-4 mr-2" />
            New Proposal
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Proposals</CardTitle>
            <CardDescription>Track proposal status and client signatures</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
              </div>
            ) : !proposals || proposals.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No proposals yet</h3>
                <p className="text-muted-foreground mb-6">
                  Create your first proposal to send to clients
                </p>
                <Button onClick={() => navigate("/proposals/create")}>
                  Create Proposal
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Proposal #</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Valid Until</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {proposals.map((proposal: any) => (
                    <TableRow key={proposal.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell className="font-mono text-sm">{proposal.proposal_number}</TableCell>
                      <TableCell className="font-medium">{proposal.title}</TableCell>
                      <TableCell>
                        {proposal.contacts ? (
                          <div className="text-sm">
                            <div>{proposal.contacts.name}</div>
                            {proposal.contacts.company && (
                              <div className="text-xs text-muted-foreground">{proposal.contacts.company}</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">No client</span>
                        )}
                      </TableCell>
                      <TableCell className="font-semibold">${proposal.total_amount.toFixed(2)}</TableCell>
                      <TableCell>{getStatusBadge(proposal.status)}</TableCell>
                      <TableCell className="text-sm">
                        {proposal.valid_until ? format(new Date(proposal.valid_until), "MMM d, yyyy") : "-"}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/proposals/${proposal.id}`)}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
