import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, MoreVertical, CheckCircle2, XCircle, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useIdentityStatus } from "@/hooks/useIdentityStatus";

export const IdentityStatusWidget = () => {
  const navigate = useNavigate();
  const { data: identityStatus } = useIdentityStatus();

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            Identity Status
          </CardTitle>
          <CardDescription className="text-xs mt-1">
            Face and voice verification
          </CardDescription>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Hide widget</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
            <span className="text-sm font-medium">Face</span>
            <div className="flex items-center gap-2">
              {identityStatus?.faceVerified ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-xs text-muted-foreground">Verified</span>
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Not verified</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
            <span className="text-sm font-medium">Voice</span>
            <div className="flex items-center gap-2">
              {identityStatus?.voiceVerified ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-xs text-muted-foreground">Verified</span>
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Not verified</span>
                </>
              )}
            </div>
          </div>

          <div className="pt-2">
            <p className="text-xs text-muted-foreground mb-3">
              Overall: <span className="font-medium capitalize">{identityStatus?.overallStatus}</span>
            </p>

            {/* View on Polygon links */}
            {(identityStatus?.faceExplorerUrl || identityStatus?.voiceExplorerUrl) && (
              <div className="space-y-1 mb-3">
                {identityStatus?.faceExplorerUrl && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-xs h-7"
                    onClick={() => window.open(identityStatus.faceExplorerUrl!, "_blank")}
                  >
                    <ExternalLink className="h-3 w-3 mr-2" />
                    Face on Polygon
                  </Button>
                )}
                {identityStatus?.voiceExplorerUrl && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-xs h-7"
                    onClick={() => window.open(identityStatus.voiceExplorerUrl!, "_blank")}
                  >
                    <ExternalLink className="h-3 w-3 mr-2" />
                    Voice on Polygon
                  </Button>
                )}
              </div>
            )}

            <Button size="sm" className="w-full" onClick={() => navigate("/identity")}>
              {identityStatus?.overallStatus === 'verified' ? 'Manage Identity' : 'Complete Identity'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
