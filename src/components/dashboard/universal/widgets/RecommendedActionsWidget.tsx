import { useNavigate } from "react-router-dom";
import { ChevronRight, CheckCircle2, Circle } from "lucide-react";

interface Action {
  id: string;
  text: string;
  path: string;
  completed: boolean;
}

interface Props {
  completedSteps?: string[];
}

export function RecommendedActionsWidget({ completedSteps = [] }: Props) {
  const navigate = useNavigate();

  const actions: Action[] = [
    { id: "email-tracking", text: "Add Email Tracking + Signature", path: "/signatures", completed: completedSteps.includes("email-tracking") },
    { id: "studio-setup", text: "Finish completing your Studio Setup", path: "/studio", completed: completedSteps.includes("studio-setup") },
    { id: "first-episode", text: "Upload your first podcast episode", path: "/podcasts", completed: completedSteps.includes("first-episode") },
    { id: "connect-youtube", text: "Connect YouTube for publishing", path: "/social-hub", completed: completedSteps.includes("connect-youtube") },
    { id: "identity-verify", text: "Verify your identity for monetization", path: "/identity", completed: completedSteps.includes("identity-verify") },
  ];

  const incompleteActions = actions.filter(a => !a.completed);

  if (incompleteActions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-6 text-center">
        <CheckCircle2 className="h-10 w-10 text-emerald-500 mb-3" />
        <p className="text-sm text-foreground font-medium">All caught up!</p>
        <p className="text-xs text-muted-foreground">You've completed all recommended actions.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {incompleteActions.slice(0, 4).map((action) => (
        <div
          key={action.id}
          className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group"
          onClick={() => navigate(action.path)}
        >
          <Circle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <span className="flex-1 text-sm text-foreground">{action.text}</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      ))}
    </div>
  );
}
