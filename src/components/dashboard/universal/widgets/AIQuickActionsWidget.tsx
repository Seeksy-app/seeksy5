import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Scissors, Wand2, Mic, Sparkles } from "lucide-react";

export function AIQuickActionsWidget() {
  const navigate = useNavigate();

  const actions = [
    { label: "Generate Clips", icon: Scissors, path: "/clips-studio", available: true },
    { label: "Clean My Audio", icon: Wand2, path: "/studio/ai-production", available: true },
    { label: "Create Podcast Episode", icon: Mic, path: "/podcasts/create", available: true },
    { label: "AI Transcription", icon: Sparkles, path: "/transcripts", available: false, comingSoon: true },
  ];

  return (
    <div className="space-y-2">
      {actions.map((action) => (
        <Button
          key={action.label}
          variant="ghost"
          className="w-full justify-start h-auto py-3 px-3"
          onClick={() => action.available && navigate(action.path)}
          disabled={!action.available}
        >
          <action.icon className="h-4 w-4 mr-3 text-primary" />
          <span className="flex-1 text-left text-sm">{action.label}</span>
          {action.comingSoon && (
            <Badge variant="secondary" className="text-[10px] px-1.5">Coming Soon</Badge>
          )}
        </Button>
      ))}
    </div>
  );
}
