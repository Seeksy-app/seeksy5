import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Award,
  Search,
  ExternalLink,
  Calendar,
  Shield,
  Fingerprint,
  Download,
  SortAsc,
  SortDesc,
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

type SortField = "newest" | "oldest" | "creator" | "tokenId";

export default function VoiceNFTCertificatesPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortField>("newest");

  const { data: certificates, isLoading } = useQuery({
    queryKey: ["voice-nft-certificates-admin", sortBy],
    queryFn: async () => {
      let query = supabase
        .from("voice_blockchain_certificates")
        .select(`
          *,
          creator_voice_profiles(
            id,
            voice_name,
            user_id
          )
        `);

      // Apply sorting
      if (sortBy === "newest") {
        query = query.order("created_at", { ascending: false });
      } else if (sortBy === "oldest") {
        query = query.order("created_at", { ascending: true });
      } else if (sortBy === "creator") {
        query = query.order("creator_id", { ascending: true });
      } else if (sortBy === "tokenId") {
        query = query.order("token_id", { ascending: true });
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    },
  });

  const filteredCertificates = certificates?.filter((cert) => {
    if (!searchQuery) return true;
    const lowerQuery = searchQuery.toLowerCase();
    return (
      cert.token_id.toLowerCase().includes(lowerQuery) ||
      cert.voice_fingerprint_hash.toLowerCase().includes(lowerQuery) ||
      cert.creator_voice_profiles?.voice_name?.toLowerCase().includes(lowerQuery) ||
      cert.transaction_hash.toLowerCase().includes(lowerQuery)
    );
  });

  const exportToCSV = () => {
    if (!filteredCertificates || filteredCertificates.length === 0) {
      toast({
        title: "No Data",
        description: "No certificates to export",
        variant: "destructive",
      });
      return;
    }

    const headers = ["Token ID", "Creator", "Voice Hash", "Transaction Hash", "Status", "Created Date"];
    const csvData = filteredCertificates.map((cert) => [
      cert.token_id,
      cert.creator_voice_profiles?.voice_name || "Unknown",
      cert.voice_fingerprint_hash,
      cert.transaction_hash,
      cert.certification_status,
      format(new Date(cert.created_at), "yyyy-MM-dd"),
    ]);

    const csvContent = [
      headers.join(","),
      ...csvData.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `voice-nft-certificates-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: `Exported ${filteredCertificates.length} certificates`,
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Award className="h-8 w-8 text-brand-gold" />
            Voice NFT Certificates
          </h1>
          <p className="text-muted-foreground mt-1">
            Blockchain-certified voice ownership on Polygon • Gasless • Permanent
          </p>
        </div>
        <Button onClick={exportToCSV} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Token ID, hash, creator, or transaction..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Sort */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Sort By</label>
              <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortField)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">
                    <div className="flex items-center gap-2">
                      <SortDesc className="h-4 w-4" />
                      Newest First
                    </div>
                  </SelectItem>
                  <SelectItem value="oldest">
                    <div className="flex items-center gap-2">
                      <SortAsc className="h-4 w-4" />
                      Oldest First
                    </div>
                  </SelectItem>
                  <SelectItem value="creator">Creator Name</SelectItem>
                  <SelectItem value="tokenId">Token ID</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Certificates</CardDescription>
            <CardTitle className="text-3xl">{certificates?.length || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Filtered Results</CardDescription>
            <CardTitle className="text-3xl">{filteredCertificates?.length || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Gas Free Mints</CardDescription>
            <CardTitle className="text-3xl">
              {certificates?.filter((c) => c.gas_sponsored).length || 0}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Certificates Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Certificate Gallery</CardTitle>
          <CardDescription>
            {filteredCertificates?.length || 0} certificate{filteredCertificates?.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-muted-foreground">Loading certificates...</p>
            </div>
          ) : !filteredCertificates || filteredCertificates.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 rounded-full bg-brand-gold/10 mx-auto mb-4 flex items-center justify-center">
                <Award className="h-10 w-10 text-brand-gold" />
              </div>
              <h3 className="text-xl font-bold mb-2">No Certificates Found</h3>
              <p className="text-muted-foreground">
                {searchQuery ? "Try adjusting your search" : "Voice NFTs will appear here once minted"}
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredCertificates.map((cert) => (
                <Card
                  key={cert.id}
                  className="border-2 border-brand-gold/20 hover:border-brand-gold/40 transition-all bg-gradient-to-br from-card to-brand-gold/5"
                >
                  <CardHeader>
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-brand-gold/20 to-primary/10 flex items-center justify-center flex-shrink-0">
                        <Award className="h-7 w-7 text-brand-gold" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base line-clamp-2 mb-2">
                          {cert.creator_voice_profiles?.voice_name || "Voice Profile"}
                        </CardTitle>
                        <Badge variant="outline" className="bg-brand-gold/10 text-brand-gold border-brand-gold/30">
                          Voice NFT
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Token ID */}
                    <div className="p-3 rounded-lg bg-muted/50 border border-brand-gold/20 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-medium text-brand-gold">
                        <Shield className="h-3 w-3" />
                        <span>NFT Token ID</span>
                      </div>
                      <div className="text-xs text-foreground font-mono break-all bg-background/50 p-2 rounded">
                        {cert.token_id}
                      </div>
                    </div>

                    {/* Voice Fingerprint Hash */}
                    <div className="p-3 rounded-lg bg-muted/50 border space-y-2">
                      <div className="flex items-center gap-2 text-xs font-medium">
                        <Fingerprint className="h-3 w-3 text-primary" />
                        <span>Voice Fingerprint</span>
                      </div>
                      <div className="text-xs text-muted-foreground font-mono break-all">
                        {cert.voice_fingerprint_hash.substring(0, 32)}...
                      </div>
                    </div>

                    {/* Date & Status */}
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{format(new Date(cert.created_at), "MMM dd, yyyy")}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-xs font-semibold text-green-600 capitalize">
                          {cert.certification_status}
                        </span>
                      </div>
                    </div>

                    {/* Explorer Link */}
                    <div className="pt-3 border-t flex items-center justify-between">
                      <div className="text-xs text-muted-foreground">
                        <span className="font-medium">Network:</span> Polygon
                      </div>
                      <a
                        href={cert.cert_explorer_url || `https://amoy.polygonscan.com/tx/${cert.transaction_hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        Polygonscan
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>

                    {/* Gas Sponsored Badge */}
                    {cert.gas_sponsored && (
                      <div className="text-center">
                        <span className="inline-flex items-center gap-1 text-xs bg-green-500/10 text-green-600 px-2 py-1 rounded-full">
                          ⚡ Gas Free • Paid by Seeksy
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
