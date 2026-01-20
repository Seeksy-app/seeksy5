import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Video, VideoOff, Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import { toast } from "sonner";

interface DeviceTestDialogProps {
  open: boolean;
  onContinue: (selectedDevices: {
    videoDeviceId: string | null;
    audioInputDeviceId: string | null;
    audioOutputDeviceId: string | null;
  }) => void;
}

export function DeviceTestDialog({ open, onContinue }: DeviceTestDialogProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [audioInputDevices, setAudioInputDevices] = useState<MediaDeviceInfo[]>([]);
  const [audioOutputDevices, setAudioOutputDevices] = useState<MediaDeviceInfo[]>([]);

  const [selectedVideoDevice, setSelectedVideoDevice] = useState<string>("");
  const [selectedAudioInput, setSelectedAudioInput] = useState<string>("");
  const [selectedAudioOutput, setSelectedAudioOutput] = useState<string>("");

  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [micLevel, setMicLevel] = useState(0);
  const [testingAudio, setTestingAudio] = useState(false);

  // Load available devices
  useEffect(() => {
    if (open) {
      loadDevices();
    }
  }, [open]);

  const loadDevices = async () => {
    try {
      let videoPermissionGranted = false;
      let audioPermissionGranted = false;

      // Request video permission first
      try {
        const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
        videoStream.getTracks().forEach(track => track.stop()); // Stop immediately, we just need permission
        videoPermissionGranted = true;
      } catch (videoError) {
        console.error('Video permission denied:', videoError);
        toast.error("Camera access denied. Please allow camera access to continue.");
      }

      // Request audio permission separately
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioStream.getTracks().forEach(track => track.stop()); // Stop immediately, we just need permission
        audioPermissionGranted = true;
      } catch (audioError) {
        console.error('Audio permission denied:', audioError);
        toast.error("Microphone access denied. Please allow microphone access to continue.");
      }

      // If both permissions were denied, show a combined error
      if (!videoPermissionGranted && !audioPermissionGranted) {
        toast.error("Both camera and microphone access denied. Please check your browser permissions.");
        return;
      }
      
      const devices = await navigator.mediaDevices.enumerateDevices();
      
      const videoInputs = devices.filter(d => d.kind === 'videoinput');
      const audioInputs = devices.filter(d => d.kind === 'audioinput');
      const audioOutputs = devices.filter(d => d.kind === 'audiooutput');

      setVideoDevices(videoInputs);
      setAudioInputDevices(audioInputs);
      setAudioOutputDevices(audioOutputs);

      // Set defaults
      if (videoInputs.length > 0 && !selectedVideoDevice && videoPermissionGranted) {
        setSelectedVideoDevice(videoInputs[0].deviceId);
      }
      if (audioInputs.length > 0 && !selectedAudioInput && audioPermissionGranted) {
        setSelectedAudioInput(audioInputs[0].deviceId);
      }
      if (audioOutputs.length > 0 && !selectedAudioOutput) {
        setSelectedAudioOutput(audioOutputs[0].deviceId);
      }
    } catch (error) {
      console.error('Error loading devices:', error);
      toast.error("Unable to access media devices. Please check your browser permissions.");
    }
  };

  // Start preview stream
  useEffect(() => {
    if (open && selectedVideoDevice && selectedAudioInput) {
      startPreview();
    }

    return () => {
      stopPreview();
    };
  }, [open, selectedVideoDevice, selectedAudioInput]);

  const startPreview = async () => {
    try {
      stopPreview();

      const constraints: MediaStreamConstraints = {
        video: selectedVideoDevice ? { deviceId: { exact: selectedVideoDevice } } : true,
        audio: selectedAudioInput ? { 
          deviceId: { exact: selectedAudioInput },
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } : true,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Set up audio level monitoring
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;
      
      source.connect(analyser);

      // Monitor audio levels
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateLevel = () => {
        if (analyserRef.current && isMicOn) {
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          setMicLevel(Math.min(100, (average / 255) * 100 * 2));
          requestAnimationFrame(updateLevel);
        }
      };
      updateLevel();

    } catch (error) {
      console.error('Error starting preview:', error);
      toast.error("Failed to start device preview");
    }
  };

  const stopPreview = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  };

  // Toggle video
  useEffect(() => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = isVideoOn;
      }
    }
  }, [isVideoOn]);

  // Toggle audio
  useEffect(() => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = isMicOn;
      }
    }
  }, [isMicOn]);

  const testSpeakers = () => {
    setTestingAudio(true);
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTSJ0/LTgjMGHm7A7+OZSA0PU6rk77JfGQxdse7zuWw1'); // Test tone
    
    if (selectedAudioOutput && (audio as any).setSinkId) {
      (audio as any).setSinkId(selectedAudioOutput).catch(() => {
        toast.error("Could not set audio output device");
      });
    }
    
    audio.play();
    audio.onended = () => setTestingAudio(false);
  };

  const handleContinue = () => {
    stopPreview();
    onContinue({
      videoDeviceId: selectedVideoDevice || null,
      audioInputDeviceId: selectedAudioInput || null,
      audioOutputDeviceId: selectedAudioOutput || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-3xl" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Test Your Devices</DialogTitle>
          <DialogDescription>
            Check your camera, microphone, and speakers before joining the meeting
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Video Preview */}
          <div className="space-y-3">
            <Label>Camera</Label>
            <div className="relative aspect-video bg-zinc-900 rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {!isVideoOn && (
                <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
                  <div className="text-white text-center">
                    <VideoOff className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm opacity-75">Camera Off</p>
                  </div>
                </div>
              )}
              <Button
                variant="secondary"
                size="sm"
                className="absolute bottom-3 left-3"
                onClick={() => setIsVideoOn(!isVideoOn)}
              >
                {isVideoOn ? <Video className="h-4 w-4 mr-2" /> : <VideoOff className="h-4 w-4 mr-2" />}
                {isVideoOn ? "Turn Off" : "Turn On"}
              </Button>
            </div>
            <Select value={selectedVideoDevice} onValueChange={setSelectedVideoDevice}>
              <SelectTrigger>
                <SelectValue placeholder="Select camera" />
              </SelectTrigger>
              <SelectContent>
                {videoDevices.map((device) => (
                  <SelectItem key={device.deviceId} value={device.deviceId}>
                    {device.label || `Camera ${videoDevices.indexOf(device) + 1}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Microphone */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Microphone (Audio Input)</Label>
            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsMicOn(!isMicOn)}
              >
                {isMicOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
              </Button>
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 transition-all duration-100"
                  style={{ width: `${micLevel}%` }}
                />
              </div>
              <span className="text-sm text-muted-foreground min-w-[60px]">
                {isMicOn ? "Speak to test" : "Muted"}
              </span>
            </div>
            <Select value={selectedAudioInput} onValueChange={setSelectedAudioInput}>
              <SelectTrigger className="text-base">
                <SelectValue placeholder="Select audio input source" />
              </SelectTrigger>
              <SelectContent>
                {audioInputDevices.map((device) => (
                  <SelectItem key={device.deviceId} value={device.deviceId} className="text-base">
                    {device.label || `Microphone ${audioInputDevices.indexOf(device) + 1}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {audioInputDevices.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {audioInputDevices.length} audio source{audioInputDevices.length > 1 ? 's' : ''} detected. 
                Your computer microphone, earbuds, and other audio devices will appear here.
              </p>
            )}
          </div>

          {/* Speakers */}
          <div className="space-y-3">
            <Label>Speakers</Label>
            <div className="flex gap-2">
              <Select value={selectedAudioOutput} onValueChange={setSelectedAudioOutput}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select speakers" />
                </SelectTrigger>
                <SelectContent>
                  {audioOutputDevices.map((device) => (
                    <SelectItem key={device.deviceId} value={device.deviceId}>
                      {device.label || `Speaker ${audioOutputDevices.indexOf(device) + 1}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                variant="outline" 
                onClick={testSpeakers}
                disabled={testingAudio}
              >
                {testingAudio ? <VolumeX className="h-4 w-4 mr-2" /> : <Volume2 className="h-4 w-4 mr-2" />}
                Test Sound
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleContinue} size="lg" className="w-full">
            Continue to Meeting
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
