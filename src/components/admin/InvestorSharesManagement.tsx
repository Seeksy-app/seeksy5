import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Ban, CheckCircle, Eye, Loader2, XCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface InvestorShare {
  id: string;
  created_at: string;
  user_id: string;
  investor_email: string;
  investor_name: string | null;
  access_code: string;
  status: string;
  revoked_at: string | null;
  revoked_by: string | null;
  expires_at: string | null;
  notes: string | null;
  profiles?: {
    full_name: string | null;
    username: string;
  };
}

export const InvestorSharesManagement = () => {
  const [shares, setShares] = useState<InvestorShare[]>([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);

  useEffect(() => {
    fetchShares();
  }, []);

  const fetchShares = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from("investor_shares")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch user profiles separately
      const sharesWithProfiles = await Promise.all(
        (data || []).map(async (share: any) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, username")
            .eq("id", share.user_id)
            .single();

          return {
            ...share,
            profiles: profile,
          } as InvestorShare;
        })
      );

      setShares(sharesWithProfiles);
    } catch (error: any) {
      console.error("Error fetching investor shares:", error);
      toast.error("Failed to load investor shares");
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (shareId: string, investorEmail: string) => {
    if (!window.confirm(`Are you sure you want to revoke access for ${investorEmail}?`)) {
      return;
    }

    setRevoking(shareId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await (supabase as any)
        .from("investor_shares")
        .update({
          status: "revoked",
          revoked_at: new Date().toISOString(),
          revoked_by: user.id,
        })
        .eq("id", shareId);

      if (error) throw error;

      toast.success(`Access revoked for ${investorEmail}`);
      await fetchShares();
    } catch (error: any) {
      console.error("Error revoking access:", error);
      toast.error("Failed to revoke access");
    } finally {
      setRevoking(null);
    }
  };

  const getStatusBadge = (share: InvestorShare) => {
    const now = new Date();
    const expiresAt = share.expires_at ? new Date(share.expires_at) : null;

    if (share.status === "revoked") {
      return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />Revoked</Badge>;
    }
    
    if (expiresAt && expiresAt < now) {
      return <Badge variant="secondary" className="gap-1"><Ban className="h-3 w-3" />Expired</Badge>;
    }

    return <Badge variant="default" className="gap-1"><CheckCircle className="h-3 w-3" />Active</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Investor Share Access Log
        </CardTitle>
        <CardDescription>
          Monitor and manage all shared financial forecast access codes
        </CardDescription>
      </CardHeader>
      <CardContent>
        {shares.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Eye className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>No investor shares yet</p>
            <p className="text-sm">Financial forecasts shared with investors will appear here</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Investor Email</TableHead>
                  <TableHead>Access Code</TableHead>
                  <TableHead>Shared By</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shares.map((share) => (
                  <TableRow key={share.id}>
                    <TableCell>
                      <div className="font-medium">{share.investor_email}</div>
                      {share.investor_name && (
                        <div className="text-sm text-muted-foreground">{share.investor_name}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {share.access_code}
                      </code>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {share.profiles?.full_name || share.profiles?.username || "Unknown"}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(share.created_at), { addSuffix: true })}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {share.expires_at 
                        ? formatDistanceToNow(new Date(share.expires_at), { addSuffix: true })
                        : "Never"}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(share)}
                    </TableCell>
                    <TableCell>
                      {share.status === "active" && (!share.expires_at || new Date(share.expires_at) > new Date()) && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRevoke(share.id, share.investor_email)}
                          disabled={revoking === share.id}
                        >
                          {revoking === share.id ? (
                            <>
                              <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                              Revoking...
                            </>
                          ) : (
                            <>
                              <Ban className="h-3 w-3 mr-2" />
                              Revoke
                            </>
                          )}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
