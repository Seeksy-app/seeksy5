import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Mic, Square, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { CertificationStepper } from "@/components/voice-certification/CertificationStepper";
import { supabase } from "@/integrations/supabase/client";

const VOICE_PROMPTS = [
  "Hi, my name is {name}. I'm recording this sample to verify my voice on Seeksy and protect my identity.",
  "This is {name} confirming that Seeksy can use this recording only to verify my voice and secure my account.",
  "I'm {name}, and I'm recording this voice sample so Seeksy can help keep my identity safe on the platform."
];

interface RecordingError {
  code: 'TOO_SHORT' | 'TOO_QUIET' | 'NO_SPEECH' | 'ATTEMPTS_LIMIT' | null;
  message: string;
}

const RecordVoiceVerification = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [selectedPrompt, setSelectedPrompt] = useState<string>("");
  const [error, setError] = useState<RecordingError>({ code: null, message: "" });
  const [userName, setUserName] = useState<string>("there");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  useEffect(() => {
    // Fetch user name and select random prompt
    const fetchUserAndPrompt = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const name = user?.user_metadata?.full_name?.split(' ')[0] || "there";
      setUserName(name);
      
      // Select random prompt
      const randomPrompt = VOICE_PROMPTS[Math.floor(Math.random() * VOICE_PROMPTS.length)];
      setSelectedPrompt(randomPrompt.replace('{name}', name));
    };
    fetchUserAndPrompt();
  }, []);

  const startRecording = async () => {
    try {
      setError({ code: null, message: "" });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Setup audio analysis
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      source.connect(analyserRef.current);

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        
        // Validate recording quality
        const validation = await validateRecording(blob);
        if (!validation.valid) {
          setError(validation.error);
          setRecordedBlob(null);
        } else {
          setRecordedBlob(blob);
          toast({
            title: "Recording captured",
            description: "Voice sample recorded successfully",
          });
        }
        
        stream.getTracks().forEach(track => track.stop());
        if (audioContextRef.current) {
          audioContextRef.current.close();
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error('Error accessing microphone:', err);
      toast({
        title: "Microphone Error",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const validateRecording = async (blob: Blob): Promise<{ valid: boolean; error: RecordingError }> => {
    // Check minimum duration (8-10 seconds)
    if (recordingTime < 8) {
      return {
        valid: false,
        error: {
          code: 'TOO_SHORT',
          message: "We couldn't hear enough clear speech to verify your voice. Please try again from a quieter place and read the full sentence on screen."
        }
      };
    }

    // Analyze audio quality
    if (analyserRef.current) {
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyserRef.current.getByteFrequencyData(dataArray);
      
      // Calculate average volume
      const average = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;
      
      // Check if too quiet (threshold: ~30 out of 255)
      if (average < 30) {
        return {
          valid: false,
          error: {
            code: 'TOO_QUIET',
            message: "We couldn't hear enough clear speech to verify your voice. Please try again from a quieter place and read the full sentence on screen."
          }
        };
      }
    }

    return { valid: true, error: { code: null, message: "" } };
  };

  const handleContinue = () => {
    if (recordedBlob) {
      // Convert blob to base64 for edge function
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Audio = reader.result as string;
        navigate("/voice-certification/fingerprint", {
          state: { 
            audioData: base64Audio.split(',')[1], // Remove data:audio/webm;base64, prefix
            recordingDuration: recordingTime,
            selectedPrompt
          }
        });
      };
      reader.readAsDataURL(recordedBlob);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <CertificationStepper 
          currentStep={2} 
          totalSteps={7} 
          stepLabel="Record Your Voice"
        />

        <Card className="p-8 space-y-6">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-bold">Verify your real voice</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Record a short, 10-second sample so we can protect your voice from impersonation and AI misuse.
            </p>
          </div>

          {/* Requirements */}
          <div className="bg-muted/30 border border-border rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Find a quiet space</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Speak in your normal voice</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Read the sentence below out loud</span>
            </div>
          </div>

          {/* Script Prompt */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Read this out loud:</label>
            <div className="bg-primary/5 border-2 border-primary/20 rounded-lg p-6">
              <p className="text-lg font-medium text-center">
                "{selectedPrompt}"
              </p>
            </div>
          </div>

          {/* Recording Controls */}
          <div className="flex flex-col items-center gap-6 py-6">
            {!isRecording && !recordedBlob && (
              <Button
                size="lg"
                onClick={startRecording}
                className="w-full max-w-xs h-16 text-lg"
              >
                <Mic className="mr-2 h-6 w-6" />
                Start Recording
              </Button>
            )}

            {isRecording && (
              <div className="flex flex-col items-center gap-4 w-full">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-2xl font-bold">{formatTime(recordingTime)}</span>
                  <span className="text-sm text-muted-foreground">/ 0:10 minimum</span>
                </div>
                <Button
                  size="lg"
                  variant="destructive"
                  onClick={stopRecording}
                  className="w-full max-w-xs h-16 text-lg"
                >
                  <Square className="mr-2 h-6 w-6" />
                  Stop Recording
                </Button>
              </div>
            )}

            {recordedBlob && !error.code && (
              <div className="flex flex-col items-center gap-4 w-full">
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <CheckCircle className="h-6 w-6" />
                  <span className="text-lg font-medium">Recording complete ({formatTime(recordingTime)})</span>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setRecordedBlob(null);
                    setError({ code: null, message: "" });
                  }}
                  className="w-full max-w-xs"
                >
                  Record Again
                </Button>
              </div>
            )}
          </div>

          {/* Error Display */}
          {error.code && (
            <Card className="border-destructive bg-destructive/5">
              <div className="p-4 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                <div className="flex-1 space-y-2">
                  <p className="font-medium text-destructive">
                    {error.code === 'ATTEMPTS_LIMIT' ? 'Attempts Limit Reached' : 'Recording Issue'}
                  </p>
                  <p className="text-sm text-destructive/80">{error.message}</p>
                </div>
              </div>
            </Card>
          )}

          {/* Navigation */}
          <div className="flex justify-between items-center pt-6 border-t">
            <Button
              variant="ghost"
              onClick={() => navigate("/voice-certification-flow")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>

            <Button
              size="lg"
              onClick={handleContinue}
              disabled={!recordedBlob || !!error.code}
            >
              Continue
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default RecordVoiceVerification;
