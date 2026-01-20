import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Mic, Square, Play, Pause, AlertCircle, ShieldCheck } from "lucide-react";
import confetti from "canvas-confetti";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Progress } from "@/components/ui/progress";
import { refetchUserIdentity } from "@/lib/identity/refetchIdentity";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const VOICE_PROMPTS = [
  "Hi, my name is {name}. I'm recording this sample to verify my voice on Seeksy and protect my identity. This helps confirm it's really me when I'm using the platform, and ensures my voice cannot be used without my permission.",
  "This is {name} confirming that Seeksy can use this recording only to verify my voice and secure my account. I understand it won't be shared without my permission, and I agree to these terms for voice verification and authentication.",
  "I'm {name}, and I'm recording this voice sample so Seeksy can help keep my identity safe on the platform. This verification ensures no one else can impersonate me, and my voice remains under my full control at all times.",
  "My name is {name}, and I'm verifying my voice on Seeksy to protect my content and identity. I want to make sure only I have access to my authentic voice signature, and that it's used solely for security purposes.",
  "This is {name}. I authorize Seeksy to use this voice recording for identity verification purposes only. This recording helps secure my account and content against unauthorized use, and I confirm this is my real voice speaking right now."
];

type RecordingState = 'consent' | 'idle' | 'countdown' | 'recording' | 'review' | 'verifying' | 'already-verified';

type VerifyVoiceAndMintPayload = {
  audioData: string;
  recordingDuration: number;
  selectedPrompt: string;
};

type VerifyVoiceAndMintError = {
  ok: false;
  error: 'MISSING_FIELD' | 'INVALID_AUDIO' | 'BLOCKCHAIN_ERROR' | 'DATABASE_ERROR' | 'UNKNOWN_ERROR';
  message: string;
  field?: string;
};

type VerifyVoiceAndMintSuccess = {
  success: true;
  voiceProfileId: string;
  voiceHash: string;
  certificate: {
    token_id: string;
    tx_hash: string;
    explorer_url: string;
    contract_address: string;
  };
};

function mapVoiceError(e: VerifyVoiceAndMintError): string {
  switch (e.error) {
    case "MISSING_FIELD":
      return "Something went wrong with your recording. Please try again.";
    case "INVALID_AUDIO":
      return "We couldn't verify your voice from this recording. Try again from a quiet place and read the full sentence on screen.";
    case "BLOCKCHAIN_ERROR":
      return "Your voice was verified, but the blockchain network had an issue. Please try again in a moment.";
    case "DATABASE_ERROR":
      return "We hit a server issue saving your verification. Please try again, or contact support if this continues.";
    default:
      return "Verification failed. Please try again, or contact support if the issue continues.";
  }
}

