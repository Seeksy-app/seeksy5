import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Shield, Camera, Mic, ExternalLink, RefreshCw, AlertCircle } from "lucide-react";
import { format } from "date-fns";

const AdminIdentity = () => {
  const { data: identityAssets = [], isLoading } = useQuery({
    queryKey: ["admin-identity-assets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("identity_assets")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const { data: accessLogs = [] } = useQuery({
    queryKey: ["admin-identity-access-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("identity_access_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      return data || [];
    },
  });

  const { data: identityRequests = [] } = useQuery({
    queryKey: ["admin-identity-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("identity_requests")
        .select("*")
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "minted":
        return "bg-green-500/10 text-green-600 border-green-200";
      case "pending":
        return "bg-yellow-500/10 text-yellow-600 border-yellow-200";
      case "minting":
        return "bg-blue-500/10 text-blue-600 border-blue-200";
      case "failed":
        return "bg-red-500/10 text-red-600 border-red-200";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "minted":
        return "Certified";
      case "pending":
        return "Submitted";
      case "minting":
        return "Certifying";
      case "failed":
        return "Failed";
      default:
        return "Not Set";
    }
  };

  const faceIdentities = identityAssets.filter(a => a.type === "face_identity");
  const voiceIdentities = identityAssets.filter(a => a.type === "voice_identity");

  return (
    <div className="container max-w-7xl py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Identity Management</h1>
        <p className="text-muted-foreground mt-1">
          Manage face and voice identity verifications and certificates
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Identities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{identityAssets.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Face Identities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{faceIdentities.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Voice Identities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{voiceIdentities.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Certified</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {identityAssets.filter(a => a.cert_status === "minted").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Face Identity Submissions */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Camera className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Face Identity Submissions</CardTitle>
              <CardDescription>Review and manage face identity verifications</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : faceIdentities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No face identity submissions yet</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Creator ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Face Hash</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {faceIdentities.map((asset) => (
                  <TableRow key={asset.id}>
                    <TableCell className="font-mono text-sm">{asset.user_id.slice(0, 8)}...</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getStatusColor(asset.cert_status)}>
                        {getStatusLabel(asset.cert_status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {asset.face_hash ? `${asset.face_hash.slice(0, 10)}...` : "—"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {format(new Date(asset.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {asset.cert_status === "minted" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(`/certificate/${asset.id}`, "_blank")}
                          >
                            <Shield className="h-4 w-4" />
                          </Button>
                        )}
                        {asset.cert_explorer_url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(asset.cert_explorer_url, "_blank")}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        )}
                        {asset.cert_status === "failed" && (
                          <Button variant="ghost" size="sm">
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Voice Identity Submissions */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Mic className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Voice Identity Submissions</CardTitle>
              <CardDescription>Review and manage voice identity verifications</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : voiceIdentities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No voice identity submissions yet</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Creator ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {voiceIdentities.map((asset) => (
                  <TableRow key={asset.id}>
                    <TableCell className="font-mono text-sm">{asset.user_id.slice(0, 8)}...</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getStatusColor(asset.cert_status)}>
                        {getStatusLabel(asset.cert_status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {format(new Date(asset.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {asset.cert_status === "minted" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(`/certificate/${asset.id}`, "_blank")}
                          >
                            <Shield className="h-4 w-4" />
                          </Button>
                        )}
                        {asset.cert_explorer_url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(asset.cert_explorer_url, "_blank")}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        )}
                        {asset.cert_status === "failed" && (
                          <Button variant="ghost" size="sm">
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

          {/* Recent Identity Requests */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle>Recent Identity Requests</CardTitle>
                  <CardDescription>Latest advertiser access requests across all creators</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {accessLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No identity requests yet</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Creator</TableHead>
                      <TableHead>Advertiser</TableHead>
                      <TableHead>Rights</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accessLogs.slice(0, 10).map((req: any) => (
                      <TableRow key={req.id}>
                        <TableCell className="font-mono text-xs">
                          {req.creator_id?.slice(0, 8)}...
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{req.advertiser_company}</p>
                            <p className="text-xs text-muted-foreground">{req.advertiser_email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {((req.rights_requested || []) as string[]).slice(0, 2).map((right, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {right}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={
                            req.status === 'approved' ? 'bg-green-500/10 text-green-600' :
                            req.status === 'rejected' ? 'bg-red-500/10 text-red-600' :
                            'bg-yellow-500/10 text-yellow-600'
                          }>
                            {req.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">
                          {format(new Date(req.created_at), "MMM d, h:mm a")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Recent Access Logs */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Recent Access Logs</CardTitle>
              <CardDescription>Identity events and permission changes</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {accessLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No access logs yet</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>Identity Asset</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accessLogs.slice(0, 20).map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <Badge variant="outline">
                        {log.action.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {log.identity_asset_id.slice(0, 8)}...
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {log.actor_id?.slice(0, 8)}...
                    </TableCell>
                    <TableCell className="text-sm">
                      {format(new Date(log.created_at), "MMM d, h:mm a")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminIdentity;
