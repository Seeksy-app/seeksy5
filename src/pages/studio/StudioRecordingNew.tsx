import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DeviceCheck } from "@/components/studio/DeviceCheck";
import { LiveRecording } from "@/components/studio/LiveRecording";
import { useStudioRecorder } from "@/hooks/useStudioRecorder";
import { useToast } from "@/hooks/use-toast";

export default function StudioRecordingNew() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<"device-check" | "recording">("device-check");

  const recorder = useStudioRecorder({
    onStateChange: (state) => {
      if (state === "complete") {
        // Handled in stopRecording callback
      }
    },
    onError: (error) => {
      toast({
        title: "Recording Error",
        description: error.message,
        variant: "destructive",
      });
    },
    onMarkerAdded: (type, timestamp) => {
      const mins = Math.floor(timestamp / 60);
      const secs = timestamp % 60;
      const timeStr = `${mins}:${secs.toString().padStart(2, "0")}`;
      
      toast({
        title: type === "clip" ? "Clip Marker Added" : "Ad Marker Added",
        description: `Marked at ${timeStr}`,
      });
    },
  });

  const handleDeviceCheckContinue = async () => {
    setCurrentStep("recording");
    await recorder.startRecording();
  };

  const handleEndSession = async () => {
    const sessionId = await recorder.stopRecording();
    if (sessionId) {
      navigate(`/studio/post-session/${sessionId}`);
    }
  };

  if (currentStep === "device-check") {
    return (
      <DeviceCheck
        audioLevel={recorder.audioLevel}
        onContinue={handleDeviceCheckContinue}
        onBack={() => navigate("/studio")}
        error={recorder.error}
        onInit={async () => { await recorder.initializeDevices(); }}
      />
    );
  }

  return (
    <LiveRecording
      recorder={recorder}
      onEndSession={handleEndSession}
      onBack={() => navigate("/studio")}
    />
  );
}
