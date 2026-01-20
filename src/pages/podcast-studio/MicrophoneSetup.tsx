import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Mic, ArrowRight } from "lucide-react";

const MicrophoneSetup = () => {
  const navigate = useNavigate();
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [echoReduction, setEchoReduction] = useState(true);
  const [basicAICleanup, setBasicAICleanup] = useState(true);

  useEffect(() => {
    // Get available audio input devices
    navigator.mediaDevices.enumerateDevices().then((deviceList) => {
      const audioInputs = deviceList.filter(
        (device) => device.kind === "audioinput"
      );
      setDevices(audioInputs);
      if (audioInputs.length > 0) {
        setSelectedDevice(audioInputs[0].deviceId);
      }
    });
  }, []);

  const handleContinue = () => {
    const micSettings = {
      deviceId: selectedDevice,
      deviceLabel: devices.find((d) => d.deviceId === selectedDevice)?.label || "Default",
      echoReduction,
      basicAICleanup,
    };

    navigate("/podcast-studio/record", { state: { micSettings } });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#053877] to-[#041d3a] flex items-center justify-center p-6">
      <Card className="w-full max-w-2xl p-8 bg-white/95 backdrop-blur">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#053877] to-[#2C6BED] flex items-center justify-center">
              <Mic className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#053877]">
                Microphone Setup
              </h2>
              <p className="text-sm text-muted-foreground">
                Configure your audio input settings
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="microphone">Select Microphone</Label>
              <Select value={selectedDevice} onValueChange={setSelectedDevice}>
                <SelectTrigger id="microphone">
                  <SelectValue placeholder="Choose a microphone" />
                </SelectTrigger>
                <SelectContent>
                  {devices.map((device) => (
                    <SelectItem key={device.deviceId} value={device.deviceId}>
                      {device.label || `Microphone ${device.deviceId.slice(0, 8)}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/30">
              <div className="space-y-0.5">
                <Label htmlFor="echo-reduction" className="text-base">
                  Echo Reduction
                </Label>
                <p className="text-sm text-muted-foreground">
                  Minimize echo and feedback
                </p>
              </div>
              <Switch
                id="echo-reduction"
                checked={echoReduction}
                onCheckedChange={setEchoReduction}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/30">
              <div className="space-y-0.5">
                <Label htmlFor="basic-cleanup" className="text-base">
                  Basic AI Cleanup
                </Label>
                <p className="text-sm text-muted-foreground">
                  Real-time noise reduction
                </p>
              </div>
              <Switch
                id="basic-cleanup"
                checked={basicAICleanup}
                onCheckedChange={setBasicAICleanup}
              />
            </div>
          </div>

          <Button
            onClick={handleContinue}
            disabled={!selectedDevice}
            className="w-full bg-[#2C6BED] hover:bg-[#2C6BED]/90 text-white h-12"
          >
            Continue to Recording
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default MicrophoneSetup;
