import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Check, Loader2 } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { Progress } from "@/components/ui/progress";

interface MintingStep {
  label: string;
  status: "pending" | "active" | "complete";
  progress: number;
}

const MintingProgressContent = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [steps, setSteps] = useState<MintingStep[]>([
    { label: "Preparing", status: "active", progress: 0 },
    { label: "Signing", status: "pending", progress: 0 },
    { label: "Minting", status: "pending", progress: 0 },
    { label: "Finalizing", status: "pending", progress: 0 },
  ]);

  useEffect(() => {
    // Simulate minting process
    const stepDuration = 2000; // 2 seconds per step
    let currentStep = 0;

    const timer = setInterval(() => {
      setSteps(prevSteps => {
        const newSteps = [...prevSteps];
        
        if (currentStep < newSteps.length) {
          // Complete current step
          if (newSteps[currentStep].progress < 100) {
            newSteps[currentStep].progress += 10;
          } else {
            newSteps[currentStep].status = "complete";
            currentStep++;
            
            // Activate next step
            if (currentStep < newSteps.length) {
              newSteps[currentStep].status = "active";
            }
          }
        }

        return newSteps;
      });

      // Navigate to success screen when all steps complete
      if (currentStep >= 4) {
        clearInterval(timer);
        setTimeout(() => {
          navigate("/content-certification/success", {
            state: {
              ...location.state,
              certificateId: "cert_" + Date.now(),
              tokenId: "87654321",
              blockchain: "Polygon"
            }
          });
        }, 500);
      }
    }, 200);

    return () => clearInterval(timer);
  }, [navigate, location.state]);

  const overallProgress = (steps.filter(s => s.status === "complete").length / steps.length) * 100;

  return (
    <div className="min-h-screen bg-brand-navy flex items-center justify-center p-4">
      <Card className="max-w-xl w-full bg-card p-8 space-y-6">
        <h2 className="text-3xl font-bold text-center">Minting Your Content Certificate...</h2>

        <Progress value={overallProgress} className="w-full" />

        <p className="text-sm text-muted-foreground text-center">
          Creating blockchain certificate for content authenticity
        </p>

        <div className="space-y-4 py-6">
          {steps.map((step, index) => (
            <div key={step.label} className="space-y-2">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                  step.status === "complete" 
                    ? "bg-primary text-white" 
                    : step.status === "active"
                    ? "bg-primary/50 text-white"
                    : "bg-muted text-muted-foreground"
                }`}>
                  {step.status === "complete" ? (
                    <Check className="h-4 w-4" />
                  ) : step.status === "active" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <span className="text-sm font-medium">{index + 1}</span>
                  )}
                </div>
                <span className={`text-lg font-medium ${
                  step.status === "active" ? "text-foreground" : "text-muted-foreground"
                }`}>
                  {step.label}
                </span>
              </div>
              
              {step.status !== "pending" && (
                <div className="ml-11">
                  <Progress value={step.progress} className="h-2" />
                </div>
              )}
            </div>
          ))}
        </div>

        <p className="text-sm text-muted-foreground text-center pt-4">
          This is a gasless transaction covered by Seeksy.
        </p>

        <div className="text-center pt-6">
          <p className="text-foreground font-bold">Seeksy</p>
        </div>
      </Card>
    </div>
  );
};

export default MintingProgressContent;
