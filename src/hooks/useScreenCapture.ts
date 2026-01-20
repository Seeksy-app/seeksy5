import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type CaptureStatus = 'idle' | 'recording' | 'encoding' | 'uploading' | 'saved' | 'failed';

export interface ScreenCapturePreset {
  id: string;
  name: string;
  shortName: string;
  sceneNumber: number;
  targetUrl: string;
  recommendedDuration: number;
  description: string;
}

export interface CapturedRecording {
  id: string;
  presetId: string;
  fileName: string;
  publicUrl: string;
  storagePath: string;
  duration: number;
  createdAt: Date;
}

// Diagnostic timing interface
interface CaptureDiagnostics {
  startCaptureTime: number;
  stopCaptureTime: number;
  encodingDuration: number;
  uploadDuration: number;
  totalDuration: number;
  status: 'success' | 'error';
  errorMessage?: string;
}

const PROCESSING_TIMEOUT_MS = 60000; // 60 seconds timeout (max allowed)

export function useScreenCapture() {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [captureStatus, setCaptureStatus] = useState<CaptureStatus>('idle');
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [currentPresetId, setCurrentPresetId] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const processingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isStoppingRef = useRef(false); // Prevent double-stop

  const generateFileName = (preset: ScreenCapturePreset): string => {
    const now = new Date();
    const timestamp = now.toISOString()
      .replace(/[:.]/g, '-')
      .replace('T', '_')
      .slice(0, 19);
    const sceneNum = String(preset.sceneNumber).padStart(2, '0');
    return `seeksy-demo_${sceneNum}_${preset.shortName}_${timestamp}.webm`;
  };

  const logDiagnostics = (diagnostics: CaptureDiagnostics) => {
    console.log('=== Screen Capture Diagnostics ===');
    console.log('Start capture time:', new Date(diagnostics.startCaptureTime).toISOString());
    console.log('Stop capture time:', new Date(diagnostics.stopCaptureTime).toISOString());
    console.log('Encoding duration:', diagnostics.encodingDuration, 'ms');
    console.log('Upload duration:', diagnostics.uploadDuration, 'ms');
    console.log('Total duration:', diagnostics.totalDuration, 'ms');
    console.log('Status:', diagnostics.status);
    if (diagnostics.errorMessage) {
      console.log('Error:', diagnostics.errorMessage);
    }
    console.log('=================================');
  };

  const cleanup = useCallback(() => {
    console.log('[ScreenCapture] Running cleanup');
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    if (processingTimeoutRef.current) {
      clearTimeout(processingTimeoutRef.current);
      processingTimeoutRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    mediaRecorderRef.current = null;
    chunksRef.current = [];
    isStoppingRef.current = false;
    setIsRecording(false);
    setIsProcessing(false);
    setCurrentPresetId(null);
    setRecordingDuration(0);
  }, []);

  const resetStatus = useCallback(() => {
    setCaptureStatus('idle');
    setLastError(null);
  }, []);

  const startCapture = useCallback(async (preset: ScreenCapturePreset): Promise<void> => {
    console.log('[ScreenCapture] Starting capture for preset:', preset.name);
    const captureStartTime = Date.now();
    setCaptureStatus('idle');
    setLastError(null);
    
    try {
      // Request screen capture - user will pick which tab/window
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 },
        },
        audio: false, // No audio for demo clips
      });

      console.log('[ScreenCapture] Got display media stream');
      
      streamRef.current = stream;
      chunksRef.current = [];
      isStoppingRef.current = false;
      setCurrentPresetId(preset.id);

      // Determine best supported format
      let mimeType = 'video/webm;codecs=vp9';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm;codecs=vp8';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'video/webm';
        }
      }
      console.log('[ScreenCapture] Using MIME type:', mimeType);

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 5000000, // 5 Mbps for good quality
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
          console.log('[ScreenCapture] Chunk received, size:', event.data.size, 'total chunks:', chunksRef.current.length);
        }
      };

      mediaRecorder.onerror = (event) => {
        console.error('[ScreenCapture] MediaRecorder error:', event);
        toast({
          variant: "destructive",
          title: "Recording Error",
          description: "An error occurred during recording.",
        });
        cleanup();
      };

      // Handle stream ending (user clicks "Stop sharing")
      stream.getVideoTracks()[0].onended = () => {
        console.log('[ScreenCapture] Stream ended by user (Stop sharing clicked)');
        // Use a timeout to allow any pending data to be collected
        setTimeout(() => {
          if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive' && !isStoppingRef.current) {
            console.log('[ScreenCapture] Auto-stopping due to stream end');
            // The stop will be handled by the page component
          }
        }, 100);
      };

      mediaRecorderRef.current = mediaRecorder;
      startTimeRef.current = captureStartTime;
      mediaRecorder.start(1000); // Capture every 1 second
      setIsRecording(true);
      setCaptureStatus('recording');
      setRecordingDuration(0);

      // Update duration every second
      timerRef.current = setInterval(() => {
        setRecordingDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);

      console.log('[ScreenCapture] Recording started successfully');
      
      toast({
        title: "Recording Started",
        description: `Recording "${preset.name}". Perform your demo actions, then click Stop.`,
      });
    } catch (error) {
      console.error('[ScreenCapture] Start capture error:', error);
      cleanup();
      toast({
        variant: "destructive",
        title: "Capture Failed",
        description: error instanceof Error ? error.message : "Failed to start screen capture",
      });
    }
  }, [toast, cleanup]);

  const stopCapture = useCallback(async (preset: ScreenCapturePreset): Promise<CapturedRecording | null> => {
    console.log('[ScreenCapture] stopCapture called for preset:', preset.name);
    
    // Prevent double-stop
    if (isStoppingRef.current) {
      console.log('[ScreenCapture] Already stopping, ignoring duplicate call');
      return null;
    }
    isStoppingRef.current = true;
    
    const stopTime = Date.now();
    const diagnostics: CaptureDiagnostics = {
      startCaptureTime: startTimeRef.current,
      stopCaptureTime: stopTime,
      encodingDuration: 0,
      uploadDuration: 0,
      totalDuration: 0,
      status: 'error',
    };

    return new Promise((resolve) => {
      if (!mediaRecorderRef.current || !streamRef.current) {
        console.warn('[ScreenCapture] No active recorder or stream');
        diagnostics.errorMessage = 'No active recorder or stream';
        logDiagnostics(diagnostics);
        cleanup();
        resolve(null);
        return;
      }

      // Clear recording timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      setIsProcessing(true);
      const finalDuration = Math.floor((stopTime - startTimeRef.current) / 1000);
      console.log('[ScreenCapture] Final duration:', finalDuration, 'seconds');

      // Set timeout for processing
      processingTimeoutRef.current = setTimeout(() => {
        console.error('[ScreenCapture] Processing timeout exceeded');
        diagnostics.errorMessage = 'Processing timeout exceeded (30s)';
        diagnostics.totalDuration = Date.now() - stopTime;
        logDiagnostics(diagnostics);
        
        toast({
          variant: "destructive",
          title: "Saving Failed",
          description: "Processing took too long. Please try again with a shorter recording.",
        });
        
        cleanup();
        resolve(null);
      }, PROCESSING_TIMEOUT_MS);

      // Store mimeType before stop clears the ref
      const mimeType = mediaRecorderRef.current.mimeType || 'video/webm';
      
      mediaRecorderRef.current.onstop = async () => {
        console.log('[ScreenCapture] MediaRecorder stopped, processing chunks');
        const encodingStart = Date.now();
        setCaptureStatus('encoding');
        
        try {
          // Stop all tracks
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
          }

          // Check if we have chunks
          if (chunksRef.current.length === 0) {
            throw new Error('No recording data captured. Try recording for a longer duration.');
          }

          // Create blob from chunks
          console.log('[ScreenCapture] Creating blob from', chunksRef.current.length, 'chunks');
          const blob = new Blob(chunksRef.current, { type: mimeType });
          console.log('[ScreenCapture] Blob created, size:', blob.size, 'bytes');
          
          if (blob.size === 0) {
            throw new Error('Recording is empty. Please try again.');
          }

          diagnostics.encodingDuration = Date.now() - encodingStart;
          console.log('[ScreenCapture] Encoding duration:', diagnostics.encodingDuration, 'ms');

          // Generate filename
          const fileName = generateFileName(preset);
          const storagePath = `demo-videos/${fileName}`;
          console.log('[ScreenCapture] Uploading to:', storagePath);

          const uploadStart = Date.now();
          setCaptureStatus('uploading');

          // Get current user
          const { data: { user }, error: userError } = await supabase.auth.getUser();
          if (userError || !user) {
            throw new Error('Not authenticated. Please log in and try again.');
          }
          console.log('[ScreenCapture] User authenticated:', user.id);

          // Upload to Supabase storage
          const { error: uploadError } = await supabase.storage
            .from('media-vault')
            .upload(storagePath, blob, {
              contentType: 'video/webm',
              upsert: false,
            });

          if (uploadError) {
            console.error('[ScreenCapture] Storage upload error:', uploadError);
            throw new Error(`Upload failed: ${uploadError.message}`);
          }
          console.log('[ScreenCapture] Storage upload successful');

          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('media-vault')
            .getPublicUrl(storagePath);
          console.log('[ScreenCapture] Public URL:', publicUrl);

          // Save to media_files table
          const { data: mediaFile, error: dbError } = await supabase
            .from('media_files')
            .insert({
              user_id: user.id,
              file_name: fileName,
              file_type: 'video/webm',
              file_url: publicUrl,
              file_size_bytes: blob.size,
              source: 'screen-capture',
              clip_metadata: {
                tag: 'demo-video',
                preset_id: preset.id,
                preset_name: preset.name,
                scene_number: preset.sceneNumber,
                duration_seconds: finalDuration,
                source: 'screen-capture',
              },
            })
            .select()
            .single();

          if (dbError) {
            console.error('[ScreenCapture] Database insert error:', dbError);
            throw new Error(`Database save failed: ${dbError.message}`);
          }
          console.log('[ScreenCapture] Database record created:', mediaFile.id);

          diagnostics.uploadDuration = Date.now() - uploadStart;
          diagnostics.totalDuration = Date.now() - stopTime;
          diagnostics.status = 'success';
          logDiagnostics(diagnostics);

          const recording: CapturedRecording = {
            id: mediaFile.id,
            presetId: preset.id,
            fileName,
            publicUrl,
            storagePath,
            duration: finalDuration,
            createdAt: new Date(),
          };

          toast({
            title: "Recording Saved",
            description: `"${preset.name}" (${finalDuration}s) saved to Media Library.`,
          });

          // Clear timeout since we succeeded
          if (processingTimeoutRef.current) {
            clearTimeout(processingTimeoutRef.current);
            processingTimeoutRef.current = null;
          }

          setCaptureStatus('saved');
          cleanup();
          resolve(recording);
        } catch (error) {
          console.error('[ScreenCapture] Save recording error:', error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          
          diagnostics.errorMessage = errorMessage;
          diagnostics.totalDuration = Date.now() - stopTime;
          logDiagnostics(diagnostics);
          
          toast({
            variant: "destructive",
            title: "Save Failed",
            description: errorMessage,
          });
          
          // Clear timeout
          if (processingTimeoutRef.current) {
            clearTimeout(processingTimeoutRef.current);
            processingTimeoutRef.current = null;
          }
          
          setCaptureStatus('failed');
          setLastError(errorMessage);
          cleanup();
          resolve(null);
        }
      };

      // Trigger stop
      try {
        console.log('[ScreenCapture] Calling mediaRecorder.stop()');
        mediaRecorderRef.current.stop();
      } catch (stopError) {
        console.error('[ScreenCapture] Error calling stop:', stopError);
        diagnostics.errorMessage = 'Failed to stop recorder';
        logDiagnostics(diagnostics);
        cleanup();
        resolve(null);
      }
    });
  }, [toast, cleanup]);

  const cancelCapture = useCallback(() => {
    console.log('[ScreenCapture] Cancelling capture');
    setCaptureStatus('idle');
    cleanup();
    toast({
      title: "Recording Cancelled",
      description: "The recording was cancelled.",
    });
  }, [cleanup, toast]);

  return {
    isRecording,
    isProcessing,
    captureStatus,
    recordingDuration,
    currentPresetId,
    lastError,
    startCapture,
    stopCapture,
    cancelCapture,
    resetStatus,
  };
}
