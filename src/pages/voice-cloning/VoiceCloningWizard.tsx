import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Mic, Upload, CheckCircle2, Loader2 } from "lucide-react";

export default function VoiceCloningWizard() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);

  const steps = [
    { number: 1, title: "Intro", completed: currentStep > 1 },
    { number: 2, title: "Provide Sample", completed: currentStep > 2 },
    { number: 3, title: "AI Analysis", completed: currentStep > 3 },
    { number: 4, title: "Clone Generation", completed: currentStep > 4 },
    { number: 5, title: "Playback & Review", completed: currentStep > 5 },
    { number: 6, title: "Publish Clone", completed: currentStep > 6 },
    { number: 7, title: "Confirmation", completed: currentStep > 7 },
  ];

  const progress = (currentStep / steps.length) * 100;

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Progress Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold">Voice Cloning</h1>
            <p className="text-muted-foreground">Step {currentStep} of {steps.length}</p>
          </div>
          <Badge variant="outline">
            {Math.round(progress)}% Complete
          </Badge>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Steps Display */}
      <div className="flex justify-between mb-8 overflow-x-auto pb-4">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center">
            <div className="flex flex-col items-center min-w-[100px]">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                step.completed 
                  ? 'bg-green-600 text-white' 
                  : currentStep === step.number 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-muted-foreground'
              }`}>
                {step.completed ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <span>{step.number}</span>
                )}
              </div>
              <span className="text-xs text-center">{step.title}</span>
            </div>
            {index < steps.length - 1 && (
              <div className={`h-0.5 w-12 mx-2 ${
                step.completed ? 'bg-green-600' : 'bg-muted'
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle>{steps[currentStep - 1].title}</CardTitle>
          <CardDescription>
            {currentStep === 1 && "Welcome to the voice cloning process"}
            {currentStep === 2 && "Upload or record your voice sample"}
            {currentStep === 3 && "AI is analyzing your voice characteristics"}
            {currentStep === 4 && "Generating your AI voice clone"}
            {currentStep === 5 && "Listen to your cloned voice"}
            {currentStep === 6 && "Ready to publish your voice clone"}
            {currentStep === 7 && "Your voice clone is ready!"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {currentStep === 1 && (
            <div className="text-center py-8 space-y-4">
              <Mic className="w-16 h-16 mx-auto text-primary" />
              <div>
                <h3 className="text-xl font-semibold mb-2">Create Your AI Voice Clone</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  This wizard will guide you through creating an AI version of your certified voice. 
                  The process takes about 5-10 minutes.
                </p>
              </div>
              <Button size="lg" onClick={() => setCurrentStep(2)}>
                Get Started
              </Button>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <Card className="p-6 cursor-pointer hover:bg-accent transition-colors border-2 hover:border-primary">
                  <div className="text-center space-y-3">
                    <Mic className="w-12 h-12 mx-auto text-primary" />
                    <h3 className="font-semibold">Record Now</h3>
                    <p className="text-sm text-muted-foreground">
                      Record a fresh voice sample
                    </p>
                  </div>
                </Card>

                <Card className="p-6 cursor-pointer hover:bg-accent transition-colors border-2 hover:border-primary">
                  <div className="text-center space-y-3">
                    <Upload className="w-12 h-12 mx-auto text-primary" />
                    <h3 className="font-semibold">Upload File</h3>
                    <p className="text-sm text-muted-foreground">
                      Upload an existing recording
                    </p>
                  </div>
                </Card>
              </div>
              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setCurrentStep(1)}>
                  Back
                </Button>
                <Button onClick={() => setCurrentStep(3)}>
                  Continue
                </Button>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="text-center py-8 space-y-4">
              <Loader2 className="w-16 h-16 mx-auto text-primary animate-spin" />
              <div>
                <h3 className="text-xl font-semibold mb-2">Analyzing Your Voice</h3>
                <p className="text-muted-foreground">
                  AI is analyzing voice characteristics, tone, and patterns...
                </p>
              </div>
            </div>
          )}

          {currentStep > 3 && (
            <div className="text-center py-8 space-y-4">
              <p className="text-muted-foreground">
                Voice cloning wizard steps 4-7 coming soon
              </p>
              <div className="flex gap-2 justify-center">
                <Button variant="outline" onClick={() => navigate('/my-voice-identity')}>
                  Back to Voice Identity
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
