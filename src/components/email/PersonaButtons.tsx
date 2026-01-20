import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { EMAIL_PERSONAS } from "@/lib/email-personas";

interface PersonaButtonsProps {
  context: string;
  onAsk: (persona: string, context: string) => void;
}

export const PersonaButtons = ({ context, onAsk }: PersonaButtonsProps) => {
  const relevantPersonas = getRelevantPersonas(context);

  return (
    <div className="flex flex-wrap gap-2">
      {relevantPersonas.map((personaKey) => {
        const persona = EMAIL_PERSONAS[personaKey as keyof typeof EMAIL_PERSONAS];
        if (!persona) return null;

        const Icon = persona.icon;

        return (
          <Button
            key={personaKey}
            variant="outline"
            size="sm"
            onClick={() => onAsk(personaKey, context)}
            className="gap-2"
          >
            <Icon className="h-4 w-4" />
            Ask {persona.name}
          </Button>
        );
      })}
    </div>
  );
};

function getRelevantPersonas(context: string): string[] {
  const contextLower = context.toLowerCase();

  if (contextLower.includes("meeting") || contextLower.includes("event")) {
    return ["Mia"];
  }
  if (contextLower.includes("podcast") || contextLower.includes("episode")) {
    return ["Castor", "Scribe"];
  }
  if (contextLower.includes("studio") || contextLower.includes("recording")) {
    return ["Echo", "Scribe"];
  }
  if (contextLower.includes("identity") || contextLower.includes("certificate")) {
    return ["Lex"];
  }
  if (contextLower.includes("email") || contextLower.includes("campaign")) {
    return ["Scribe"];
  }
  if (contextLower.includes("clip") || contextLower.includes("media")) {
    return ["Reel"];
  }
  if (contextLower.includes("analytics") || contextLower.includes("data")) {
    return ["Atlas"];
  }

  return ["Scribe"]; // Default to Scribe for general communication
}
