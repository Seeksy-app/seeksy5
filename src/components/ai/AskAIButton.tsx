import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { EMAIL_PERSONAS } from "@/lib/email-personas";

interface AskAIButtonProps {
  persona: keyof typeof EMAIL_PERSONAS;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  onClick: () => void;
  children?: React.ReactNode;
}

export const AskAIButton = ({
  persona,
  variant = "outline",
  size = "sm",
  onClick,
  children,
}: AskAIButtonProps) => {
  const personaData = EMAIL_PERSONAS[persona];
  const Icon = personaData.icon;

  return (
    <Button variant={variant} size={size} onClick={onClick} className="gap-2">
      <Sparkles className="h-4 w-4" />
      {children || `Ask ${personaData.name}`}
    </Button>
  );
};
