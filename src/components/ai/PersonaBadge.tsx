import { Badge } from "@/components/ui/badge";
import { EMAIL_PERSONAS } from "@/lib/email-personas";

interface PersonaBadgeProps {
  persona: keyof typeof EMAIL_PERSONAS;
  showIcon?: boolean;
}

export const PersonaBadge = ({ persona, showIcon = true }: PersonaBadgeProps) => {
  const personaData = EMAIL_PERSONAS[persona];
  if (!personaData) return null;

  const Icon = personaData.icon;

  return (
    <Badge variant="secondary" className={`gap-1.5 ${personaData.color}`}>
      {showIcon && <Icon className="h-3 w-3" />}
      {personaData.name}
    </Badge>
  );
};
