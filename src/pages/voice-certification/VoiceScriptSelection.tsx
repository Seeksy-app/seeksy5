import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { toast } from "sonner";

const VOICE_PROMPTS = [
  "Hi, my name is {name}. I'm recording this sample to verify my voice on Seeksy and protect my identity. This helps confirm it's really me when I'm using the platform, and ensures my voice cannot be used without my permission.",
  "This is {name} confirming that Seeksy can use this recording only to verify my voice and secure my account. I understand it won't be shared without my permission, and I agree to these terms for voice verification and authentication.",
  "I'm {name}, and I'm recording this voice sample so Seeksy can help keep my identity safe on the platform. This verification ensures no one else can impersonate me, and my voice remains under my full control at all times.",
  "My name is {name}, and I'm verifying my voice on Seeksy to protect my content and identity. I want to make sure only I have access to my authentic voice signature, and that it's used solely for security purposes.",
  "This is {name}. I authorize Seeksy to use this voice recording for identity verification purposes only. This recording helps secure my account and content against unauthorized use, and I confirm this is my real voice speaking right now."
];

const VoiceScriptSelection = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const displayName = location.state?.displayName || "there";
  
  const [selectedPromptIndex, setSelectedPromptIndex] = useState<number>(0);
  const [prompts, setPrompts] = useState<string[]>([]);

  useEffect(() => {
    // Generate all prompts with user's name
    const personalizedPrompts = VOICE_PROMPTS.map(prompt => 
      prompt.replace('{name}', displayName)
    );
    setPrompts(personalizedPrompts);
    
    // Randomly select initial prompt
    const randomIndex = Math.floor(Math.random() * personalizedPrompts.length);
    setSelectedPromptIndex(randomIndex);
  }, [displayName]);

  const handleRandomizePrompt = () => {
    const newIndex = Math.floor(Math.random() * prompts.length);
    setSelectedPromptIndex(newIndex);
    toast.success("Script updated");
  };

  const handleBeginRecording = () => {
    navigate("/identity/voice/recording", {
      state: {
        displayName,
        selectedPrompt: prompts[selectedPromptIndex],
        promptIndex: selectedPromptIndex
      }
    });
  };

  if (prompts.length === 0) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 flex items-center justify-center p-4">
      <div className="max-w-3xl w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/identity/voice/consent")}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>

        {/* Main Card */}
        <Card className="p-8 md:p-12 bg-card/50 backdrop-blur-sm border-border/50">
          <div className="space-y-8">
            {/* Title */}
            <div className="text-center space-y-3">
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                Verify Your Voice Identity
              </h1>
              <p className="text-lg text-muted-foreground">
                Read the phrase below out loud.
              </p>
            </div>

            {/* Script Display */}
            <div className="relative">
              <div className="p-8 bg-primary/5 border-2 border-primary/20 rounded-2xl">
                <p className="text-2xl md:text-3xl leading-relaxed text-foreground font-medium text-center">
                  {prompts[selectedPromptIndex]}
                </p>
              </div>

              {/* Randomize Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleRandomizePrompt}
                className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-background shadow-lg"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Use Different Script
              </Button>
            </div>

            {/* Instructions */}
            <div className="bg-muted/50 p-6 rounded-xl space-y-3">
              <p className="text-sm font-semibold text-foreground">Before you begin:</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Find a quiet space with minimal background noise</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Speak naturally at your normal volume and pace</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Read the entire script clearly from start to finish</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Recording will be 10-30 seconds (auto-stops at 30)</span>
                </li>
              </ul>
            </div>

            {/* Begin Button */}
            <Button
              size="lg"
              onClick={handleBeginRecording}
              className="w-full h-14 text-lg font-semibold"
            >
              Begin Recording
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default VoiceScriptSelection;
