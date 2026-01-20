import { Progress } from "@/components/ui/progress";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PasswordStrengthIndicatorProps {
  password: string;
}

interface PasswordRequirement {
  label: string;
  test: (password: string) => boolean;
}

const requirements: PasswordRequirement[] = [
  {
    label: "At least 10 characters",
    test: (pwd) => pwd.length >= 10,
  },
  {
    label: "Contains uppercase letter",
    test: (pwd) => /[A-Z]/.test(pwd),
  },
  {
    label: "Contains lowercase letter",
    test: (pwd) => /[a-z]/.test(pwd),
  },
  {
    label: "Contains number",
    test: (pwd) => /[0-9]/.test(pwd),
  },
  {
    label: "Contains special character (!@#$%^&*...)",
    test: (pwd) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(pwd),
  },
];

export function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  if (!password) return null;

  const metRequirements = requirements.filter((req) => req.test(password));
  const strength = (metRequirements.length / requirements.length) * 100;

  const getStrengthColor = () => {
    if (strength < 40) return "bg-red-500";
    if (strength < 60) return "bg-orange-500";
    if (strength < 80) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getStrengthLabel = () => {
    if (strength < 40) return "Weak";
    if (strength < 60) return "Fair";
    if (strength < 80) return "Good";
    return "Strong";
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Password Strength</span>
          <span className={cn(
            "font-medium",
            strength < 40 && "text-red-500",
            strength >= 40 && strength < 60 && "text-orange-500",
            strength >= 60 && strength < 80 && "text-yellow-500",
            strength >= 80 && "text-green-500"
          )}>
            {getStrengthLabel()}
          </span>
        </div>
        <Progress value={strength} className="h-2">
          <div className={cn("h-full transition-all", getStrengthColor())} style={{ width: `${strength}%` }} />
        </Progress>
      </div>

      <div className="space-y-1.5">
        {requirements.map((req, index) => {
          const isMet = req.test(password);
          return (
            <div
              key={index}
              className={cn(
                "flex items-center gap-2 text-xs transition-colors",
                isMet ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
              )}
            >
              {isMet ? (
                <Check className="h-3.5 w-3.5 shrink-0" />
              ) : (
                <X className="h-3.5 w-3.5 shrink-0" />
              )}
              <span>{req.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
