import { useState, useRef, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export type RecordingState = "idle" | "device-check" | "recording" | "paused" | "saving" | "complete";

interface RecorderOptions {
  onStateChange?: (state: RecordingState) => void;
  onError?: (error: Error) => void;
  onMarkerAdded?: (type: "clip" | "ad", timestamp: number) => void;
}

export function useStudioRecorder(options?: RecorderOptions) {
  const [state, setState] = useState<RecordingState>("idle");
  const [duration, setDuration] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Refs for media handling
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  // Get user ID on mount
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };
    getUser();
  }, []);

  // Update state with callback
  const updateState = useCallback((newState: RecordingState) => {
    setState(newState);
    options?.onStateChange?.(newState);
  }, [options]);

  // Handle errors gracefully
  const handleError = useCallback((err: Error, context: string) => {
    console.error(`[StudioRecorder] Error in ${context}:`, err);
    setError(err.message);
    options?.onError?.(err);
  }, [options]);

  // Initialize audio devices and get stream
  const initializeDevices = useCallback(async () => {
    try {
      setError(null);
      
      // Request microphone permission with high-quality settings
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
        } 
      });
      
      mediaStreamRef.current = stream;

      // Set up audio analysis for level meter
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      // Start level monitoring with smooth animation
      const monitorLevel = () => {
        if (!analyserRef.current) return;
        
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        
        const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        setAudioLevel(Math.min(average / 255, 1));
        
        animationFrameRef.current = requestAnimationFrame(monitorLevel);
      };
      
      monitorLevel();
      updateState("device-check");
      return stream;
    } catch (err) {
      handleError(err as Error, "initializeDevices");
      throw err;
    }
  }, [updateState, handleError]);

  // Create session in database with proper defaults
  const createSession = useCallback(async () => {
    try {
      if (!userId) {
        throw new Error("User not authenticated");
      }

      const roomName = `recording-${Date.now()}`;
      const dailyRoomUrl = `https://seeksy.daily.co/${roomName}`;

      const result = await (supabase as any)
        .from("studio_sessions")
        .insert([{
          user_id: userId,
          room_name: roomName,
          daily_room_url: dailyRoomUrl,
          status: 'active',
          session_type: 'recording',
          participants_count: 1,
        }])
        .select()
        .single();

      if (result.error) throw result.error;
      
      setSessionId(result.data.id);
      return result.data.id;
    } catch (err) {
      handleError(err as Error, "createSession");
      throw err;
    }
  }, [userId, handleError]);

  // Start recording with validation
  const startRecording = useCallback(async () => {
    try {
      if (!mediaStreamRef.current) {
        await initializeDevices();
      }

      const stream = mediaStreamRef.current;
      if (!stream) throw new Error("No media stream available");

      // Create session
      const newSessionId = await createSession();

      // Determine best audio format
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'audio/mp4';
        }
      }

      // Initialize MediaRecorder with quality settings
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 128000,
      });

      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onerror = (event) => {
        handleError(new Error('MediaRecorder error'), 'mediaRecorder');
      };

      // Collect data every second for reliability
      mediaRecorder.start(1000);
      mediaRecorderRef.current = mediaRecorder;

      // Start precise timer
      startTimeRef.current = Date.now();
      setDuration(0);
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setDuration(elapsed);
      }, 100); // Update frequently for smooth display

      updateState("recording");
    } catch (err) {
      handleError(err as Error, "startRecording");
    }
  }, [initializeDevices, createSession, updateState, handleError]);

  // Pause recording
  const pauseRecording = useCallback(() => {
    try {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.pause();
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        updateState("paused");
      }
    } catch (err) {
      handleError(err as Error, "pauseRecording");
    }
  }, [updateState, handleError]);

  // Resume recording
  const resumeRecording = useCallback(() => {
    try {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "paused") {
        mediaRecorderRef.current.resume();
        
        // Restart timer from current duration
        const pausedDuration = duration;
        startTimeRef.current = Date.now() - (pausedDuration * 1000);
        timerRef.current = setInterval(() => {
          const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
          setDuration(elapsed);
        }, 100);
        
        updateState("recording");
      }
    } catch (err) {
      handleError(err as Error, "resumeRecording");
    }
  }, [duration, updateState, handleError]);

  // Stop recording and upload with retry logic
  const stopRecording = useCallback(async () => {
    return new Promise<string | null>(async (resolve) => {
      try {
        updateState("saving");

        if (!mediaRecorderRef.current || !sessionId) {
          resolve(null);
          return;
        }

        const finalDuration = duration;

        mediaRecorderRef.current.onstop = async () => {
          try {
            // Create blob from chunks
            const audioBlob = new Blob(audioChunksRef.current, { 
              type: mediaRecorderRef.current?.mimeType || 'audio/webm' 
            });

            if (audioBlob.size === 0) {
              throw new Error("Recording is empty");
            }

            // Generate unique filename
            const timestamp = Date.now();
            const extension = mediaRecorderRef.current?.mimeType?.includes('mp4') ? 'mp4' : 'webm';
            const fileName = `${sessionId}/${timestamp}.${extension}`;

            // Upload to Supabase Storage with retry
            let uploadError: any = null;
            for (let attempt = 0; attempt < 3; attempt++) {
              const { error } = await supabase.storage
                .from('studio-recordings')
                .upload(fileName, audioBlob, {
                  contentType: mediaRecorderRef.current?.mimeType || 'audio/webm',
                  upsert: false,
                });

              if (!error) {
                uploadError = null;
                break;
              }
              uploadError = error;
              
              if (attempt < 2) {
                await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
              }
            }

            if (uploadError) {
              console.error("Upload failed after retries:", uploadError);
            }

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
              .from('studio-recordings')
              .getPublicUrl(fileName);

            // Fetch identity status for session record
            const { data: { user } } = await supabase.auth.getUser();
            let identityVerified = false;
            
            if (user) {
              // @ts-ignore - Bypass deep Supabase type inference
              const faceResult = await supabase.from("identity_assets")
                .select("id")
                .eq("user_id", user.id)
                .eq("asset_type", "FACE_IDENTITY")
                .eq("cert_status", "minted")
                .limit(1);
              
              // @ts-ignore - Bypass deep Supabase type inference  
              const voiceResult = await supabase.from("creator_voice_profiles")
                .select("id")
                .eq("user_id", user.id)
                .eq("is_verified", true)
                .limit(1);
              
              identityVerified = !!(faceResult.data?.length && voiceResult.data?.length);
            }

            // Update session with final data
            const { error: updateError } = await (supabase as any)
              .from("studio_sessions")
              .update({
                duration_seconds: finalDuration,
                recording_status: 'completed',
                status: 'ended',
                ended_at: new Date().toISOString(),
                identity_verified: identityVerified,
              })
              .eq("id", sessionId);

            if (updateError) {
              console.error("Failed to update session:", updateError);
            }

            updateState("complete");
            resolve(sessionId);
          } catch (err) {
            handleError(err as Error, "stopRecording.onstop");
            resolve(null);
          }
        };

        mediaRecorderRef.current.stop();

        // Stop timer
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }

        // Stop all media tracks
        mediaStreamRef.current?.getTracks().forEach(track => {
          track.stop();
        });

        // Stop level monitoring
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }

      } catch (err) {
        handleError(err as Error, "stopRecording");
        resolve(null);
      }
    });
  }, [sessionId, duration, updateState, handleError]);

  // Add clip marker with optimistic UI
  const addClipMarker = useCallback(async (description?: string) => {
    if (!sessionId) return;

    try {
      const { error } = await (supabase as any).from("clip_markers").insert([{
        session_id: sessionId,
        timestamp_seconds: duration,
        description: description || null,
        created_by: userId,
      }]);

      if (error) throw error;
      options?.onMarkerAdded?.("clip", duration);
    } catch (err) {
      handleError(err as Error, "addClipMarker");
    }
  }, [sessionId, duration, userId, options, handleError]);

  // Add ad marker with type validation
  const addAdMarker = useCallback(async (slotType: "pre_roll" | "mid_roll" | "post_roll", notes?: string) => {
    if (!sessionId) return;

    try {
      const { error } = await (supabase as any).from("ad_markers").insert([{
        session_id: sessionId,
        timestamp_seconds: duration,
        slot_type: slotType,
        notes: notes || null,
        created_by: userId,
      }]);

      if (error) throw error;
      options?.onMarkerAdded?.("ad", duration);
    } catch (err) {
      handleError(err as Error, "addAdMarker");
    }
  }, [sessionId, duration, userId, options, handleError]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      mediaStreamRef.current?.getTracks().forEach(track => track.stop());
      audioContextRef.current?.close();
    };
  }, []);

  return {
    state,
    duration,
    sessionId,
    audioLevel,
    error,
    initializeDevices,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    addClipMarker,
    addAdMarker,
  };
}
