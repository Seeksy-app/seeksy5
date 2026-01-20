import { useEffect, useRef } from "react";
import WaveSurfer from "wavesurfer.js";

interface AudioWaveformProps {
  audioUrl: string;
}

export const AudioWaveform = ({ audioUrl }: AudioWaveformProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const wavesurfer = WaveSurfer.create({
      container: containerRef.current,
      waveColor: "hsl(var(--muted-foreground) / 0.3)",
      progressColor: "hsl(var(--primary))",
      cursorColor: "hsl(var(--primary))",
      barWidth: 2,
      barRadius: 3,
      cursorWidth: 2,
      height: 80,
      barGap: 2,
      normalize: true,
      interact: false,
    });

    wavesurfer.load(audioUrl);
    wavesurferRef.current = wavesurfer;

    return () => {
      wavesurfer.destroy();
    };
  }, [audioUrl]);

  return <div ref={containerRef} className="w-full" />;
};
