import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { CheckCircle2, Eye, ChevronLeft } from "lucide-react";

export interface IntakeData {
  status: string;
  branch: string;
  claimStatus: string;
  primaryGoals: string[];
}

interface ClaimsIntakeFlowProps {
  onComplete: (data: IntakeData) => void;
  onShowSample?: () => void;
  initialData?: Partial<IntakeData>;
}

const STATUS_OPTIONS = [
  { value: "veteran", label: "Veteran" },
  { value: "active_duty", label: "Active Duty" },
  { value: "guard_reserve", label: "Guard / Reserve" },
  { value: "spouse_caregiver", label: "Spouse or Family Member" },
  { value: "caregiver", label: "Caregiver" },
  { value: "other", label: "Other" },
];

const BRANCH_OPTIONS = [
  { value: "army", label: "Army" },
  { value: "marine_corps", label: "Marine Corps" },
  { value: "navy", label: "Navy" },
  { value: "air_force", label: "Air Force" },
  { value: "space_force", label: "Space Force" },
  { value: "coast_guard", label: "Coast Guard" },
  { value: "multiple_other", label: "Other" },
];

const CLAIM_STATUS_OPTIONS = [
  { value: "need_intent", label: "I need to file an Intent to File" },
  { value: "first_claim", label: "I'm working on my first claim" },
  { value: "increase", label: "I want to increase my rating" },
  { value: "denied", label: "I was denied and want to appeal" },
  { value: "learning", label: "I'm just learning / not sure" },
  { value: "other", label: "Other" },
];

const PRIMARY_GOAL_OPTIONS = [
  { value: "understand_benefits", label: "Understanding my benefits" },
  { value: "decide_filing", label: "Deciding whether to file" },
  { value: "file_intent", label: "Filing an Intent to File" },
  { value: "prepare_claim", label: "Preparing for an initial claim" },
  { value: "understand_rating", label: "Understanding a current rating or decision" },
];

export function ClaimsIntakeFlow({ onComplete, onShowSample, initialData }: ClaimsIntakeFlowProps) {
  // If user has profile data, skip to step 4 (goals selection)
  const hasProfileData = initialData?.status && initialData?.branch;
  const [step, setStep] = useState(hasProfileData ? 4 : 1);
  const [data, setData] = useState<IntakeData>({
    status: initialData?.status || "",
    branch: initialData?.branch || "",
    claimStatus: initialData?.claimStatus || "",
    primaryGoals: initialData?.primaryGoals || [],
  });

  const handleStatusSelect = (status: string) => {
    setData(prev => ({ ...prev, status }));
    setStep(2);
  };

  const handleBranchSelect = (branch: string) => {
    setData(prev => ({ ...prev, branch }));
    setStep(3);
  };

  const handleClaimStatusSelect = (claimStatus: string) => {
    setData(prev => ({ ...prev, claimStatus }));
    setStep(4);
  };

  const handleGoalToggle = (goal: string) => {
    setData(prev => ({
      ...prev,
      primaryGoals: prev.primaryGoals.includes(goal)
        ? prev.primaryGoals.filter(g => g !== goal)
        : [...prev.primaryGoals, goal],
    }));
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleComplete = () => {
    if (data.primaryGoals.length === 0) return;
    onComplete(data);
  };

  const stepTitles = [
    "Which best describes you right now?",
    "Which branch did you serve in?",
    "Where are you in the VA claims process?",
    "What would you like help with today?",
  ];

  const stepDescriptions = [
    "This helps me understand your situation better.",
    "Or are currently serving in.",
    "It's okay if you're not sure — just pick the closest option.",
    "Select all that apply.",
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-full p-6">
      {/* Progress Indicator */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
              step > s 
                ? "bg-green-500 text-white" 
                : step === s 
                  ? "bg-orange-500 text-white scale-110" 
                  : "bg-muted text-muted-foreground"
            }`}>
              {step > s ? <CheckCircle2 className="w-5 h-5" /> : s}
            </div>
            {s < 4 && (
              <div className={`w-10 h-1.5 mx-1 rounded-full transition-colors ${step > s ? "bg-green-500" : "bg-muted"}`} />
            )}
          </div>
        ))}
      </div>

      <Card className="w-full max-w-xl shadow-lg border-0">
        <CardHeader className="text-center pb-2">
          {step > 1 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="absolute left-4 top-4"
              onClick={handleBack}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
          )}
          <CardTitle className="text-xl font-semibold">
            {stepTitles[step - 1]}
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            {stepDescriptions[step - 1]}
          </p>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid gap-3">
            {step === 1 && STATUS_OPTIONS.map((option) => (
              <Button
                key={option.value}
                variant={data.status === option.value ? "default" : "outline"}
                className={`w-full justify-start h-auto py-4 px-5 text-[15px] rounded-xl transition-all ${
                  data.status === option.value 
                    ? "bg-orange-600 hover:bg-orange-700 text-white" 
                    : "hover:bg-orange-50 hover:border-orange-300 dark:hover:bg-orange-950/20"
                }`}
                onClick={() => handleStatusSelect(option.value)}
              >
                {option.label}
              </Button>
            ))}
            
            {step === 2 && BRANCH_OPTIONS.map((option) => (
              <Button
                key={option.value}
                variant={data.branch === option.value ? "default" : "outline"}
                className={`w-full justify-start h-auto py-4 px-5 text-[15px] rounded-xl transition-all ${
                  data.branch === option.value 
                    ? "bg-orange-600 hover:bg-orange-700 text-white" 
                    : "hover:bg-orange-50 hover:border-orange-300 dark:hover:bg-orange-950/20"
                }`}
                onClick={() => handleBranchSelect(option.value)}
              >
                {option.label}
              </Button>
            ))}
            
            {step === 3 && CLAIM_STATUS_OPTIONS.map((option) => (
              <Button
                key={option.value}
                variant={data.claimStatus === option.value ? "default" : "outline"}
                className={`w-full justify-start h-auto py-4 px-5 text-[15px] rounded-xl transition-all ${
                  data.claimStatus === option.value 
                    ? "bg-orange-600 hover:bg-orange-700 text-white" 
                    : "hover:bg-orange-50 hover:border-orange-300 dark:hover:bg-orange-950/20"
                }`}
                onClick={() => handleClaimStatusSelect(option.value)}
              >
                {option.label}
              </Button>
            ))}

            {step === 4 && (
              <>
                {PRIMARY_GOAL_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all text-[15px] ${
                      data.primaryGoals.includes(option.value)
                        ? "bg-orange-50 border-orange-500 dark:bg-orange-950/20"
                        : "hover:bg-muted/50 border-muted-foreground/20"
                    }`}
                  >
                    <Checkbox
                      checked={data.primaryGoals.includes(option.value)}
                      onCheckedChange={() => handleGoalToggle(option.value)}
                      className="w-5 h-5"
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
                <Button
                  className="mt-4 py-6 text-base bg-orange-600 hover:bg-orange-700 rounded-xl"
                  onClick={handleComplete}
                  disabled={data.primaryGoals.length === 0}
                >
                  Continue to Chat
                </Button>
              </>
            )}
          </div>
          
          {/* View Sample Button */}
          {onShowSample && step === 1 && (
            <div className="mt-8 pt-6 border-t">
              <Button 
                variant="ghost" 
                className="w-full text-muted-foreground hover:text-foreground py-6"
                onClick={onShowSample}
              >
                <Eye className="w-5 h-5 mr-2" />
                View Sample Conversation
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
