import { Badge } from "@/components/ui/badge";
import { Mic, Video, Wifi, Clock } from "lucide-react";
import { useEffect, useState } from "react";

export const RecordingStatusHeader = () => {
  const [recordingTime, setRecordingTime] = useState(0);
  const [micLevel, setMicLevel] = useState(0.5);

  useEffect(() => {
    const interval = setInterval(() => {
      setRecordingTime((t) => t + 1);
      setMicLevel(Math.random() * 0.5 + 0.3);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-6 bg-card/50 backdrop-blur-sm px-6 py-3 rounded-lg border">
      {/* Mic Level */}
      <div className="flex items-center gap-2">
        <Mic className="w-4 h-4 text-green-500" />
        <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-150"
            style={{ width: `${micLevel * 100}%` }}
          />
        </div>
      </div>

      {/* Camera Status */}
      <div className="flex items-center gap-2">
        <Video className="w-4 h-4 text-blue-500" />
        <Badge variant="secondary" className="text-xs">HD</Badge>
      </div>

      {/* Connection Quality */}
      <div className="flex items-center gap-2">
        <Wifi className="w-4 h-4 text-primary" />
        <span className="text-xs font-medium">Excellent</span>
      </div>

      {/* Recording Duration */}
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4 text-red-500 animate-pulse" />
        <span className="text-sm font-mono font-semibold">{formatTime(recordingTime)}</span>
      </div>
    </div>
  );
};
