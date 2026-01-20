import { Check, X } from "lucide-react";

interface PasswordValidationProps {
  password: string;
  confirmPassword?: string;
}

interface ValidationRule {
  label: string;
  isValid: boolean;
}

export function PasswordValidation({ password, confirmPassword }: PasswordValidationProps) {
  const rules: ValidationRule[] = [
    {
      label: "At least 8 characters",
      isValid: password.length >= 8,
    },
    {
      label: "Contains uppercase letter",
      isValid: /[A-Z]/.test(password),
    },
    {
      label: "Contains lowercase letter",
      isValid: /[a-z]/.test(password),
    },
    {
      label: "Contains number",
      isValid: /\d/.test(password),
    },
    {
      label: "Contains special character (!@#$%^&*)",
      isValid: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    },
  ];

  if (confirmPassword !== undefined) {
    rules.push({
      label: "Passwords match",
      isValid: password === confirmPassword && password.length > 0,
    });
  }

  return (
    <div className="space-y-2 text-sm">
      <p className="font-medium text-muted-foreground">Password requirements:</p>
      <div className="space-y-1">
        {rules.map((rule, index) => (
          <div
            key={index}
            className={`flex items-center gap-2 transition-colors ${
              rule.isValid ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
            }`}
          >
            {rule.isValid ? (
              <Check className="h-4 w-4" />
            ) : (
              <X className="h-4 w-4" />
            )}
            <span>{rule.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
