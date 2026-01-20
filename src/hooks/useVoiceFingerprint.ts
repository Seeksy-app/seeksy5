import { useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AudioSignature {
  duration: number;
  frequencyData: number[];
  spectralCentroid: number;
  zeroCrossingRate: number;
  mfcc: number[];
  snr: number;
  timestamp: string;
}

export const useVoiceFingerprint = () => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [fingerprint, setFingerprint] = useState<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  const captureVoiceFingerprint = useCallback(async (
    stream: MediaStream,
    sourceType: 'studio_recording' | 'livestream' | 'upload',
    sourceId?: string,
    duration: number = 30
  ) => {
    setIsCapturing(true);
    
    try {
      // Create audio context and analyser
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      // Collect audio data for specified duration
      const startTime = Date.now();
      const audioSignature = await collectAudioSignature(
        analyser,
        audioContext,
        duration
      );

      const actualDuration = (Date.now() - startTime) / 1000;

      // Send to edge function to generate fingerprint
      const { data, error } = await supabase.functions.invoke('generate-voice-fingerprint', {
        body: {
          audioSignature,
          sourceType,
          sourceId,
          sampleDuration: Math.floor(actualDuration),
        },
      });

      if (error) throw error;

      setFingerprint(data.fingerprint);
      
      toast.success("Voice fingerprint captured", {
        description: `Confidence: ${(data.fingerprint.confidenceScore * 100).toFixed(0)}%`,
      });

      return data.fingerprint;
      
    } catch (error) {
      console.error("Voice fingerprint capture error:", error);
      toast.error("Failed to capture voice fingerprint", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    } finally {
      setIsCapturing(false);
      cleanup();
    }
  }, []);

  const collectAudioSignature = async (
    analyser: AnalyserNode,
    audioContext: AudioContext,
    duration: number
  ): Promise<AudioSignature> => {
    const bufferLength = analyser.frequencyBinCount;
    const frequencyArray = new Uint8Array(bufferLength);
    const timeArray = new Uint8Array(bufferLength);
    
    const samples: number[][] = [];
    const timeSamples: number[][] = [];
    const sampleRate = audioContext.sampleRate;
    const samplesNeeded = Math.floor((duration * 1000) / 100); // Sample every 100ms
    
    // Collect samples
    for (let i = 0; i < samplesNeeded; i++) {
      await new Promise(resolve => setTimeout(resolve, 100));
      
      analyser.getByteFrequencyData(frequencyArray);
      analyser.getByteTimeDomainData(timeArray);
      
      samples.push(Array.from(frequencyArray));
      timeSamples.push(Array.from(timeArray));
    }

    // Calculate audio features
    const avgFrequencyData = calculateAverage(samples);
    const spectralCentroid = calculateSpectralCentroid(avgFrequencyData, sampleRate);
    const zeroCrossingRate = calculateZeroCrossingRate(timeSamples);
    const mfcc = calculateMFCC(samples);
    const snr = calculateSNR(timeSamples);

    return {
      duration,
      frequencyData: avgFrequencyData,
      spectralCentroid,
      zeroCrossingRate,
      mfcc,
      snr,
      timestamp: new Date().toISOString(),
    };
  };

  const calculateAverage = (samples: number[][]): number[] => {
    const length = samples[0].length;
    const avg = new Array(length).fill(0);
    
    samples.forEach(sample => {
      sample.forEach((value, index) => {
        avg[index] += value;
      });
    });
    
    return avg.map(sum => sum / samples.length);
  };

  const calculateSpectralCentroid = (frequencyData: number[], sampleRate: number): number => {
    let numerator = 0;
    let denominator = 0;
    
    frequencyData.forEach((magnitude, index) => {
      const frequency = (index * sampleRate) / (2 * frequencyData.length);
      numerator += frequency * magnitude;
      denominator += magnitude;
    });
    
    return denominator > 0 ? numerator / denominator : 0;
  };

  const calculateZeroCrossingRate = (timeSamples: number[][]): number => {
    let crossings = 0;
    let total = 0;
    
    timeSamples.forEach(sample => {
      for (let i = 1; i < sample.length; i++) {
        if ((sample[i] - 128) * (sample[i - 1] - 128) < 0) {
          crossings++;
        }
        total++;
      }
    });
    
    return crossings / total;
  };

  const calculateMFCC = (samples: number[][]): number[] => {
    // Simplified MFCC calculation (first 13 coefficients)
    // In production, use a proper DSP library
    const avgSample = calculateAverage(samples);
    return avgSample.slice(0, 13);
  };

  const calculateSNR = (timeSamples: number[][]): number => {
    const flatSamples = timeSamples.flat();
    const mean = flatSamples.reduce((sum, val) => sum + val, 0) / flatSamples.length;
    
    const signal = flatSamples.reduce((sum, val) => {
      const centered = val - 128;
      return sum + centered * centered;
    }, 0) / flatSamples.length;
    
    const noise = flatSamples.reduce((sum, val) => {
      return sum + Math.abs(val - mean);
    }, 0) / flatSamples.length;
    
    return noise > 0 ? 10 * Math.log10(signal / (noise * noise)) : 0;
  };

  const cleanup = () => {
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    analyserRef.current = null;
  };

  const verifyVoiceMatch = async (
    stream: MediaStream,
    expectedFingerprintId: string
  ): Promise<boolean> => {
    try {
      // Capture new signature
      const tempSignature = await collectAudioSignature(
        analyserRef.current!,
        audioContextRef.current!,
        5 // Quick 5-second verification
      );

      // Compare with stored fingerprint
      const { data: storedFingerprint } = await supabase
        .from('creator_voice_fingerprints')
        .select('audio_signature')
        .eq('id', expectedFingerprintId)
        .single();

      if (!storedFingerprint) return false;

      // Calculate similarity score
      const similarity = calculateSimilarity(
        tempSignature,
        storedFingerprint.audio_signature as unknown as AudioSignature
      );

      return similarity > 0.85; // 85% match threshold
      
    } catch (error) {
      console.error("Voice verification error:", error);
      return false;
    }
  };

  const calculateSimilarity = (sig1: AudioSignature, sig2: AudioSignature): number => {
    // Compare key features
    const spectralSim = 1 - Math.abs(sig1.spectralCentroid - sig2.spectralCentroid) / 
      Math.max(sig1.spectralCentroid, sig2.spectralCentroid);
    
    const zcrSim = 1 - Math.abs(sig1.zeroCrossingRate - sig2.zeroCrossingRate);
    
    // Weighted average
    return (spectralSim * 0.6) + (zcrSim * 0.4);
  };

  return {
    captureVoiceFingerprint,
    verifyVoiceMatch,
    isCapturing,
    fingerprint,
  };
};
