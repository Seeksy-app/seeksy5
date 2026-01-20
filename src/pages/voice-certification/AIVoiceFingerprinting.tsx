import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Shield, Check, X, Volume2 } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import { CertificationStepper } from "@/components/voice-certification/CertificationStepper";

const AIVoiceFingerprinting = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [progress, setProgress] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [currentTask, setCurrentTask] = useState("Generating unique markers...");

  useEffect(() => {
    // Simulate analysis progress
    const tasks = [
      "Generating unique markers...",
      "Training model...",
      "Computing distances...",
      "Analyzing audio quality...",
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
      }
    }, 100);

    return () => clearInterval(progressInterval);
  }, []);

  const handleContinue = () => {
    navigate("/voice-certification/confidence", {
      state: { 
        audioData: location.state?.audioData,
        fingerprintData: {
          matchConfidence: 98,
          voiceName: "Christy Louis",
          audioQuality: "High",
          fraudCheckPassed: true
        }
      }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <CertificationStepper 
          currentStep={3} 
          totalSteps={7} 
          stepLabel="AI Voice Analysis"
        />

        <Card className="p-8 md:p-12">
          <div className="text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <Shield className="h-5 w-5 text-primary animate-pulse" />
              <span className="text-sm font-medium text-primary">
                {isAnalyzing ? "Analyzing..." : "Analysis Complete"}
              </span>
            </div>

            <h2 className="text-3xl font-bold">Creating Your Voice Fingerprint</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              We analyze your recording to generate a unique, cryptographic fingerprint of your voice using advanced AI audio models.
            </p>

            {/* Circular Progress Visualization */}
            <div className="relative w-48 h-48 mx-auto my-12">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="96"
                  cy="96"
                  r="88"
                  fill="none"
                  stroke="hsl(var(--muted))"
                  strokeWidth="8"
                />
                <circle
                  cx="96"
                  cy="96"
                  r="88"
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="8"
                  strokeDasharray={`${(progress / 100) * 553} 553`}
                  className="transition-all duration-300"
                  strokeLinecap="round"
                />
              </svg>

              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-5xl font-bold">{progress}%</p>
                  <p className="text-xs text-muted-foreground mt-1">Complete</p>
                </div>
              </div>
            </div>

            {/* AI Analysis Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
              <div className="p-4 rounded-lg bg-muted/50 border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Match Confidence</span>
                  {progress >= 100 ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                  )}
                </div>
                <p className="text-2xl font-bold text-primary">
                  {progress >= 100 ? "98%" : "..."}
                </p>
                <p className="text-xs text-muted-foreground mt-1">AI Voice Match</p>
              </div>

              <div className="p-4 rounded-lg bg-muted/50 border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Fraud Detection</span>
                  {progress >= 100 ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                  )}
                </div>
                <p className="text-2xl font-bold text-green-500">
                  {progress >= 100 ? "Passed" : "..."}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Authenticity Check</p>
              </div>

              <div className="p-4 rounded-lg bg-muted/50 border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Audio Quality</span>
                  {progress >= 100 ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                  )}
                </div>
                <p className="text-2xl font-bold">
                  {progress >= 100 ? "High" : "..."}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Signal Analysis</p>
              </div>
            </div>

            {/* Footer note */}
            <div className="text-center pt-6 border-t">
              <p className="text-sm text-muted-foreground">
                Your fingerprint is encrypted and used only to verify your identity.
              </p>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center pt-8 mt-8 border-t">
            <Button
              variant="ghost"
              onClick={() => navigate("/voice-certification/upload")}
              disabled={isAnalyzing}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>

            <Button
              size="lg"
              onClick={handleContinue}
              disabled={isAnalyzing}
            >
              Continue
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AIVoiceFingerprinting;
