import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";

interface RecordingWaveformProps {
  isRecording: boolean;
}

export const RecordingWaveform = ({ isRecording }: RecordingWaveformProps) => {
  const [bars, setBars] = useState<number[]>(Array(40).fill(0.2));

  useEffect(() => {
    if (!isRecording) {
      setBars(Array(40).fill(0.2));
      return;
    }

    const interval = setInterval(() => {
      setBars(prev => {
        const newBars = [...prev.slice(1), Math.random() * 0.8 + 0.2];
        return newBars;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [isRecording]);

  return (
    <Card className="p-6 bg-gradient-to-br from-purple-500/5 via-pink-500/5 to-blue-500/5">
      <div className="flex items-center justify-center h-32 gap-1">
        {bars.map((height, index) => (
          <div
            key={index}
            className="flex-1 bg-gradient-to-t from-primary to-purple-500 rounded-full transition-all duration-75"
            style={{
              height: `${height * 100}%`,
              opacity: isRecording ? 1 : 0.3,
            }}
          />
        ))}
      </div>
      <p className="text-center text-sm text-muted-foreground mt-4">
        {isRecording ? "Recording in progress..." : "Ready to record"}
      </p>
    </Card>
  );
};
