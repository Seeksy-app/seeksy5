import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Mic, CheckCircle2, XCircle, Loader2, Shield } from "lucide-react";

interface DeviceCheckProps {
  audioLevel: number;
  onContinue: () => void;
  onBack: () => void;
  error?: string | null;
  onInit: () => Promise<void>;
}

export function DeviceCheck({ audioLevel, onContinue, onBack, error, onInit }: DeviceCheckProps) {
  const [selectedMic, setSelectedMic] = useState<string>("");
  const [availableMics, setAvailableMics] = useState<MediaDeviceInfo[]>([]);
  const [isInitializing, setIsInitializing] = useState(false);

  // Fetch real identity status
  const { data: identityStatus } = useQuery({
    queryKey: ["identity-status"],
    queryFn: async (): Promise<{ voiceVerified: boolean; faceVerified: boolean }> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { voiceVerified: false, faceVerified: false };

      const [faceResult, voiceResult] = await Promise.all([
        // @ts-ignore
        supabase.from("identity_assets")
          .select("id")
          .eq("user_id", user.id)
          .eq("asset_type", "FACE_IDENTITY")
          .eq("cert_status", "minted")
          .limit(1),
        // @ts-ignore
        supabase.from("creator_voice_profiles")
          .select("id")
          .eq("user_id", user.id)
          .eq("is_verified", true)
          .limit(1)
      ]);

      return {
        faceVerified: !!(faceResult.data && faceResult.data.length > 0),
        voiceVerified: !!(voiceResult.data && voiceResult.data.length > 0),
      };
    },
  });

  // Initialize devices on mount
  useEffect(() => {
    const init = async () => {
      setIsInitializing(true);
      try {
        await onInit();
        // Enumerate devices after permission granted
        const devices = await navigator.mediaDevices.enumerateDevices();
        const mics = devices.filter(device => device.kind === "audioinput");
        setAvailableMics(mics);
        if (mics.length > 0 && !selectedMic) {
          setSelectedMic(mics[0].deviceId);
        }
      } catch (err) {
        console.error("Failed to initialize:", err);
      } finally {
        setIsInitializing(false);
      }
    };
    init();
  }, [onInit]);

  const isReady = audioLevel > 0 && !error && !isInitializing;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/10 p-6">
      <Card className="max-w-2xl w-full p-8 space-y-8 shadow-2xl">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-purple-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
            <Mic className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold">Check your setup</h1>
          <p className="text-muted-foreground">
            We'll quickly test your mic before you start recording
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
            <XCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-destructive">Microphone Access Error</p>
              <p className="text-sm text-muted-foreground mt-1">{error}</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-3"
                onClick={() => window.location.reload()}
              >
                Retry
              </Button>
            </div>
          </div>
        )}

        {/* Initializing State */}
        {isInitializing && !error && (
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 flex items-center gap-3 animate-in fade-in">
            <Loader2 className="w-5 h-5 text-primary animate-spin" />
            <p className="text-sm">Requesting microphone access...</p>
          </div>
        )}

        {/* Microphone Selection */}
        {availableMics.length > 0 && (
          <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
            <label className="text-sm font-medium">Microphone</label>
            <Select value={selectedMic} onValueChange={setSelectedMic}>
              <SelectTrigger>
                <SelectValue placeholder="Select microphone" />
              </SelectTrigger>
              <SelectContent>
                {availableMics.map(mic => (
                  <SelectItem key={mic.deviceId} value={mic.deviceId}>
                    {mic.label || `Microphone ${mic.deviceId.slice(0, 8)}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Mic Level Meter */}
        {!isInitializing && (
          <div className="space-y-3 animate-in fade-in slide-in-from-bottom-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Mic Level</label>
              <span className="text-xs text-muted-foreground">
                {audioLevel > 0.05 ? "✓ Detecting audio" : "Speak to test"}
              </span>
            </div>
            <div className="h-4 bg-muted rounded-full overflow-hidden relative">
              <div 
                className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 transition-all duration-75 ease-out"
                style={{ width: `${Math.min(audioLevel * 100, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Identity Status */}
        {identityStatus && (
          <Card className="bg-muted/30 border-muted p-4 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center gap-3 mb-3">
              <Shield className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Identity Status</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                {identityStatus.faceVerified ? (
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-muted-foreground" />
                )}
                <span className="text-sm">
                  Face: {identityStatus.faceVerified ? "Verified" : "Not verified"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {identityStatus.voiceVerified ? (
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-muted-foreground" />
                )}
                <span className="text-sm">
                  Voice: {identityStatus.voiceVerified ? "Verified" : "Not verified"}
                </span>
              </div>
            </div>
            {(!identityStatus.faceVerified || !identityStatus.voiceVerified) && (
              <p className="text-xs text-muted-foreground mt-3">
                💡 Tip: Verify your identity to unlock better trust with advertisers
              </p>
            )}
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4">
          <Button variant="ghost" onClick={onBack}>
            Back to Studio
          </Button>
          <Button 
            size="lg" 
            onClick={onContinue}
            disabled={!isReady}
            className="gap-2 min-w-[200px]"
          >
            {isInitializing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Initializing...
              </>
            ) : !isReady ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Waiting...
              </>
            ) : (
              <>
                Continue to Studio
                <CheckCircle2 className="w-5 h-5" />
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
}
