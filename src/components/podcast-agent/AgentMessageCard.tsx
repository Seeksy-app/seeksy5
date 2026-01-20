import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  Mail, 
  Search, 
  FileText, 
  CheckSquare, 
  Calendar, 
  RefreshCw,
  Check,
  X,
  Edit2,
  Send,
  Sparkles
} from "lucide-react";
import { AgentAction } from "./types";

interface AgentMessageCardProps {
  content: string;
  actions?: AgentAction[];
  isUser?: boolean;
  onApproveAction?: (action: AgentAction, index: number) => void;
  onEditAction?: (action: AgentAction, index: number, newData: any) => void;
  onCancelAction?: (action: AgentAction, index: number) => void;
  isProcessing?: boolean;
}

const actionIcons: Record<string, React.ReactNode> = {
  outreach: <Mail className="h-4 w-4" />,
  research: <Search className="h-4 w-4" />,
  outline: <FileText className="h-4 w-4" />,
  task: <CheckSquare className="h-4 w-4" />,
  schedule: <Calendar className="h-4 w-4" />,
  follow_up: <RefreshCw className="h-4 w-4" />,
  create_meeting_type: <Calendar className="h-4 w-4" />,
};

const actionColors: Record<string, string> = {
  outreach: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  research: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  outline: "bg-green-500/10 text-green-600 border-green-500/20",
  task: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  schedule: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20",
  follow_up: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  create_meeting_type: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
};

export function AgentMessageCard({
  content,
  actions,
  isUser,
  onApproveAction,
  onEditAction,
  onCancelAction,
  isProcessing,
}: AgentMessageCardProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editedContent, setEditedContent] = useState<string>("");

  const handleStartEdit = (action: AgentAction, index: number) => {
    setEditingIndex(index);
    if (action.type === "outreach") {
      setEditedContent(action.data.emailBody || "");
    }
  };

  const handleSaveEdit = (action: AgentAction, index: number) => {
    if (action.type === "outreach") {
      onEditAction?.(action, index, { ...action.data, emailBody: editedContent });
    }
    setEditingIndex(null);
    setEditedContent("");
  };

  if (isUser) {
    return (
      <div className="flex justify-end mb-4">
        <div className="bg-primary text-primary-foreground rounded-2xl rounded-br-md px-4 py-3 max-w-[80%]">
          <p className="text-sm">{content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start mb-4">
      <div className="max-w-[90%] space-y-3">
        {/* Agent response */}
        <div className="flex items-start gap-3">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center flex-shrink-0">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div className="bg-muted/50 rounded-2xl rounded-bl-md px-4 py-3">
            <p className="text-sm whitespace-pre-wrap">{content}</p>
          </div>
        </div>

        {/* Action cards */}
        {actions && actions.length > 0 && (
          <div className="ml-11 space-y-3">
            {actions.map((action, index) => (
              <Card key={index} className={`border ${actionColors[action.type] || "bg-muted"}`}>
                <CardHeader className="py-3 px-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {actionIcons[action.type]}
                      <CardTitle className="text-sm font-medium">{action.title}</CardTitle>
                    </div>
                    <Badge variant="outline" className="text-xs capitalize">
                      {action.type.replace("_", " ")}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="py-2 px-4">
                  <p className="text-sm text-muted-foreground">{action.description}</p>
                  
                  {/* Show email preview for outreach */}
                  {action.type === "outreach" && action.data && (
                    <div className="mt-3 p-3 bg-background rounded-lg border text-sm">
                      <p className="font-medium">To: {action.data.guestEmail}</p>
                      <p className="font-medium">Subject: {action.data.emailSubject}</p>
                      <div className="mt-2 pt-2 border-t">
                        {editingIndex === index ? (
                          <Textarea
                            value={editedContent}
                            onChange={(e) => setEditedContent(e.target.value)}
                            className="min-h-[100px] text-sm"
                          />
                        ) : (
                          <p className="whitespace-pre-wrap text-muted-foreground">
                            {action.data.emailBody}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Show research preview */}
                  {action.type === "research" && action.data?.questions && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">Suggested Questions:</p>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        {action.data.questions.slice(0, 3).map((q: string, i: number) => (
                          <li key={i}>{q}</li>
                        ))}
                        {action.data.questions.length > 3 && (
                          <li className="text-muted-foreground">
                            +{action.data.questions.length - 3} more...
                          </li>
                        )}
                      </ul>
                    </div>
                  )}

                  {/* Show outline preview */}
                  {action.type === "outline" && action.data?.sections && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">Episode Sections:</p>
                      <ul className="text-sm space-y-1">
                        {action.data.sections.slice(0, 4).map((s: any, i: number) => (
                          <li key={i} className="flex items-center gap-2">
                            <span className="text-muted-foreground">{i + 1}.</span>
                            <span>{s.title}</span>
                            {s.duration && (
                              <span className="text-xs text-muted-foreground">
                                ({s.duration} min)
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Show task preview */}
                  {action.type === "task" && action.data && (
                    <div className="mt-2 flex items-center gap-2 text-sm">
                      {action.data.priority && (
                        <Badge variant="outline" className="text-xs">
                          {action.data.priority}
                        </Badge>
                      )}
                      {action.data.dueDate && (
                        <span className="text-muted-foreground text-xs">
                          Due: {new Date(action.data.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  )}
                </CardContent>

                {action.requiresApproval && action.status !== "completed" && (
                  <CardFooter className="py-2 px-4 gap-2 border-t">
                    {editingIndex === index ? (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleSaveEdit(action, index)}
                        >
                          <Check className="h-3 w-3 mr-1" />
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingIndex(null)}
                        >
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          onClick={() => onApproveAction?.(action, index)}
                          disabled={isProcessing}
                        >
                          {action.type === "outreach" ? (
                            <>
                              <Send className="h-3 w-3 mr-1" />
                              Approve & Send
                            </>
                          ) : (
                            <>
                              <Check className="h-3 w-3 mr-1" />
                              Apply
                            </>
                          )}
                        </Button>
                        {action.type === "outreach" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStartEdit(action, index)}
                          >
                            <Edit2 className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onCancelAction?.(action, index)}
                        >
                          <X className="h-3 w-3 mr-1" />
                          Skip
                        </Button>
                      </>
                    )}
                  </CardFooter>
                )}

                {action.status === "completed" && (
                  <CardFooter className="py-2 px-4 border-t">
                    <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                      <Check className="h-3 w-3 mr-1" />
                      Completed
                    </Badge>
                  </CardFooter>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
