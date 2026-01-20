import { AlertCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface InstagramReconnectBannerProps {
  error?: string;
}

export function InstagramReconnectBanner({ error }: InstagramReconnectBannerProps) {
  const navigate = useNavigate();

  return (
    <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
      <div className="flex items-start gap-4">
        <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
        <div className="flex-1 space-y-2">
          <h4 className="font-medium text-destructive">
            Instagram connection expired
          </h4>
          <p className="text-sm text-muted-foreground">
            {error || "Reconnect to continue syncing data and viewing analytics."}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open('https://developers.facebook.com/docs/instagram-basic-display-api/guides/long-lived-access-tokens', '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-1" />
            Learn More
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => navigate('/integrations')}
          >
            Reconnect Instagram
          </Button>
        </div>
      </div>
    </div>
  );
}
