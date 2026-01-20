import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  UserPlus, 
  Search, 
  FileText, 
  Calendar, 
  CheckCircle2,
  Circle,
  Loader2
} from "lucide-react";
import { EpisodeWorkspace } from "./types";

interface EpisodeProgressPanelProps {
  workspace?: EpisodeWorkspace | null;
  pendingTasks?: number;
  isLoading?: boolean;
}

const progressSteps = [
  { key: "guestInvited", label: "Guest Invited", icon: UserPlus },
  { key: "researchComplete", label: "Research Complete", icon: Search },
  { key: "outlineComplete", label: "Outline Built", icon: FileText },
  { key: "recordingScheduled", label: "Recording Scheduled", icon: Calendar },
];

export function EpisodeProgressPanel({ 
  workspace, 
  pendingTasks = 0,
  isLoading 
}: EpisodeProgressPanelProps) {
  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Episode Progress</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!workspace) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Episode Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Start a conversation to create an episode workspace
          </p>
        </CardContent>
      </Card>
    );
  }

  const completedSteps = progressSteps.filter(
    (step) => workspace[step.key as keyof EpisodeWorkspace]
  ).length;
  const progressPercent = (completedSteps / progressSteps.length) * 100;

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Episode Progress</CardTitle>
          <Badge variant="outline" className="text-xs capitalize">
            {workspace.status.replace("_", " ")}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Episode Title */}
        <div>
          <h3 className="font-medium text-sm">{workspace.title}</h3>
          {workspace.topic && (
            <p className="text-xs text-muted-foreground mt-1">{workspace.topic}</p>
          )}
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{Math.round(progressPercent)}%</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        {/* Checklist */}
        <div className="space-y-3">
          {progressSteps.map((step) => {
            const isComplete = workspace[step.key as keyof EpisodeWorkspace];
            const Icon = step.icon;
            
            return (
              <div 
                key={step.key}
                className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                  isComplete 
                    ? "bg-green-500/10 text-green-700" 
                    : "bg-muted/50 text-muted-foreground"
                }`}
              >
                <div className={`p-1.5 rounded-full ${
                  isComplete ? "bg-green-500/20" : "bg-muted"
                }`}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <span className="text-sm flex-1">{step.label}</span>
                {isComplete ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <Circle className="h-4 w-4" />
                )}
              </div>
            );
          })}
        </div>

        {/* Pending Tasks */}
        {pendingTasks > 0 && (
          <div className="pt-3 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Pending Tasks</span>
              <Badge variant="secondary">{pendingTasks}</Badge>
            </div>
          </div>
        )}

        {/* Scheduled Date */}
        {workspace.scheduledDate && (
          <div className="pt-3 border-t">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>
                {new Date(workspace.scheduledDate).toLocaleDateString(undefined, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
