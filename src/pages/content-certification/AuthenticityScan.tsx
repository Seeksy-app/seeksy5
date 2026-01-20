import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, AlertTriangle, CheckCircle2, Shield } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { Progress } from "@/components/ui/progress";

const AuthenticityScan = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [progress, setProgress] = useState(0);
  const [isScanning, setIsScanning] = useState(true);
  const [scanResults, setScanResults] = useState<any>(null);
  const [currentTask, setCurrentTask] = useState("Analyzing content integrity...");

  useEffect(() => {
    // Simulate authenticity scanning
    const tasks = [
      "Analyzing content integrity...",
      "Checking for tampering...",
      "Detecting AI-generated segments...",
      "Verifying metadata...",
      "Generating authenticity report...",
    ];

    let taskIndex = 0;
    let currentProgress = 0;

    const progressInterval = setInterval(() => {
      currentProgress += 1.5;
      setProgress(currentProgress);

      if (currentProgress % 20 === 0 && taskIndex < tasks.length - 1) {
        taskIndex++;
        setCurrentTask(tasks[taskIndex]);
      }

      if (currentProgress >= 100) {
        clearInterval(progressInterval);
        setIsScanning(false);
        
        // Load mock scan results
        setScanResults({
          overallScore: 88,
          tamperDetected: true,
          warnings: [
            {
              type: "splice",
              severity: "medium",
              timestamp: "00:02:34",
              description: "Audio splice detected - possible edit at this timestamp",
              confidence: 78
            },
            {
              type: "ai_generated",
              severity: "low",
              timestamp: "00:01:15",
              description: "Segment shows characteristics of AI-generated content",
              confidence: 62
            }
          ],
          metadata: {
            originalCreationDate: "Jan 15, 2025",
            lastModifiedDate: "Jan 15, 2025",
            deviceInfo: "iPhone 14 Pro",
            locationInfo: "San Francisco, CA"
          },
          aiProbability: 35
        });
      }
    }, 80);

    return () => clearInterval(progressInterval);
  }, []);

  const handleContinue = () => {
    navigate("/content-certification/approve-mint", {
      state: { 
        ...location.state,
        authenticityData: scanResults
      }
    });
  };

  const getSeverityColor = (severity: string) => {
    switch(severity) {
      case "high": return "text-red-500";
      case "medium": return "text-yellow-500";
      case "low": return "text-blue-500";
      default: return "text-muted-foreground";
    }
  };

  const getSeverityIcon = (severity: string) => {
    return severity === "high" || severity === "medium" ? (
      <AlertTriangle className={`h-5 w-5 ${getSeverityColor(severity)}`} />
    ) : (
      <CheckCircle2 className={`h-5 w-5 ${getSeverityColor(severity)}`} />
    );
  };

  return (
    <div className="min-h-screen bg-brand-navy flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2 text-white">
            <span className="font-bold text-xl">SEEKSY</span>
          </div>
          <div className="text-white/60 text-sm font-medium">
            {isScanning ? "Scanning..." : "Scan Complete"}
          </div>
        </div>

        <h1 className="text-4xl md:text-5xl font-bold text-white text-center">
          AUTHENTICITY SCAN
        </h1>

        {isScanning ? (
          <Card className="bg-card p-8 space-y-6">
            <div className="text-center">
              <Shield className="h-16 w-16 mx-auto mb-4 text-primary" />
              <p className="text-lg text-muted-foreground mb-6">
                Running comprehensive authenticity checks on your content...
              </p>
            </div>

            <Progress value={progress} className="w-full" />

            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Content Integrity</span>
                <span className="text-foreground">{progress > 20 ? "✓" : "..."}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Tamper Detection</span>
                <span className="text-foreground">{progress > 40 ? "✓" : "..."}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">AI Generation Check</span>
                <span className="text-foreground">{progress > 60 ? "✓" : "..."}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Metadata Verification</span>
                <span className="text-foreground">{progress > 80 ? "✓" : "..."}</span>
              </div>
            </div>

            <p className="text-sm text-muted-foreground text-center pt-4 animate-pulse">
              • {currentTask}
            </p>
          </Card>
        ) : (
          <>
            <Card className="bg-card p-6 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">Authenticity Score</h3>
                <div className="flex items-center gap-2">
                  <span className={`text-3xl font-bold ${
                    scanResults.overallScore >= 80 ? "text-green-500" : 
                    scanResults.overallScore >= 60 ? "text-yellow-500" : "text-red-500"
                  }`}>
                    {scanResults.overallScore}%
                  </span>
                </div>
              </div>

              {scanResults.warnings.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm uppercase text-muted-foreground">Warnings Detected</h4>
                  {scanResults.warnings.map((warning: any, index: number) => (
                    <div key={index} className="flex gap-3 p-3 bg-muted/50 rounded-lg">
                      {getSeverityIcon(warning.severity)}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className={`font-medium text-sm ${getSeverityColor(warning.severity)}`}>
                            {warning.type.replace("_", " ").toUpperCase()}
                          </span>
                          {warning.timestamp && (
                            <span className="text-xs text-muted-foreground">{warning.timestamp}</span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{warning.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Confidence: {warning.confidence}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-2 pt-4 border-t border-border">
                <h4 className="font-semibold text-sm uppercase text-muted-foreground mb-3">Content Metadata</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Original Date:</span>
                    <p className="font-medium">{scanResults.metadata.originalCreationDate}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Last Modified:</span>
                    <p className="font-medium">{scanResults.metadata.lastModifiedDate}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Device:</span>
                    <p className="font-medium">{scanResults.metadata.deviceInfo}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Location:</span>
                    <p className="font-medium">{scanResults.metadata.locationInfo}</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">AI-Generated Probability:</span>
                  <span className={`font-bold ${
                    scanResults.aiProbability < 20 ? "text-green-500" : 
                    scanResults.aiProbability < 50 ? "text-yellow-500" : "text-red-500"
                  }`}>
                    {scanResults.aiProbability}%
                  </span>
                </div>
              </div>
            </Card>

            <div className="flex justify-center pt-6">
              <Button
                size="lg"
                onClick={handleContinue}
                className="bg-primary hover:bg-primary/90 text-lg px-12 py-6"
              >
                Approve & Mint Certificate
              </Button>
            </div>
          </>
        )}

        <div className="text-center">
          <Button
            variant="ghost"
            onClick={() => navigate("/content-certification/fingerprint")}
            disabled={isScanning}
            className="text-white hover:text-white/80 disabled:opacity-30"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>

        <div className="text-center pt-6">
          <p className="text-white font-bold text-2xl">seeksy</p>
        </div>
      </div>
    </div>
  );
};

export default AuthenticityScan;
