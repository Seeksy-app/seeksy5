import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CheckCircle, XCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface AccessRequest {
  id: string;
  identity_asset_id: string;
  advertiser_id: string;
  request_reason: string | null;
  status: 'pending' | 'approved' | 'denied';
  requested_at: string;
  approved_at: string | null;
  denied_at: string | null;
  identity_assets: {
    title: string;
    type: string;
  } | null;
}

interface AdvertiserAccessRequestsProps {
  requests: AccessRequest[];
}

export function AdvertiserAccessRequests({ requests }: AdvertiserAccessRequestsProps) {
  const queryClient = useQueryClient();

  const respondToRequestMutation = useMutation({
    mutationFn: async ({ requestId, approve }: { requestId: string; approve: boolean }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const updateData = approve
        ? { status: 'approved', approved_at: new Date().toISOString() }
        : { status: 'denied', denied_at: new Date().toISOString() };

      const result = await (supabase as any)
        .from("identity_access_requests")
        .update(updateData)
        .eq("id", requestId);

      if (result.error) throw result.error;

      // Log the action
      const request = requests.find(r => r.id === requestId);
      if (request) {
        await (supabase as any).from("identity_access_logs").insert({
          identity_asset_id: request.identity_asset_id,
          action: approve ? 'access_granted' : 'access_denied',
          actor_id: user.id,
          details: {
            request_id: requestId,
            advertiser_id: request.advertiser_id,
            decision_at: new Date().toISOString(),
          },
        });
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["identity-access-requests"] });
      toast.success(variables.approve ? "Access granted" : "Access denied");
    },
    onError: (error) => {
      toast.error("Failed to respond: " + error.message);
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <Badge className="bg-green-500">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      case 'denied':
        return (
          <Badge className="bg-red-500">
            <XCircle className="h-3 w-3 mr-1" />
            Denied
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-yellow-500">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (requests.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            No access requests yet
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Advertiser Access Requests</CardTitle>
        <CardDescription>
          Manage requests from advertisers to use your identity assets
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Identity Asset</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Requested</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((request) => (
              <TableRow key={request.id}>
                <TableCell className="font-medium">
                  {request.identity_assets?.title || 'Unknown'}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize">
                    {request.identity_assets?.type.replace('_identity', '') || 'Unknown'}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">
                  {format(new Date(request.requested_at), "MMM d, yyyy")}
                </TableCell>
                <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                  {request.request_reason || 'No reason provided'}
                </TableCell>
                <TableCell>{getStatusBadge(request.status)}</TableCell>
                <TableCell>
                  {request.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() =>
                          respondToRequestMutation.mutate({
                            requestId: request.id,
                            approve: true,
                          })
                        }
                        disabled={respondToRequestMutation.isPending}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          respondToRequestMutation.mutate({
                            requestId: request.id,
                            approve: false,
                          })
                        }
                        disabled={respondToRequestMutation.isPending}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Deny
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}