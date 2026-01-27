import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, AlertTriangle, CheckCircle, Database } from "lucide-react";

interface SystemHealthData {
  totalFaceCerts: number;
  totalVoiceCerts: number;
  missingTxCerts: number;
  profilesWithoutCert: number;
  faceProfilesWithoutCert: number;
  orphanCerts: number;
}

export function VoiceSystemHealthPanel() {
  const { data: healthData, isLoading } = useQuery({
    queryKey: ["voice-system-health"],
    queryFn: async () => {
      // Face certificates
      const { count: faceCerts } = await (supabase as any)
        .from("identity_assets")
        .select("*", { count: "exact", head: true })
        .eq("type", "face_identity")
        .eq("cert_status", "minted");

      // Voice certificates
      const { count: voiceCerts } = await (supabase as any)
        .from("voice_blockchain_certificates")
        .select("*", { count: "exact", head: true })
        .eq("certification_status", "verified");

      // Certificates missing blockchain transactions
      const { count: missingTx } = await (supabase as any)
        .from("voice_blockchain_certificates")
        .select("*", { count: "exact", head: true })
        .or("transaction_hash.is.null,cert_explorer_url.is.null");

      // Voice profiles without matching certificate
      const { count: profilesNoCert } = await (supabase as any)
        .from("creator_voice_profiles")
        .select(`
          id,
          voice_blockchain_certificates!left(id)
        `, { count: "exact", head: true })
        .is("voice_blockchain_certificates.id", null);

      // Face profiles without matching certificate
      const { count: faceNoCert } = await (supabase as any)
        .from("identity_assets")
        .select("*", { count: "exact", head: true })
        .eq("type", "face_identity")
        .neq("cert_status", "minted");

      // Orphan certificates (no creator)
      const { data: orphans } = await (supabase as any)
        .from("voice_blockchain_certificates")
        .select("id, creator_id")
        .is("creator_id", null);

      return {
        totalFaceCerts: faceCerts || 0,
        totalVoiceCerts: voiceCerts || 0,
        missingTxCerts: missingTx || 0,
        profilesWithoutCert: profilesNoCert || 0,
        faceProfilesWithoutCert: faceNoCert || 0,
        orphanCerts: orphans?.length || 0,
      } as SystemHealthData;
    },
  });

  const getStatusBadge = (value: number, isInverse: boolean = false) => {
    if (value === 0) {
      return isInverse ? (
        <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-200">
          <AlertTriangle className="h-3 w-3 mr-1" />
          None
        </Badge>
      ) : (
        <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          OK
        </Badge>
      );
    }

    if (!isInverse) {
      // For positive metrics (total certs), higher is better
      return (
        <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          {value}
        </Badge>
      );
    }

    // For negative metrics (errors), any value is bad
    if (value <= 5) {
      return (
        <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-200">
          <AlertTriangle className="h-3 w-3 mr-1" />
          {value}
        </Badge>
      );
    }

    return (
      <Badge variant="destructive">
        <AlertTriangle className="h-3 w-3 mr-1" />
        {value}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
            <span className="ml-3 text-muted-foreground">Checking system health...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasIssues =
    (healthData?.missingTxCerts || 0) > 0 ||
    (healthData?.profilesWithoutCert || 0) > 0 ||
    (healthData?.orphanCerts || 0) > 0;

  return (
    <Card className={hasIssues ? "border-yellow-500/50" : "border-green-500/50"}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-6 w-6" />
              Identity System Health
            </CardTitle>
            <CardDescription>
              Real-time diagnostics for voice and face certification system
            </CardDescription>
          </div>
          {!hasIssues ? (
            <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200 px-4 py-2">
              <CheckCircle className="h-4 w-4 mr-2" />
              All Systems Operational
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-200 px-4 py-2">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Attention Required
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
          {/* Total Face Certificates */}
          <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
            <div>
              <p className="text-xs text-muted-foreground">Face Certificates</p>
              <p className="text-2xl font-bold">{healthData?.totalFaceCerts || 0}</p>
            </div>
            <Shield className="h-8 w-8 text-primary opacity-50" />
          </div>

          {/* Total Voice Certificates */}
          <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
            <div>
              <p className="text-xs text-muted-foreground">Voice Certificates</p>
              <p className="text-2xl font-bold">{healthData?.totalVoiceCerts || 0}</p>
            </div>
            <Shield className="h-8 w-8 text-brand-gold opacity-50" />
          </div>

          {/* Missing Transactions */}
          <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
            <div>
              <p className="text-xs text-muted-foreground">Missing TX Hash</p>
              <p className="text-2xl font-bold">{healthData?.missingTxCerts || 0}</p>
            </div>
            {getStatusBadge(healthData?.missingTxCerts || 0, true)}
          </div>

          {/* Voice Profiles Without Cert */}
          <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
            <div>
              <p className="text-xs text-muted-foreground">Voice Profiles No Cert</p>
              <p className="text-2xl font-bold">{healthData?.profilesWithoutCert || 0}</p>
            </div>
            {getStatusBadge(healthData?.profilesWithoutCert || 0, true)}
          </div>

          {/* Face Profiles Without Cert */}
          <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
            <div>
              <p className="text-xs text-muted-foreground">Face Profiles No Cert</p>
              <p className="text-2xl font-bold">{healthData?.faceProfilesWithoutCert || 0}</p>
            </div>
            {getStatusBadge(healthData?.faceProfilesWithoutCert || 0, true)}
          </div>

          {/* Orphan Certificates */}
          <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
            <div>
              <p className="text-xs text-muted-foreground">Orphan Certificates</p>
              <p className="text-2xl font-bold">{healthData?.orphanCerts || 0}</p>
            </div>
            {getStatusBadge(healthData?.orphanCerts || 0, true)}
          </div>
        </div>

        {hasIssues && (
          <Alert variant="default" className="border-yellow-500/50 bg-yellow-500/5">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-sm">
              <strong>Action Required:</strong> Some certificates are missing blockchain data or profiles are
              incomplete. Review individual certificate pages to identify and fix issues.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
