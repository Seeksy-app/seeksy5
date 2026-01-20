import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Mic, Video } from "lucide-react";

interface RecordingTypeSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const recordingTypes = [
  {
    id: "audio",
    title: "Audio Studio",
    description: "Professional audio-only recording with waveform preview and AI enhancement.",
    icon: Mic,
    color: "bg-violet-500",
    features: ["AI Cleanup", "Host-Read Scripts", "Auto Markers"],
    path: "/studio/audio",
  },
  {
    id: "video",
    title: "Video Studio",
    description: "Video + audio recording for solo or guest sessions.",
    icon: Video,
    color: "bg-blue-500",
    features: ["Guest Support", "Scene Presets", "Live Transcript", "Auto Vertical Clips"],
    path: "/studio/video",
  },
];

export function RecordingTypeSelector({ open, onOpenChange }: RecordingTypeSelectorProps) {
  const navigate = useNavigate();

  const handleSelect = (path: string) => {
    onOpenChange(false);
    navigate(path);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b border-border">
          <DialogTitle className="text-xl">Choose Recording Type</DialogTitle>
          <DialogDescription>Select the studio mode for your podcast</DialogDescription>
        </DialogHeader>
        
        <div className="p-6">
          <div className="grid grid-cols-1 gap-4">
            {recordingTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => handleSelect(type.path)}
                className="group text-left p-5 rounded-xl border border-border bg-card hover:border-primary/50 hover:bg-accent/30 transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className={`w-14 h-14 rounded-xl ${type.color} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}>
                    <type.icon className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg text-foreground mb-1 group-hover:text-primary transition-colors">
                      {type.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      {type.description}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {type.features.map((feature) => (
                        <span 
                          key={feature} 
                          className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
