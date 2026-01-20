import { Check } from "lucide-react";

interface StepperProps {
  currentStep: number;
  totalSteps: number;
  stepLabel: string;
}

export const CertificationStepper = ({ currentStep, totalSteps, stepLabel }: StepperProps) => {
  return (
    <div className="w-full max-w-4xl mx-auto mb-8">
      {/* Progress Label */}
      <div className="text-center mb-6">
        <p className="text-sm font-medium text-muted-foreground mb-1">
          Step {currentStep} of {totalSteps}
        </p>
        <h2 className="text-2xl md:text-3xl font-bold text-foreground">
          {stepLabel}
        </h2>
      </div>

      {/* Progress Bar */}
      <div className="relative">
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-muted -translate-y-1/2" />
        <div 
          className="absolute top-1/2 left-0 h-0.5 bg-primary -translate-y-1/2 transition-all duration-500"
          style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
        />
        
        <div className="relative flex justify-between">
          {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
            <div
              key={step}
              className={`
                flex items-center justify-center
                w-10 h-10 rounded-full border-2 
                transition-all duration-300
                ${step < currentStep 
                  ? "bg-primary border-primary text-primary-foreground" 
                  : step === currentStep
                  ? "bg-background border-primary text-primary scale-110"
                  : "bg-background border-muted text-muted-foreground"
                }
              `}
            >
              {step < currentStep ? (
                <Check className="h-5 w-5" />
              ) : (
                <span className="text-sm font-semibold">{step}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
