import { useState, useRef, useCallback, useEffect } from "react";

interface Track {
  id: string;
  name: string;
  url?: string;
}

export function useBackgroundMusic() {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(50);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  // Initialize audio element
  useEffect(() => {
    const audio = new Audio();
    audio.loop = true;
    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.src = "";
    };
  }, []);

  // Update volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = volume / 100;
    }
  }, [volume]);

  const playTrack = useCallback((track: Track) => {
    if (!audioRef.current) return;

    // If same track, just toggle play/pause
    if (currentTrack?.id === track.id) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play().catch(console.error);
        setIsPlaying(true);
      }
      return;
    }

    // New track
    setCurrentTrack(track);
    
    if (track.url) {
      audioRef.current.src = track.url;
      audioRef.current.volume = volume / 100;
      audioRef.current.play().catch(console.error);
      setIsPlaying(true);
    } else {
      // Generate AI music placeholder (tone generator)
      generateTone(track.id);
    }
  }, [currentTrack, isPlaying, volume]);

  const generateTone = useCallback((genre: string) => {
    // Create audio context for AI-style generated tones
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    const ctx = audioContextRef.current;
    
    // Stop any existing playback
    if (sourceRef.current) {
      try {
        sourceRef.current.disconnect();
      } catch (e) {}
    }

    // Create oscillator-based ambient music
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    // Set frequency based on genre
    const frequencies: Record<string, number> = {
      chill: 220,
      downtempo: 196,
      chillhop: 261.63,
      hiphop: 146.83,
      lofi: 174.61,
      lounge: 293.66,
      rnb: 329.63,
      minimal: 369.99,
    };
    
    oscillator.type = "sine";
    oscillator.frequency.value = frequencies[genre] || 220;
    
    gainNode.gain.value = volume / 100 * 0.3; // Keep it subtle
    gainNodeRef.current = gainNode;
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.start();
    setIsPlaying(true);
    
    // Store reference
    (window as any).__studioOscillator = oscillator;
  }, [volume]);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    
    // Stop oscillator if active
    if ((window as any).__studioOscillator) {
      try {
        (window as any).__studioOscillator.stop();
        (window as any).__studioOscillator = null;
      } catch (e) {}
    }
    
    setIsPlaying(false);
    setCurrentTrack(null);
  }, []);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if ((window as any).__studioOscillator) {
      try {
        (window as any).__studioOscillator.stop();
        (window as any).__studioOscillator = null;
      } catch (e) {}
    }
    setIsPlaying(false);
  }, []);

  // Get MediaStream for recording
  const getAudioStream = useCallback((): MediaStream | null => {
    if (!audioContextRef.current || !gainNodeRef.current) return null;
    
    const dest = audioContextRef.current.createMediaStreamDestination();
    gainNodeRef.current.connect(dest);
    return dest.stream;
  }, []);

  return {
    currentTrack,
    isPlaying,
    volume,
    setVolume,
    playTrack,
    stop,
    pause,
    getAudioStream,
  };
}
