import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import { detectVoicesInContent } from "@/services/contentCertificationAPI";

const AIFingerprintMatch = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [progress, setProgress] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [detectedVoices, setDetectedVoices] = useState<any[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string | null>(null);
  const [currentTask, setCurrentTask] = useState("Analyzing audio content...");

  useEffect(() => {
    // Simulate voice detection analysis
    const tasks = [
      "Analyzing audio content...",
      "Detecting voice patterns...",
      "Matching against certified voices...",
      "Building voice profile...",
    ];

    let taskIndex = 0;
    let currentProgress = 0;

    const progressInterval = setInterval(() => {
      currentProgress += 2;
      setProgress(currentProgress);

      if (currentProgress % 25 === 0 && taskIndex < tasks.length - 1) {
        taskIndex++;
        setCurrentTask(tasks[taskIndex]);
      }

      if (currentProgress >= 100) {
        clearInterval(progressInterval);
        setIsAnalyzing(false);
        
        // Load mock detected voices
        setDetectedVoices([
          {
            voiceId: "voice_123456",
            voiceName: "Christy Louis",
            confidence: 97,
            isCertified: true,
            segments: 2
          },
          {
            voiceId: "voice_789012",
            voiceName: "Guest Speaker",
            confidence: 89,
            isCertified: false,
            segments: 1
          }
        ]);
      }
    }, 100);

    return () => clearInterval(progressInterval);
  }, []);

  const handleVoiceSelect = (voiceId: string) => {
    setSelectedVoice(voiceId);
  };

  const handleContinue = () => {
    const primaryVoice = detectedVoices.find(v => v.voiceId === selectedVoice);
    navigate("/content-certification/authenticity", {
      state: { 
        ...location.state,
        voiceData: {
          selectedVoice: primaryVoice,
          allVoices: detectedVoices
        }
      }
    });
  };

  return (
    <div className="min-h-screen bg-brand-navy flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center space-y-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2 text-white">
            <span className="font-bold text-xl">SEEKSY</span>
          </div>
          <div className="text-white/60 text-sm font-medium">
            {isAnalyzing ? "Analyzing..." : "Analysis Complete"}
          </div>
        </div>

        <h1 className="text-4xl md:text-5xl font-bold text-white uppercase tracking-wide">
          AI FINGERPRINT MATCH
        </h1>

        {isAnalyzing ? (
          <>
            <p className="text-white/80 text-xl">
              Detecting voices in your content...
            </p>

            {/* Circular Progress Visualization */}
            <div className="relative w-64 h-64 mx-auto my-12">
              <svg className="w-full h-full" viewBox="0 0 200 200">
                <circle
                  cx="100"
                  cy="100"
                  r="80"
                  fill="none"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                />
                <circle
                  cx="100"
                  cy="100"
                  r="80"
                  fill="none"
                  stroke="rgba(44,107,237,0.6)"
                  strokeWidth="2"
                  strokeDasharray={`${(progress / 100) * 502} 502`}
                  strokeDashoffset="0"
                  transform="rotate(-90 100 100)"
                  className="transition-all duration-300"
                />
              </svg>

              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-5xl font-bold text-white">{progress}%</p>
                </div>
              </div>

              <div className="absolute right-0 top-1/2 transform translate-x-12 -translate-y-1/2">
                <div className="bg-white/10 px-4 py-2 rounded-lg">
                  <p className="text-white text-sm font-medium">Processing</p>
                </div>
              </div>
            </div>

            <div className="text-white/60 text-sm animate-pulse">
              • {currentTask}
            </div>
          </>
        ) : (
          <>
            <p className="text-white/80 text-xl">
              The voice in your content was detected automatically. Please select the matching creator voice.
            </p>

            <div className="space-y-4 max-w-md mx-auto">
              {detectedVoices.map((voice) => (
                <Card
                  key={voice.voiceId}
                  className={`p-4 cursor-pointer transition-all ${
                    selectedVoice === voice.voiceId
                      ? "bg-primary/20 border-primary border-2"
                      : "bg-card/50 border-border hover:bg-card/70"
                  }`}
                  onClick={() => handleVoiceSelect(voice.voiceId)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent"></div>
                      <div className="text-left">
                        <p className="font-semibold text-foreground">{voice.voiceName}</p>
                        <p className="text-sm text-muted-foreground">
                          {voice.confidence}% match • {voice.segments} segment{voice.segments > 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    {voice.isCertified && (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center pt-8 max-w-md mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate("/content-certification")}
            disabled={isAnalyzing}
            className="text-white hover:text-white/80 disabled:opacity-30"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          <Button
            size="lg"
            onClick={handleContinue}
            disabled={isAnalyzing || !selectedVoice}
            className="bg-primary hover:bg-primary/90 disabled:opacity-30"
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AIFingerprintMatch;
