import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

interface ListCommunicationTabProps {
  listId: string;
}

export function ListCommunicationTab({ listId }: ListCommunicationTabProps) {
  const navigate = useNavigate();

  const { data: campaigns, isLoading } = useQuery({
    queryKey: ["list-campaigns", listId],
    queryFn: async () => {
      const result = await (supabase as any)
        .from("email_campaigns")
        .select("*")
        .eq("recipient_list_id", listId)
        .order("sent_at", { ascending: false });

      if (result.error) throw result.error;
      return (result.data || []) as any[];
    },
  });

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Campaign History</h3>
        <p className="text-sm text-muted-foreground">
          All email campaigns sent to this subscriber list.
        </p>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Campaign Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Sent</TableHead>
              <TableHead>Delivered</TableHead>
              <TableHead>Opens</TableHead>
              <TableHead>Clicks</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Loading campaigns...
                </TableCell>
              </TableRow>
            ) : campaigns?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No campaigns sent to this list yet.
                </TableCell>
              </TableRow>
            ) : (
              campaigns?.map((campaign: any) => {
                const sentCount = campaign.sent_count || 0;
                const deliveredCount = campaign.delivered_count || 0;
                const openedCount = campaign.opened_count || 0;
                const clickedCount = campaign.clicked_count || 0;
                
                const deliveredRate = sentCount > 0
                  ? ((deliveredCount / sentCount) * 100).toFixed(1)
                  : "0.0";
                const openRate = sentCount > 0
                  ? ((openedCount / sentCount) * 100).toFixed(1)
                  : "0.0";
                const clickRate = sentCount > 0
                  ? ((clickedCount / sentCount) * 100).toFixed(1)
                  : "0.0";

                return (
                  <TableRow key={campaign.id}>
                    <TableCell className="font-medium">
                      {campaign.campaign_name || campaign.subject}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          campaign.status === "sent"
                            ? "default"
                            : campaign.status === "scheduled"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {campaign.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {campaign.sent_at
                        ? format(new Date(campaign.sent_at), "MMM d, yyyy")
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {deliveredCount} ({deliveredRate}%)
                    </TableCell>
                    <TableCell>
                      {openedCount} ({openRate}%)
                    </TableCell>
                    <TableCell>
                      {clickedCount} ({clickRate}%)
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/email-campaigns/${campaign.id}`)}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Campaign
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
