import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Shield, ExternalLink, Copy, CheckCircle, Clock, XCircle, Search } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface CertifiedClip {
  id: string;
  title: string | null;
  cert_status: string;
  cert_chain: string | null;
  cert_tx_hash: string | null;
  cert_explorer_url: string | null;
  cert_created_at: string | null;
  created_at: string;
  user_id: string;
  profiles: {
    username: string;
    full_name: string | null;
  } | null;
}

export default function CertificationConsole() {
  const [selectedTab, setSelectedTab] = useState<"overview" | "clips" | "identity">("overview");
  const [selectedClip, setSelectedClip] = useState<CertifiedClip | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);

  const { data: clips, isLoading, refetch } = useQuery({
    queryKey: ["admin-certifications", statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("clips")
        .select(`
          id,
          title,
          cert_status,
          cert_chain,
          cert_tx_hash,
          cert_explorer_url,
          cert_created_at,
          created_at,
          user_id,
          deleted_at
        `)
        .order("cert_created_at", { ascending: false, nullsFirst: false });

      if (statusFilter !== "all") {
        query = query.eq("cert_status", statusFilter);
      }

      const { data: clipsData, error } = await query;
      if (error) throw error;

      // Fetch profiles separately
      const userIds = [...new Set(clipsData.map(c => c.user_id))];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, username, full_name")
        .in("id", userIds);

      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);

      return clipsData.map(clip => ({
        ...clip,
        profiles: profilesMap.get(clip.user_id) || null,
      })) as (CertifiedClip & { deleted_at: string | null })[];
    },
  });

  // Calculate stats
  const stats = {
    total: clips?.filter(c => c.cert_status === "minted").length || 0,
    last24h: clips?.filter(c => {
      if (!c.cert_created_at) return false;
      const createdDate = new Date(c.cert_created_at);
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return createdDate > yesterday && c.cert_status === "minted";
    }).length || 0,
    failed: clips?.filter(c => c.cert_status === "failed").length || 0,
    chains: ["Polygon (MATIC)"],
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "minted":
        return (
          <Badge className="bg-green-500">
            <CheckCircle className="h-3 w-3 mr-1" />
            On-chain ✅
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-500">
            <Clock className="h-3 w-3 mr-1" />
            Pending ⏳
          </Badge>
        );
      case "minting":
        return (
          <Badge className="bg-blue-500">
            <Clock className="h-3 w-3 mr-1" />
            Minting...
          </Badge>
        );
      case "failed":
        return (
          <Badge className="bg-red-500">
            <XCircle className="h-3 w-3 mr-1" />
            Error ❌
          </Badge>
        );
      default:
        return <Badge variant="outline">Not Requested</Badge>;
    }
  };

  const shortenHash = (hash: string) => {
    return `${hash.substring(0, 6)}...${hash.substring(hash.length - 4)}`;
  };

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    toast.success("Transaction hash copied");
  };

  const handleRetry = async (clipId: string) => {
    try {
      const { error } = await supabase.functions.invoke("mint-clip-certificate", {
        body: { clipId },
      });

      if (error) throw error;
      toast.success("Certification retry initiated");
      refetch();
    } catch (error) {
      console.error("Retry error:", error);
      toast.error("Failed to retry certification");
    }
  };

  const filteredClips = clips?.filter(clip => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      clip.title?.toLowerCase().includes(query) ||
      clip.id.toLowerCase().includes(query) ||
      clip.profiles?.username?.toLowerCase().includes(query) ||
      clip.cert_tx_hash?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            Seeksy Certification Console
          </h1>
          <p className="text-muted-foreground mt-1">
            Blockchain certification activity and management
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Certified Clips</CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Certs Last 24h</CardDescription>
            <CardTitle className="text-3xl">{stats.last24h}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Failed Attempts</CardDescription>
            <CardTitle className="text-3xl text-red-500">{stats.failed}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Active Chains</CardDescription>
            <CardTitle className="text-xl">
              {stats.chains.map(chain => (
                <Badge key={chain} variant="outline" className="mr-1">
                  {chain}
                </Badge>
              ))}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Certification Activity</CardTitle>
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by title, clip ID, creator, or tx hash..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="minted">On-chain</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="minting">Minting</SelectItem>
                <SelectItem value="failed">Error</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredClips && filteredClips.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Clip</TableHead>
                  <TableHead>Creator</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tx Hash</TableHead>
                  <TableHead>Chain</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClips.map((clip) => (
                  <TableRow key={clip.id}>
                    <TableCell className="text-xs">
                      {clip.cert_created_at ? (
                        <>
                          <div>{format(new Date(clip.cert_created_at), "MMM d, h:mm a")}</div>
                          <div className="text-muted-foreground">
                            {formatDistanceToNow(new Date(clip.cert_created_at), { addSuffix: true })}
                          </div>
                        </>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="font-medium">
                          {clip.title || "Untitled"}
                          {clip.deleted_at && (
                            <Badge variant="outline" className="ml-2 text-xs text-muted-foreground">
                              Deleted
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">{clip.id.substring(0, 8)}...</div>
                    </TableCell>
                    <TableCell>
                      <div>{clip.profiles?.full_name || clip.profiles?.username || "Unknown"}</div>
                      <div className="text-xs text-muted-foreground">@{clip.profiles?.username}</div>
                    </TableCell>
                    <TableCell>{getStatusBadge(clip.cert_status)}</TableCell>
                    <TableCell>
                      {clip.cert_tx_hash ? (
                        <div className="flex items-center gap-2">
                          <code className="text-xs">{shortenHash(clip.cert_tx_hash)}</code>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCopyHash(clip.cert_tx_hash!)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          {clip.cert_explorer_url && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => window.open(clip.cert_explorer_url!, "_blank")}
                            >
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {clip.cert_chain ? (
                        <Badge variant="outline" className="capitalize">
                          {clip.cert_chain}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedClip(clip);
                            setSheetOpen(true);
                          }}
                        >
                          View
                        </Button>
                        {clip.cert_status === "failed" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRetry(clip.id)}
                          >
                            Retry
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              No certification records found
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Certificate Details</SheetTitle>
            <SheetDescription>
              Blockchain certification information
            </SheetDescription>
          </SheetHeader>
          {selectedClip && (
            <div className="mt-6 space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Clip Information</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Title:</span>{" "}
                    <span className="font-medium">{selectedClip.title || "Untitled"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Clip ID:</span>{" "}
                    <code className="text-xs bg-muted px-2 py-1 rounded">{selectedClip.id}</code>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Creator:</span>{" "}
                    <span className="font-medium">
                      {selectedClip.profiles?.full_name || selectedClip.profiles?.username || "Unknown"}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Status Timeline</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Render complete</span>
                  </div>
                  {selectedClip.cert_status !== "not_requested" && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Certification requested</span>
                    </div>
                  )}
                  {selectedClip.cert_status === "minted" && (
                    <>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm">Tx sent</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm">On-chain confirmed</span>
                      </div>
                    </>
                  )}
                  {selectedClip.cert_status === "failed" && (
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-500" />
                      <span className="text-sm">Error occurred</span>
                    </div>
                  )}
                </div>
              </div>

              {selectedClip.cert_status === "minted" && (
                <div>
                  <h3 className="font-semibold mb-2">On-chain Details</h3>
                  <div className="space-y-3 text-sm">
                    {selectedClip.cert_chain && (
                      <div>
                        <span className="text-muted-foreground">Chain:</span>{" "}
                        <Badge variant="outline" className="ml-2 capitalize">
                          {selectedClip.cert_chain}
                        </Badge>
                      </div>
                    )}
                    {selectedClip.cert_tx_hash && (
                      <div>
                        <span className="text-muted-foreground">Transaction Hash:</span>
                        <div className="mt-1 flex items-center gap-2">
                          <code className="text-xs bg-muted px-2 py-1 rounded break-all">
                            {selectedClip.cert_tx_hash}
                          </code>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCopyHash(selectedClip.cert_tx_hash!)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                    {selectedClip.cert_created_at && (
                      <div>
                        <span className="text-muted-foreground">Certified At:</span>{" "}
                        <span className="font-medium">
                          {format(new Date(selectedClip.cert_created_at), "MMMM d, yyyy 'at' h:mm a")}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-2 pt-4 border-t">
                <Button className="w-full" onClick={() => window.open(`/certificate/${selectedClip.id}`, "_blank")}>
                  Open Certificate Page
                </Button>
                {selectedClip.cert_explorer_url && (
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => window.open(selectedClip.cert_explorer_url!, "_blank")}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open on PolygonScan
                  </Button>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
