import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { 
  Mic, Volume2, Headphones, Settings, Sparkles,
  ChevronDown, ArrowLeft
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MediaDevice {
  deviceId: string;
  label: string;
}

interface AudioPreJoinScreenProps {
  onEnterStudio: () => void;
  onBack: () => void;
}

const micPresets = [
  { id: "custom", name: "Custom / Default", gain: 50 },
  { id: "sm7b", name: "Shure SM7B", gain: 70 },
  { id: "podmicusb", name: "Rode PodMic USB", gain: 55 },
  { id: "re20", name: "Electro-Voice RE20", gain: 65 },
  { id: "at2020", name: "Audio-Technica AT2020", gain: 60 },
  { id: "blue-yeti", name: "Blue Yeti", gain: 45 },
  { id: "sm58", name: "Shure SM58", gain: 60 },
];

export function AudioPreJoinScreen({ onEnterStudio, onBack }: AudioPreJoinScreenProps) {
  const [microphones, setMicrophones] = useState<MediaDevice[]>([]);
  const [speakers, setSpeakers] = useState<MediaDevice[]>([]);
  const [selectedMic, setSelectedMic] = useState<string>("");
  const [selectedSpeaker, setSelectedSpeaker] = useState<string>("");
  const [selectedPreset, setSelectedPreset] = useState<string>("custom");
  const [gainLevel, setGainLevel] = useState<number>(50);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  
  // Enhancements
  const [noiseReduction, setNoiseReduction] = useState(true);
  const [voiceEnhancement, setVoiceEnhancement] = useState(true);
  const [deSibilance, setDeSibilance] = useState(false);
  const [autoLeveling, setAutoLeveling] = useState(true);

  // Load devices
  useEffect(() => {
    async function loadDevices() {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        const devices = await navigator.mediaDevices.enumerateDevices();
        
        const mics = devices
          .filter(d => d.kind === "audioinput")
          .map(d => ({ deviceId: d.deviceId, label: d.label || `Microphone ${d.deviceId.slice(0, 4)}` }));
        
        const spkrs = devices
          .filter(d => d.kind === "audiooutput")
          .map(d => ({ deviceId: d.deviceId, label: d.label || `Speaker ${d.deviceId.slice(0, 4)}` }));
        
        setMicrophones(mics);
        setSpeakers(spkrs);
        
        if (mics.length > 0) setSelectedMic(mics[0].deviceId);
        if (spkrs.length > 0) setSelectedSpeaker(spkrs[0].deviceId);
      } catch (err) {
        console.error("Error loading devices:", err);
      }
    }
    
    loadDevices();
  }, []);

  // Simulate audio level monitoring
  useEffect(() => {
    const interval = setInterval(() => {
      setAudioLevel(Math.random() * 60 + Math.random() * 40 * (gainLevel / 100));
    }, 100);
    return () => clearInterval(interval);
  }, [gainLevel]);

  // Apply preset when changed
  useEffect(() => {
    const preset = micPresets.find(p => p.id === selectedPreset);
    if (preset) {
      setGainLevel(preset.gain);
    }
  }, [selectedPreset]);

  const handleTestSpeaker = () => {
    const audioContext = new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 440;
    gainNode.gain.value = 0.1;
    
    oscillator.start();
    setTimeout(() => oscillator.stop(), 500);
  };

  return (
    <div className="h-screen bg-[#0d0f12] flex items-center justify-center p-8">
      <div className="w-full max-w-2xl">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-6 text-white/60 hover:text-white hover:bg-white/10 gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Studio
        </Button>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mx-auto mb-4">
              <Mic className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Audio Studio Setup</h1>
            <p className="text-white/50">Configure your microphone and audio settings</p>
          </div>

          <div className="space-y-6">
            {/* Microphone Selection */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-white/70 flex items-center gap-2">
                  <Mic className="w-4 h-4" /> Microphone
                </Label>
                <Select value={selectedMic} onValueChange={setSelectedMic}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Select microphone" />
                  </SelectTrigger>
                  <SelectContent>
                    {microphones.map(mic => (
                      <SelectItem key={mic.deviceId} value={mic.deviceId}>
                        {mic.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-white/70 flex items-center gap-2">
                  <Settings className="w-4 h-4" /> Mic Preset
                </Label>
                <Select value={selectedPreset} onValueChange={setSelectedPreset}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Select preset" />
                  </SelectTrigger>
                  <SelectContent>
                    {micPresets.map(preset => (
                      <SelectItem key={preset.id} value={preset.id}>
                        {preset.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Gain Slider */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-white/70">Input Gain</Label>
                <span className="text-sm text-white/50">{gainLevel}%</span>
              </div>
              <Slider
                value={[gainLevel]}
                onValueChange={([v]) => setGainLevel(v)}
                max={100}
                step={1}
                className="py-2"
              />
            </div>

            {/* Audio Level Meter */}
            <div className="space-y-2">
              <Label className="text-white/70">Microphone Level</Label>
              <div className="h-6 bg-white/5 rounded-full overflow-hidden border border-white/10">
                <div 
                  className={cn(
                    "h-full transition-all duration-75 rounded-full",
                    audioLevel > 80 ? "bg-red-500" : audioLevel > 60 ? "bg-amber-500" : "bg-green-500"
                  )}
                  style={{ width: `${audioLevel}%` }}
                />
              </div>
              <p className="text-xs text-white/40">Speak to test your microphone level</p>
            </div>

            {/* Speaker */}
            <div className="space-y-2">
              <Label className="text-white/70 flex items-center gap-2">
                <Headphones className="w-4 h-4" /> Monitoring Output
              </Label>
              <div className="flex gap-2">
                <Select value={selectedSpeaker} onValueChange={setSelectedSpeaker}>
                  <SelectTrigger className="flex-1 bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Select speaker" />
                  </SelectTrigger>
                  <SelectContent>
                    {speakers.map(spkr => (
                      <SelectItem key={spkr.deviceId} value={spkr.deviceId}>
                        {spkr.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleTestSpeaker}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Test
                </Button>
              </div>
            </div>

            {/* Audio Enhancements */}
            <div className="space-y-3">
              <Label className="text-white/70 flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> Audio Enhancements
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                  <span className="text-sm text-white/70">Noise Reduction</span>
                  <Switch checked={noiseReduction} onCheckedChange={setNoiseReduction} />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                  <span className="text-sm text-white/70">Voice Enhancement</span>
                  <Switch checked={voiceEnhancement} onCheckedChange={setVoiceEnhancement} />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                  <span className="text-sm text-white/70">De-Sibilance</span>
                  <Switch checked={deSibilance} onCheckedChange={setDeSibilance} />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                  <span className="text-sm text-white/70">Auto-Leveling</span>
                  <Switch checked={autoLeveling} onCheckedChange={setAutoLeveling} />
                </div>
              </div>
            </div>

            {/* Enter Studio Button */}
            <Button
              onClick={onEnterStudio}
              className="w-full h-14 text-lg bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-400 hover:to-purple-500 shadow-lg"
            >
              Enter Audio Studio
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
