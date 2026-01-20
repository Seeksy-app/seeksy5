import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Square, Play, Pause } from "lucide-react";
import { toast } from "sonner";

const VoiceRecording = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { displayName, selectedPrompt, promptIndex } = location.state || {};

  const [state, setState] = useState<'countdown' | 'recording' | 'review'>('countdown');
  const [countdown, setCountdown] = useState(3);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string>("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [waveformData, setWaveformData] = useState<number[]>(new Array(60).fill(0));

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const previousWaveformRef = useRef<number[]>(new Array(60).fill(0));

  useEffect(() => {
    if (!selectedPrompt || displayName === undefined) {
      navigate("/identity/voice/consent");
      return;
    }

    // Start countdown immediately
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

    return () => {
      clearInterval(countdownInterval);
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Set up audio context for waveform
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;
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
        if (audioContextRef.current) {
          audioContextRef.current.close();
        }
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
            stopRecording();
          }
          return newTime;
        });
      }, 1000);

    } catch (err) {
      console.error('Microphone error:', err);
      toast.error("Microphone blocked", {
        description: "Please enable microphone access in your browser."
      });
      navigate("/identity/voice/script", { state: { displayName } });
    }
  };

  const animateWaveform = () => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);

    const animate = () => {
      if (!analyserRef.current) return;

      analyserRef.current.getByteFrequencyData(dataArray);

      const samples = [];
      const sampleSize = Math.floor(dataArray.length / 60);
      for (let i = 0; i < 60; i++) {
        const start = i * sampleSize;
        const slice = dataArray.slice(start, start + sampleSize);
        const average = slice.reduce((a, b) => a + b, 0) / slice.length;
        const normalized = Math.min((average / 255) * 3, 1);
        samples.push(normalized);
      }

      const smoothed = samples.map((value, i) => {
        const previous = previousWaveformRef.current[i];
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
          toast.error("Recording too short", {
            description: "Please record at least 10 seconds of audio."
          });
          navigate("/identity/voice/script", { state: { displayName } });
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
    navigate("/identity/voice/script", { state: { displayName } });
  };

  const handleContinue = () => {
    if (!audioBlob) return;

    navigate("/identity/voice/processing", {
      state: {
        audioBlob,
        recordingTime,
        selectedPrompt,
        displayName
      }
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 flex items-center justify-center p-4">
      <div className="max-w-3xl w-full">
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/identity/voice/script", { state: { displayName } })}
            disabled={state === 'recording'}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>

        <Card className="p-8 md:p-12 bg-card/50 backdrop-blur-sm border-border/50">
          <div className="space-y-8">
            {/* Countdown */}
            {state === 'countdown' && (
              <div className="text-center space-y-6">
                <div className="text-9xl font-bold text-primary animate-pulse">
                  {countdown}
                </div>
                <p className="text-xl text-muted-foreground">Get ready to read...</p>
              </div>
            )}

            {/* Recording */}
            {state === 'recording' && (
              <>
                <div className="text-center space-y-4">
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-3 h-3 bg-destructive rounded-full animate-pulse" />
                    <span className="text-2xl font-bold text-foreground">
                      {formatTime(recordingTime)}
                    </span>
                  </div>
                </div>

                <div className="p-8 bg-primary/5 border-2 border-primary/20 rounded-2xl">
                  <p className="text-2xl md:text-3xl leading-relaxed text-foreground font-medium text-center">
                    {selectedPrompt}
                  </p>
                </div>

                <div className="flex items-end justify-center gap-1 h-32">
                  {waveformData.map((value, i) => (
                    <div
                      key={i}
                      className="w-2 bg-primary rounded-full transition-all duration-100"
                      style={{
                        height: `${Math.max(value * 100, 4)}%`
                      }}
                    />
                  ))}
                </div>

                <Button
                  size="lg"
                  variant="destructive"
                  onClick={stopRecording}
                  disabled={recordingTime < 10}
                  className="w-full h-14 text-lg font-semibold"
                >
                  <Square className="mr-2 h-5 w-5" />
                  {recordingTime < 10 ? `Keep reading (${10 - recordingTime}s min)` : "Stop Recording"}
                </Button>
              </>
            )}

            {/* Review */}
            {state === 'review' && (
              <>
                <div className="text-center space-y-3">
                  <h2 className="text-2xl font-bold text-foreground">Review Your Recording</h2>
                  <p className="text-muted-foreground">Duration: {formatTime(recordingTime)}</p>
                </div>

                <div className="flex items-end justify-center gap-1 h-24 opacity-50">
                  {waveformData.map((value, i) => (
                    <div
                      key={i}
                      className="w-2 bg-primary rounded-full"
                      style={{
                        height: `${Math.max(value * 100, 4)}%`
                      }}
                    />
                  ))}
                </div>

                <div className="flex justify-center">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={togglePlayback}
                    className="w-48"
                  >
                    {isPlaying ? (
                      <>
                        <Pause className="mr-2 h-5 w-5" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="mr-2 h-5 w-5" />
                        Play Recording
                      </>
                    )}
                  </Button>
                </div>

                <audio
                  ref={audioRef}
                  src={audioUrl}
                  onEnded={() => setIsPlaying(false)}
                  className="hidden"
                />

                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={handleRerecord}
                    className="flex-1 h-14"
                  >
                    Re-record
                  </Button>
                  <Button
                    size="lg"
                    onClick={handleContinue}
                    className="flex-1 h-14 font-semibold"
                  >
                    Continue
                  </Button>
                </div>
              </>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default VoiceRecording;
