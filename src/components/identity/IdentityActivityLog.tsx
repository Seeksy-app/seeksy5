import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, ExternalLink } from "lucide-react";
import { format } from "date-fns";

interface ActivityLog {
  id: string;
  action: string;
  created_at: string;
  details?: any;
}

interface IdentityActivityLogProps {
  logs: ActivityLog[];
  onViewFullLog?: () => void;
}

export const IdentityActivityLog = ({ logs, onViewFullLog }: IdentityActivityLogProps) => {
  const formatAction = (action: string) => {
    return action.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const getIdentityLabel = (type: string) => {
    if (type === 'voice_identity' || type === 'voice') return 'Voice';
    if (type === 'face_identity' || type === 'face') return 'Face';
    return type;
  };

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <h3 className="font-semibold text-center">Identity Activity & Access Log</h3>
        
        {logs.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No recent activity.
          </p>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => {
              const isVoiceOrFaceCert = log.details?.type === 'voice_identity' || 
                                         log.details?.type === 'face_identity' ||
                                         log.details?.type === 'voice' ||
                                         log.details?.type === 'face';
              const explorerUrl = log.details?.tx_hash 
                ? `https://amoy.polygonscan.com/tx/${log.details.tx_hash}`
                : null;

              return (
                <div key={log.id} className="flex items-start gap-3 text-sm pb-3 border-b last:border-0">
                  <Clock className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium">{formatAction(log.action)}</p>
                    {log.details && (
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>
                          {log.details.type && `${getIdentityLabel(log.details.type)} • `}
                          {log.details.chain && `${log.details.chain} • `}
                          {log.details.token_id && `Token ${log.details.token_id}`}
                        </p>
                        {isVoiceOrFaceCert && explorerUrl && (
                          <a 
                            href={explorerUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-primary hover:underline"
                          >
                            <ExternalLink className="h-3 w-3" />
                            View on Polygonscan
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {format(new Date(log.created_at), 'MMM d')}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {onViewFullLog && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onViewFullLog}
            className="w-full"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            View full log
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