const VoiceVerificationUnified = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // User & Script
  const [userName, setUserName] = useState<string>("there");
  const [userEmail, setUserEmail] = useState<string>("");
  const [consentName, setConsentName] = useState<string>("");
  const [consentConfirmed, setConsentConfirmed] = useState<boolean>(false);
  const [selectedPromptIndex, setSelectedPromptIndex] = useState<number>(0);
  const [prompts, setPrompts] = useState<string[]>([]);
  const [showResetModal, setShowResetModal] = useState(false);
  const [existingCertId, setExistingCertId] = useState<string | null>(null);
  const [mintProgress, setMintProgress] = useState(0);
  
  // State Machine
  const [state, setState] = useState<RecordingState>('consent');
  const [countdown, setCountdown] = useState(3);
  
  // Recording
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string>("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string>("");
  
  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const [waveformData, setWaveformData] = useState<number[]>(new Array(40).fill(0));
  const previousWaveformRef = useRef<number[]>(new Array(40).fill(0));

  useEffect(() => {
    checkExistingVerification();
    fetchUserAndPrompt();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      safeCloseAudioContext();
    };
  }, []);

  // Safe AudioContext lifecycle management
  const safeCloseAudioContext = () => {
    if (!audioContextRef.current) return;
    
    try {
      const state = audioContextRef.current.state;
      console.log('[VoiceVerification] AudioContext state before close:', state);
      
      if (state === 'closed') {
        console.log('[VoiceVerification] AudioContext already closed, skipping');
        return;
      }
      
      audioContextRef.current.close().catch((err) => {
        console.warn('[VoiceVerification] AudioContext close warning (safe to ignore):', err);
      });
    } catch (err) {
      console.warn('[VoiceVerification] AudioContext close error (non-critical):', err);
    }
  };

  const checkExistingVerification = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check for existing active verified certificate
      const { data: certData } = await (supabase as any)
        .from("voice_blockchain_certificates")
        .select("id, certification_status, is_active")
        .eq("creator_id", user.id)
        .eq("certification_status", "verified")
        .eq("is_active", true)
        .maybeSingle();

      if (certData) {
        setExistingCertId(certData.id);
        setState('already-verified');
      }
    } catch (error) {
      console.error("Error checking existing verification:", error);
    }
  };

  const fetchUserAndPrompt = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const name = user?.user_metadata?.full_name?.split(' ')[0] || "there";
    const email = user?.email || "";
    setUserName(name);
    setUserEmail(email);
    setConsentName(name); // Pre-fill with account name
    
    // Generate all prompts with user's name
    const personalizedPrompts = VOICE_PROMPTS.map(prompt => prompt.replace('{name}', name));
    setPrompts(personalizedPrompts);
  };

  const handleResetVerification = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !existingCertId) return;

      // Mark old certificate as revoked and inactive
      const { error: updateError } = await (supabase as any)
        .from("voice_blockchain_certificates")
        .update({ 
          certification_status: "revoked",
          is_active: false,
          revoked_at: new Date().toISOString()
        })
        .eq("id", existingCertId)
        .eq("creator_id", user.id);

      if (updateError) throw updateError;

      // Reset state to allow new verification
      setExistingCertId(null);
      setState('idle');
      setShowResetModal(false);
      
      toast.success("Reset complete", {
        description: "You can now verify your voice again."
      });

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['voice-identity-status'] });
      queryClient.invalidateQueries({ queryKey: ['identity-status'] });
      queryClient.invalidateQueries({ queryKey: ['creator_voice_profiles'] });
      queryClient.invalidateQueries({ queryKey: ['voice_blockchain_certificates'] });
    } catch (error) {
      console.error("Error resetting verification:", error);
      toast.error("Failed to reset verification");
    }
  };

  const handleConsentConfirm = async () => {
    if (!consentName.trim()) {
      toast.error("Please enter your name");
      return;
    }
    if (!consentConfirmed) {
      toast.error("Please confirm this is your voice");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Log consent to CRM (non-critical - don't block on failure)
      try {
        await supabase
          .from('contacts')
          .upsert({
            user_id: user.id,
            email: userEmail,
            name: consentName,
            notes: `Voice verification consent confirmed on ${new Date().toISOString()}`,
            lead_status: 'active',
            lead_source: 'Voice Verification'
          }, {
            onConflict: 'user_id,email'
          });
        console.log('[VoiceVerification] CRM consent logged successfully');
      } catch (crmError) {
        console.warn('[VoiceVerification] CRM logging failed (non-critical):', crmError);
        // Continue flow even if CRM fails
      }

      // Update userName with consent name and regenerate prompts
      setUserName(consentName);
      const personalizedPrompts = VOICE_PROMPTS.map(prompt => prompt.replace('{name}', consentName));
      setPrompts(personalizedPrompts);

      setState('idle');
      toast.success("Consent confirmed", {
        description: "You can now proceed with voice verification."
      });
    } catch (error) {
      console.error("[VoiceVerification] Critical error in consent flow:", error);
      toast.error("Failed to process consent");
    }
  };

  const handleBeginRecording = () => {
    setState('countdown');
    setCountdown(3);
    
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === 1) {
          clearInterval(countdownInterval);
          startRecording();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startRecording = async () => {
    try {
      setError("");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Set up audio context for waveform
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      
      // Start waveform animation
      animateWaveform();
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach(track => track.stop());
        
        // Safely close AudioContext
        safeCloseAudioContext();
        
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };

      mediaRecorder.start();
      setState('recording');
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1;
          if (newTime >= 30) {
            // Auto-stop at 30 seconds
            stopRecording();
          }
          return newTime;
        });
      }, 1000);

    } catch (err) {
      console.error('Microphone error:', err);
      setError("Microphone not available. Please enable access and retry.");
      setState('idle');
      toast.error("Microphone blocked", {
        description: "Please enable microphone access in your browser."
      });
    }
  };

  const animateWaveform = () => {
    if (!analyserRef.current) return;
    
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    
    const animate = () => {
      if (!analyserRef.current) return;
      
      analyserRef.current.getByteFrequencyData(dataArray);
      
      // Take 40 samples and normalize with enhanced amplitude
      const samples = [];
      const sampleSize = Math.floor(dataArray.length / 40);
      for (let i = 0; i < 40; i++) {
        const start = i * sampleSize;
        const slice = dataArray.slice(start, start + sampleSize);
        const average = slice.reduce((a, b) => a + b, 0) / slice.length;
        // Amplify the signal and clamp to 0-1 range
        const normalized = Math.min((average / 255) * 2.5, 1);
        samples.push(normalized);
      }
      
      // Apply smoothing with decay for natural movement
      const smoothed = samples.map((value, i) => {
        const previous = previousWaveformRef.current[i];
        // Ease towards new value with 70% current + 30% previous for smooth transitions
        return value * 0.7 + previous * 0.3;
      });
      
      previousWaveformRef.current = smoothed;
      setWaveformData(smoothed);
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animate();
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && state === 'recording') {
      mediaRecorderRef.current.stop();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      setTimeout(() => {
        if (recordingTime < 10) {
          setError("Recording too short\nWe couldn't hear enough speech to verify your voice. Try again with at least 10 seconds of audio.");
          setState('idle');
          chunksRef.current = [];
          setRecordingTime(0);
        } else {
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
          setAudioBlob(blob);
          const url = URL.createObjectURL(blob);
          setAudioUrl(url);
          setState('review');
        }
      }, 100);
    }
  };

  const togglePlayback = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleRerecord = () => {
    setAudioBlob(null);
    setAudioUrl("");
    setRecordingTime(0);
    setError("");
    setState('idle');
    chunksRef.current = [];
  };

  const handleContinue = async () => {
    if (!audioBlob) return;
    
    setError("");
    setState('verifying');
    setMintProgress(0);
    
    console.log('[VoiceVerification] Starting verification flow');
    
    // More realistic progress that aligns with actual minting time
    // Progress moves very slowly and stays below 95% during blockchain minting
    const progressInterval = setInterval(() => {
      setMintProgress(prev => {
        if (prev >= 90) {
          // Stay between 90-94% during actual blockchain minting (very slow)
          return Math.min(prev + 0.3, 94);
        }
        if (prev >= 70) {
          // Slow down significantly as we approach minting phase
          return prev + 1.5;
        }
        if (prev >= 40) {
          // Moderate speed in middle phase
          return prev + 3;
        }
        // Start fast then slow down
        return prev + 6;
      });
    }, 600); // Slower interval (600ms instead of 500ms)
    
    try {
      // Convert blob to base64
      const reader = new FileReader();
      
      reader.onloadend = async () => {
        try {
          const base64Audio = (reader.result as string).split(',')[1];
          console.log('[VoiceVerification] Audio converted to base64');
          
          // Prepare payload with selected prompt
          const payload: VerifyVoiceAndMintPayload = {
            audioData: base64Audio,
            recordingDuration: recordingTime,
            selectedPrompt: prompts[selectedPromptIndex]
          };

          console.log('[VoiceVerification] Invoking verify-voice-and-mint function...');
          
          // Call verify-voice-and-mint edge function
          const { data, error: invokeError } = await supabase.functions.invoke<VerifyVoiceAndMintSuccess | VerifyVoiceAndMintError>(
            'verify-voice-and-mint',
            { body: payload }
          );

          console.log('[VoiceVerification] Edge function response received');
          clearInterval(progressInterval);
          
          // Keep progress at current level - don't jump up yet
          // Let it naturally reach 94% while blockchain mints

          if (invokeError) {
            console.error('[VoiceVerification] Invoke error:', invokeError);
            throw new Error(invokeError.message || "Failed to verify voice");
          }

          // Check if response is an error
          if (data && 'ok' in data && data.ok === false) {
            const errorResponse = data as VerifyVoiceAndMintError;
            console.error('[VoiceVerification] Verification failed:', errorResponse.error);
            setError(mapVoiceError(errorResponse));
            setState('review');
            toast.error("Verification failed", {
              description: mapVoiceError(errorResponse)
            });
            return;
          }

          // Success - handle completion with retry logic
          if (data && 'success' in data && data.success) {
            const successResponse = data as VerifyVoiceAndMintSuccess;
            console.log('[VoiceVerification] ✓ Mint successful!', {
              voiceProfileId: successResponse.voiceProfileId,
              tokenId: successResponse.certificate.token_id,
              txHash: successResponse.certificate.tx_hash
            });
            
            // Animate to 100% now that minting is actually complete
            setMintProgress(95);
            setTimeout(() => setMintProgress(98), 200);
            setTimeout(() => setMintProgress(100), 500);
            
            // Show success toast immediately
            toast.success("Voice verified!", {
              description: "Your voice identity is now on-chain."
            });
            
            // Trigger confetti celebration immediately
            console.log('[VoiceVerification] 🎉 Triggering celebration confetti');
            const duration = 3000;
            const animationEnd = Date.now() + duration;
            const confettiInterval = setInterval(() => {
              const timeLeft = animationEnd - Date.now();
              if (timeLeft <= 0) {
                clearInterval(confettiInterval);
                return;
              }
              confetti({
                particleCount: 3,
                angle: 60 + Math.random() * 60,
                spread: 50 + Math.random() * 20,
                origin: { x: Math.random(), y: Math.random() - 0.2 },
                colors: ['#2C6BED', '#10B981', '#F59E0B', '#EC4899']
              });
            }, 100);
            
            // Invalidate queries with retry logic (non-blocking)
            console.log('[VoiceVerification] Invalidating queries...');
            const invalidateWithRetry = async (retries = 3) => {
              for (let i = 0; i < retries; i++) {
                try {
                  await Promise.all([
                    queryClient.invalidateQueries({ queryKey: ['creator_voice_profiles'] }),
                    queryClient.invalidateQueries({ queryKey: ['voice_blockchain_certificates'] }),
                    queryClient.invalidateQueries({ queryKey: ['voice-identity-status'] }),
                    queryClient.invalidateQueries({ queryKey: ['identity-status'] }),
                    queryClient.invalidateQueries({ queryKey: ['identity-status-widget'] }),
                    queryClient.invalidateQueries({ queryKey: ['identity-assets'] }),
                    queryClient.invalidateQueries({ queryKey: ['face-identity-status'] }),
                    queryClient.invalidateQueries({ queryKey: ['dashboard-widgets'] }),
                    queryClient.invalidateQueries({ queryKey: ['identity-activity-logs'] })
                  ]);
                  console.log('[VoiceVerification] Queries invalidated successfully');
                  break;
                } catch (queryError) {
                  console.warn(`[VoiceVerification] Query invalidation attempt ${i + 1} failed:`, queryError);
                  if (i === retries - 1) {
                    console.error('[VoiceVerification] All query invalidation attempts failed (non-critical)');
                  }
                }
              }
            };
            
            console.log('[VoiceVerification] Waiting 2 seconds for DB commit...');
            
            // Wait for DB to fully commit, then force refetch ALL identity-related queries
            setTimeout(async () => {
              try {
                console.log('[VoiceVerification] Force refetching identity queries...');
                await Promise.all([
                  queryClient.refetchQueries({ queryKey: ['identity-status'], type: 'all' }),
                  queryClient.refetchQueries({ queryKey: ['voice-identity-status'], type: 'all' }),
                  queryClient.refetchQueries({ queryKey: ['identity-assets'], type: 'all' }),
                  queryClient.refetchQueries({ queryKey: ['identity-verification-status'], type: 'all' }),
                  queryClient.invalidateQueries({ queryKey: ['identity-status'] }),
                  queryClient.invalidateQueries({ queryKey: ['voice-identity-status'] }),
                  queryClient.invalidateQueries({ queryKey: ['identity-assets'] }),
                  queryClient.invalidateQueries({ queryKey: ['identity-verification-status'] }),
                ]);
                console.log('[VoiceVerification] ✓ Identity queries refetched');
              } catch (refetchError) {
                console.warn('[VoiceVerification] Refetch error (non-critical):', refetchError);
              }
              
              // Run background invalidation for other queries
              invalidateWithRetry().catch(err => {
                console.warn('[VoiceVerification] Background query invalidation error (non-critical):', err);
              });

            console.log('[VoiceVerification] Navigating to success page...');
            
            // Navigate to success
              navigate("/identity/voice/success", {
                state: {
                  voiceProfileId: successResponse.voiceProfileId,
                  voiceHash: successResponse.voiceHash,
                  tokenId: successResponse.certificate.token_id,
                  explorerUrl: successResponse.certificate.explorer_url,
                  transactionHash: successResponse.certificate.tx_hash
                }
              });
            }, 2000);
          } else {
            // Unexpected response format
            console.error('[VoiceVerification] Unexpected response format:', data);
            throw new Error('Unexpected response from verification service');
          }
        } catch (innerError) {
          clearInterval(progressInterval);
          console.error('[VoiceVerification] Inner error during verification:', innerError);
          const errorMsg = innerError instanceof Error ? innerError.message : "Unknown error occurred";
          setError(errorMsg);
          setState('review');
          toast.error("Verification failed", {
            description: errorMsg
          });
        }
      };
      
      reader.onerror = () => {
        clearInterval(progressInterval);
        console.error('[VoiceVerification] FileReader error');
        setError("Failed to read audio file");
        setState('review');
        toast.error("Failed to read recording");
      };
      
      reader.readAsDataURL(audioBlob);
    } catch (err) {
      clearInterval(progressInterval);
      console.error('[VoiceVerification] Outer error:', err);
      const errorMsg = err instanceof Error ? err.message : "Unknown error occurred";
      setError(errorMsg);
      setState('review');
      toast.error("Verification failed", {
        description: errorMsg
      });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-background p-6 flex items-center justify-center">
      <div className="w-full max-w-2xl space-y-6">
        <Button variant="ghost" onClick={() => navigate("/identity")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Identity
        </Button>

        <Card className="p-12 transition-all duration-300">
          <div className="text-center space-y-6">
            {/* Consent State */}
            {state === 'consent' && (
              <div className="space-y-6">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-500/10">
                  <ShieldCheck className="h-12 w-12 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold mb-3">Voice Verification Consent</h1>
                  <p className="text-muted-foreground">
                    Before we begin, please confirm your identity and consent to voice verification.
                  </p>
                </div>
                
                <div className="space-y-4 max-w-md mx-auto text-left">
                  <div className="space-y-2">
                    <Label htmlFor="consent-name">
                      Your Full Name
                    </Label>
                    <Input
                      id="consent-name"
                      type="text"
                      value={consentName}
                      onChange={(e) => setConsentName(e.target.value)}
                      placeholder="Enter your name"
                    />
                    <p className="text-xs text-muted-foreground">
                      This will be used to personalize your verification script.
                    </p>
                  </div>

                  <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/30">
                    <Checkbox
                      id="consent-checkbox"
                      checked={consentConfirmed}
                      onCheckedChange={(checked) => setConsentConfirmed(checked === true)}
                    />
                    <Label htmlFor="consent-checkbox" className="text-sm font-normal cursor-pointer">
                      I confirm this is my real voice and I consent to Seeksy using this recording solely for identity verification and account security purposes.
                    </Label>
                  </div>
                </div>

                <Button 
                  onClick={handleConsentConfirm}
                  size="lg"
                  className="w-full max-w-md"
                >
                  Continue to Verification
                </Button>
              </div>
            )}

            {/* Already Verified State */}
            {state === 'already-verified' && (
              <div className="space-y-6">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/10">
                  <ShieldCheck className="h-12 w-12 text-green-600" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold mb-3">Voice Identity Verified</h1>
                  <p className="text-muted-foreground">
                    Your voice is already verified on-chain. To verify again, you must reset your current certificate.
                  </p>
                </div>
                <div className="space-y-3">
                  <Button 
                    onClick={() => navigate("/identity")}
                    className="w-full"
                  >
                    Return to Identity Hub
                  </Button>
                  <Button 
                    onClick={() => setShowResetModal(true)}
                    variant="outline"
                    className="w-full"
                  >
                    Reset Voice Identity
                  </Button>
                </div>
              </div>
            )}

            {/* Verification Flow States */}
            {state !== 'already-verified' && (
              <>
                {/* Header - Always visible */}
                <div>
                  <h1 className="text-3xl font-bold mb-3">Verify Your Voice Identity</h1>
                  <p className="text-muted-foreground">
                    {state === 'consent' && 'Before we begin, please confirm your identity.'}
                    {state === 'countdown' && `Recording starts in...`}
                    {state === 'recording' && 'Recording in progress'}
                    {(state === 'idle' || state === 'review') && 'Read the phrase below out loud.'}
                    {state === 'verifying' && 'Processing your voice sample...'}
                  </p>
                </div>

                {/* Script Selector - Show only in idle state */}
                {state === 'idle' && prompts.length > 0 && (
                  <div className="space-y-4">
                    <p className="text-sm font-medium text-muted-foreground">Choose a verification phrase:</p>
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                      {prompts.map((prompt, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedPromptIndex(index)}
                          className={`
                            flex-shrink-0 px-5 py-2.5 rounded-xl text-sm font-medium transition-all border
                            ${selectedPromptIndex === index
                              ? 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 shadow-sm'
                              : 'bg-background border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                            }
                          `}
                        >
                          Phrase {index + 1}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Script Block - Always visible except in review and verifying */}
                {state !== 'review' && state !== 'verifying' && prompts.length > 0 && (
                  <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 p-8 shadow-sm">
                    <p className="text-2xl leading-relaxed text-blue-900 dark:text-blue-100">
                      "{prompts[selectedPromptIndex]}"
                    </p>
                  </Card>
                )}

                {/* Countdown Display */}
                {state === 'countdown' && (
                  <div className="space-y-6" style={{ minHeight: '320px' }}>
                    <div className="text-8xl font-bold text-primary animate-pulse">
                      {countdown}
                    </div>
                    <Button 
                      size="lg" 
                      disabled
                      className="w-full opacity-50"
                    >
                      <Mic className="h-5 w-5 mr-2" />
                      Starting...
                    </Button>
                  </div>
                )}

                {/* State: Idle */}
                {state === 'idle' && prompts.length > 0 && (
                  <div style={{ minHeight: '80px' }}>
                    <Button 
                      size="lg" 
                      onClick={handleBeginRecording}
                      className="w-full"
                    >
                      <Mic className="h-5 w-5 mr-2" />
                      Begin Recording
                    </Button>
                  </div>
                )}

                {/* State: Recording */}
                {state === 'recording' && (
                  <div className="space-y-6" style={{ minHeight: '320px' }}>
                    {/* Live Waveform */}
                    <div className="h-32 flex items-center justify-center gap-1">
                      {waveformData.map((value, i) => (
                        <div
                          key={i}
                          className="w-1 bg-primary rounded-full transition-all duration-100"
                          style={{
                            height: `${Math.max(20, value * 100)}%`,
                          }}
                        />
                      ))}
                    </div>

                    {/* Timer - Large Apple-style */}
                    <div className="text-7xl font-bold tracking-tight">{formatTime(recordingTime)}</div>
                    
                    {/* Fixed height container for button and label */}
                    <div className="space-y-2" style={{ minHeight: '80px' }}>
                      <Button 
                        size="lg" 
                        variant="destructive" 
                        onClick={stopRecording}
                        className={`w-full transition-opacity duration-300 ${recordingTime < 10 ? 'opacity-50' : 'opacity-100'}`}
                        disabled={recordingTime < 10}
                      >
                        <Square className="h-5 w-5 mr-2" />
                        Stop Recording
                      </Button>

                      <p className="text-xs text-muted-foreground transition-opacity duration-300" style={{ minHeight: '20px' }}>
                        {recordingTime < 10 ? 'Minimum 10 seconds required' : 'Ready to stop'}
                      </p>
                    </div>
                  </div>
                )}

                {/* State: Verifying */}
                {state === 'verifying' && (
                  <div className="space-y-6 animate-in fade-in duration-500">
                    <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 p-8 shadow-sm">
                      <p className="text-xl leading-relaxed text-blue-900 dark:text-blue-100">
                        "{prompts[selectedPromptIndex]}"
                      </p>
                    </Card>
                    
                    <div className="animate-pulse">
                      <div className="h-24 flex items-center justify-center gap-1">
                        {new Array(40).fill(0).map((_, i) => (
                          <div
                            key={i}
                            className="w-1 bg-primary/30 rounded-full animate-pulse"
                            style={{
                              height: `${Math.random() * 60 + 20}%`,
                              animationDelay: `${i * 20}ms`
                            }}
                          />
                        ))}
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-muted-foreground">
                        Verifying your voice and minting your certificate…
                      </p>
                      <Progress value={mintProgress} className="w-full" />
                    </div>
                  </div>
                )}

                {/* State: Review */}
                {state === 'review' && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div>
                      <h2 className="text-xl font-semibold mb-2">Here's your recording:</h2>
                      <p className="text-muted-foreground">
                        Duration: {formatTime(recordingTime)}
                      </p>
                    </div>

                    {/* Static Waveform Preview */}
                    <div className="h-24 flex items-center justify-center gap-1">
                      {new Array(40).fill(0).map((_, i) => (
                        <div
                          key={i}
                          className="w-1 bg-primary/50 rounded-full"
                          style={{
                            height: `${Math.random() * 60 + 20}%`,
                          }}
                        />
                      ))}
                    </div>

                    {/* Audio Playback */}
                    <audio 
                      ref={audioRef} 
                      src={audioUrl} 
                      onEnded={() => setIsPlaying(false)}
                      className="hidden"
                    />
                    
                    <Button 
                      size="lg" 
                      variant="outline"
                      onClick={togglePlayback}
                      className="w-full"
                    >
                      {isPlaying ? (
                        <>
                          <Pause className="h-5 w-5 mr-2" />
                          Pause Preview
                        </>
                      ) : (
                        <>
                          <Play className="h-5 w-5 mr-2" />
                          Play Preview
                        </>
                      )}
                    </Button>

                    {/* Actions */}
                    <div className="flex gap-3">
                      <Button 
                        variant="outline" 
                        onClick={handleRerecord}
                        className="flex-1"
                      >
                        Re-record
                      </Button>
                      <Button 
                        onClick={handleContinue}
                        className="flex-1"
                      >
                        Continue
                      </Button>
                    </div>
                  </div>
                )}

                {/* Error Display */}
                {error && (
                  <Card className="border-destructive bg-destructive/5 p-4">
                    <div className="flex items-start gap-3 text-destructive">
                      <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-left whitespace-pre-line">{error}</p>
                    </div>
                  </Card>
                )}
              </>
            )}
          </div>
        </Card>
      </div>

      {/* Reset Confirmation Modal */}
      <AlertDialog open={showResetModal} onOpenChange={setShowResetModal}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Reset your voice identity?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-4 text-left">
              <p>
                This will revoke your current verified voice certificate and require a new recording.
              </p>
              
              <div className="space-y-2">
                <p className="font-medium text-foreground">What will happen:</p>
                <ul className="space-y-1 text-sm">
                  <li className="flex gap-2">
                    <span>•</span>
                    <span>Your existing certificate on Polygon will be marked as revoked, not deleted.</span>
                  </li>
                  <li className="flex gap-2">
                    <span>•</span>
                    <span>Seeksy will stop treating your old certificate as active.</span>
                  </li>
                  <li className="flex gap-2">
                    <span>•</span>
                    <span>You'll need to verify again with a new sample.</span>
                  </li>
                </ul>
              </div>

              <p className="text-sm font-medium text-destructive">
                This action can't be undone.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleResetVerification}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Reset & Re-record
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default VoiceVerificationUnified;
