import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { motion } from "framer-motion";

interface Option {
  id: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
}

interface OnboardingQuestionProps {
  question: string;
  description?: string;
  options: Option[];
  selected: string | string[];
  onChange: (value: string | string[]) => void;
  multiSelect?: boolean;
  columns?: 1 | 2 | 3;
}

export function OnboardingQuestion({
  question,
  description,
  options,
  selected,
  onChange,
  multiSelect = false,
  columns = 2,
}: OnboardingQuestionProps) {
  const selectedArray = Array.isArray(selected) ? selected : selected ? [selected] : [];

  const handleSelect = (optionId: string) => {
    if (multiSelect) {
      const newSelected = selectedArray.includes(optionId)
        ? selectedArray.filter((id) => id !== optionId)
        : [...selectedArray, optionId];
      onChange(newSelected);
    } else {
      onChange(optionId);
    }
  };

  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  };

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">{question}</h2>
        {description && (
          <p className="text-muted-foreground">{description}</p>
        )}
        {multiSelect && (
          <p className="text-sm text-primary mt-1">Select all that apply</p>
        )}
      </div>

      <div className={cn("grid gap-3", gridCols[columns])}>
        {options.map((option, index) => {
          const isSelected = selectedArray.includes(option.id);
          return (
            <motion.button
              key={option.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              type="button"
              onClick={() => handleSelect(option.id)}
              className={cn(
                "relative flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all duration-200",
                "hover:border-primary/50 hover:bg-accent/50",
                isSelected
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border bg-card"
              )}
            >
              {/* Checkbox/Radio indicator */}
              <div
                className={cn(
                  "flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                  isSelected
                    ? "border-primary bg-primary"
                    : "border-muted-foreground/30"
                )}
              >
                {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {option.icon && (
                    <span className="text-primary">{option.icon}</span>
                  )}
                  <span className="font-medium">{option.label}</span>
                </div>
                {option.description && (
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {option.description}
                  </p>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
