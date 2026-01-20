import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, Mic, MoreVertical, ExternalLink, Shield, XCircle } from "lucide-react";
import { format } from "date-fns";
import { CertificationBadge, CertStatus } from "@/components/clips/CertificationBadge";

interface IdentityAsset {
  id: string;
  type: 'face_identity' | 'voice_identity';
  title: string;
  file_url: string;
  thumbnail_url?: string;
  cert_status: string;
  cert_chain?: string;
  cert_tx_hash?: string;
  cert_explorer_url?: string;
  created_at: string;
}

interface IdentityAssetCardProps {
  asset: IdentityAsset;
  onRevoke: () => void;
}

export function IdentityAssetCard({ asset, onRevoke }: IdentityAssetCardProps) {
  const isFace = asset.type === 'face_identity';

  return (
    <Card className="group hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        {/* Thumbnail */}
        <div className="relative aspect-video bg-muted rounded-lg mb-3 flex items-center justify-center overflow-hidden">
          {asset.thumbnail_url ? (
            <img
              src={asset.thumbnail_url}
              alt={asset.title}
              className="object-cover w-full h-full"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-muted-foreground">
              {isFace ? (
                <User className="h-12 w-12 mb-2" />
              ) : (
                <Mic className="h-12 w-12 mb-2" />
              )}
              <span className="text-sm">{isFace ? 'Face' : 'Voice'} Identity</span>
            </div>
          )}

          {/* Certification Badge */}
          <div className="absolute top-2 right-2">
            <CertificationBadge status={asset.cert_status as CertStatus} mini />
          </div>
        </div>

        {/* Content */}
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold truncate">{asset.title}</h3>
              <p className="text-xs text-muted-foreground">
                {format(new Date(asset.created_at), "MMM d, yyyy")}
              </p>
            </div>

            {/* Actions Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => window.open(asset.file_url, "_blank")}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open File
                </DropdownMenuItem>
                {asset.cert_status === 'minted' && asset.cert_explorer_url && (
                  <DropdownMenuItem onClick={() => window.open(asset.cert_explorer_url, "_blank")}>
                    <Shield className="h-4 w-4 mr-2" />
                    View Certificate
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={onRevoke} className="text-destructive">
                  <XCircle className="h-4 w-4 mr-2" />
                  Revoke Identity
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Type Badge */}
          <Badge variant="outline" className="text-xs">
            {isFace ? (
              <>
                <User className="h-3 w-3 mr-1" />
                Face
              </>
            ) : (
              <>
                <Mic className="h-3 w-3 mr-1" />
                Voice
              </>
            )}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}