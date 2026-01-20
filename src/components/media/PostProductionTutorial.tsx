import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Play, Pause, BookOpen, ExternalLink } from "lucide-react";
import timelineOverview from "@/assets/tutorial-seeksy-timeline.jpg";
import aiTools from "@/assets/tutorial-seeksy-ai-tools.jpg";
import manualTools from "@/assets/tutorial-seeksy-manual-tools.jpg";
import exportSave from "@/assets/tutorial-seeksy-export-save.jpg";

interface TutorialStep {
  title: string;
  description: string;
  image: string;
  tips: string[];
}

const tutorialSteps: TutorialStep[] = [
  {
    title: "Welcome to Post Production Studio",
    description: "Transform your single-camera videos into polished, professional content with AI-powered editing tools and manual controls.",
    image: timelineOverview,
    tips: [
      "Use the timeline to navigate your video",
      "Click anywhere on the timeline to jump to that moment",
      "Markers appear as colored indicators on the timeline"
    ]
  },
  {
    title: "AI-Powered Editing Tools",
    description: "Let AI do the heavy lifting with intelligent camera focusing, ad placement, smart trimming, B-roll integration, and clip suggestions. The big blue button STARTS the AI processing. The AI Edits tab DISPLAYS the results after processing completes.",
    image: aiTools,
    tips: [
      "Full AI Enhancement button (big blue) STARTS the AI processing",
      "AI Edits tab DISPLAYS what the AI found and changed after processing",
      "Upload your own B-roll clips - AI will automatically use them",
      "AI Camera Focus creates multicam-style edits with punch-ins and zooms",
      "Real-time PiP preview shows AI edits as they're applied",
      "AI suggests viral-worthy clips automatically (orange markers)",
      "AI Ad Insertion finds natural breaks for ad placement",
      "Smart Trim removes filler words and awkward pauses automatically"
    ]
  },
  {
    title: "Manual Editing Tools",
    description: "Take full control with manual tools for lower thirds, B-roll marking, and precise cuts. Upload B-roll clips in Media Library for AI to use automatically.",
    image: manualTools,
    tips: [
      "Upload B-roll clips in Media Library's B-Roll Library card",
      "Add lower thirds at any timestamp for name tags and titles",
      "Manually mark B-roll positions using VideoMarkerPanel",
      "Studio markers automatically transfer to AI Studio",
      "Mark manual cut points to remove unwanted sections"
    ]
  },
  {
    title: "Save and Export",
    description: "Save your work and export your polished video when you're ready. Choose to save edits only, keep original, or save both versions.",
    image: exportSave,
    tips: [
      "Save Both Versions keeps original + AI-edited in Media Library",
      "AI-edited videos appear in the 'AI Edited' tab",
      "Click Save to preserve your markers and edits",
      "Export renders your final video with all changes applied",
      "Review the Markers tab to see all your edits at a glance"
    ]
  }
];

interface PostProductionTutorialProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PostProductionTutorial({ open, onOpenChange }: PostProductionTutorialProps) {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onOpenChange(false);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    if (!isPlaying) {
      // Auto-advance through steps
      const interval = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev < tutorialSteps.length - 1) {
            return prev + 1;
          } else {
            setIsPlaying(false);
            clearInterval(interval);
            return prev;
          }
        });
      }, 5000);
    }
  };

  const step = tutorialSteps[currentStep];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Post Production Studio Tutorial
            </DialogTitle>
            <Badge variant="secondary">
              Step {currentStep + 1} of {tutorialSteps.length}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Tutorial Image */}
          <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
            <img
              src={step.image}
              alt={step.title}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Step Content */}
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
              <p className="text-muted-foreground">{step.description}</p>
            </div>

            {/* Tips */}
            <div className="bg-primary/5 border border-primary/10 rounded-lg p-4">
              <h4 className="font-semibold mb-2">💡 Pro Tips:</h4>
              <ul className="space-y-2">
                {step.tips.map((tip, index) => (
                  <li key={index} className="text-sm flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePlayPause}
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
              
              <Button
                variant="outline"
                onClick={() => {
                  onOpenChange(false);
                  navigate("/studio");
                }}
              >
                Back to Studio
              </Button>
            </div>

            <Button onClick={handleNext}>
              {currentStep === tutorialSteps.length - 1 ? (
                "Get Started"
              ) : (
                <>
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>

          {/* Step Indicators */}
          <div className="flex justify-center gap-2">
            {tutorialSteps.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentStep
                    ? "w-8 bg-primary"
                    : "w-2 bg-muted-foreground/30"
                }`}
              />
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
