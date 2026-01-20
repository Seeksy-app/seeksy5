import { useState, useEffect } from "react";
import { format } from "date-fns";
import { 
  Sparkles, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  ClipboardList,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  User,
  Pencil,
  Save,
  X,
  Mail,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface ActionItem {
  task: string;
  owner?: string;
  timeline?: string;
  completed?: boolean;
}

interface AgendaRecap {
  item: string;
  summary: string;
}

interface AIMeetingNotesProps {
  meetingId: string;
  aiSummary: string | null;
  aiDecisions: any[] | null;
  aiActionItems: ActionItem[] | null;
  aiAgendaRecap: AgendaRecap[] | null;
  aiRisks: string | null;
  aiNextMeetingPrep: string | null;
  transcript: string | null;
  aiNotesStatus: string | null;
  generatedAt: string | null;
  audioUrl?: string | null;
  isHost?: boolean;
  meetingTitle?: string;
  meetingDate?: string;
  hostName?: string;
  onActionItemToggle?: (index: number, completed: boolean) => void;
  onSummaryUpdated?: () => void;
}

export const AIMeetingNotes: React.FC<AIMeetingNotesProps> = ({
  meetingId,
  aiSummary,
  aiDecisions,
  aiActionItems,
  aiAgendaRecap,
  aiRisks,
  aiNextMeetingPrep,
  transcript,
  aiNotesStatus,
  generatedAt,
  audioUrl,
  isHost = false,
  meetingTitle = "",
  meetingDate = "",
  hostName = "",
  onActionItemToggle,
  onSummaryUpdated,
}) => {
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [localActionItems, setLocalActionItems] = useState<ActionItem[]>(aiActionItems || []);
  const [isEditingSummary, setIsEditingSummary] = useState(false);
  const [editedSummary, setEditedSummary] = useState(aiSummary || "");
  const [isSavingSummary, setIsSavingSummary] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // Sync editedSummary when aiSummary changes
  useEffect(() => {
    setEditedSummary(aiSummary || "");
  }, [aiSummary]);

  // Format transcript with better structure
  const formatTranscript = (text: string) => {
    if (!text) return [];
    const sentences = text.split(/(?<=[.!?])\s+/);
    const paragraphs: { type: 'paragraph', content: string, key: number }[] = [];
    for (let i = 0; i < sentences.length; i += 4) {
      const chunk = sentences.slice(i, i + 4).join(' ').trim();
      if (chunk) {
        paragraphs.push({ type: 'paragraph', content: chunk, key: i });
      }
    }
    return paragraphs;
  };

  const hasAnyNotes = aiSummary || (aiDecisions && aiDecisions.length > 0) || 
    (aiActionItems && aiActionItems.length > 0) || transcript;

  if (!hasAnyNotes || aiNotesStatus === 'none') {
    return null;
  }

  const handleActionItemToggle = (index: number) => {
    const updated = [...localActionItems];
    updated[index] = { ...updated[index], completed: !updated[index].completed };
    setLocalActionItems(updated);
    onActionItemToggle?.(index, updated[index].completed || false);
  };

  const handleSaveSummary = async () => {
    if (!meetingId) return;
    setIsSavingSummary(true);
    try {
      const { error } = await supabase
        .from("board_meeting_notes")
        .update({ ai_summary_draft: editedSummary })
        .eq("id", meetingId);
      
      if (error) throw error;
      
      setIsEditingSummary(false);
      onSummaryUpdated?.();
      toast.success("Executive summary saved");
    } catch (error) {
      console.error("Error saving summary:", error);
      toast.error("Failed to save summary");
    } finally {
      setIsSavingSummary(false);
    }
  };

  const handleNotifyBoard = async () => {
    if (!meetingId) return;
    setIsSendingEmail(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-board-meeting-notes-email", {
        body: {
          meetingId,
          meetingTitle,
          meetingDate,
          executiveSummary: editedSummary || aiSummary,
          hostName,
        },
      });
      
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      
      toast.success(data?.message || "Board members notified");
    } catch (error: any) {
      console.error("Error sending notification:", error);
      toast.error(error.message || "Failed to notify board");
    } finally {
      setIsSendingEmail(false);
    }
  };

  const copyAllNotes = () => {
    let content = "# AI Meeting Notes\n\n";
    
    if (aiSummary) {
      content += "## Executive Summary\n" + aiSummary + "\n\n";
    }
    
    if (aiDecisions && aiDecisions.length > 0) {
      content += "## Decisions\n";
      aiDecisions.forEach((d: any, i) => {
        const text = typeof d === 'string' ? d : (d.statement || d.decision || JSON.stringify(d));
        content += `${i + 1}. ${text}`;
        if (d.owner) content += ` (Owner: ${d.owner})`;
        if (d.status) content += ` [${d.status}]`;
        content += "\n";
      });
      content += "\n";
    }
    
    if (aiRisks) {
      content += "## Risks & Blockers\n" + aiRisks + "\n\n";
    }
    
    if (aiNextMeetingPrep) {
      content += "## Next Meeting Prep\n" + aiNextMeetingPrep + "\n\n";
    }
    
    if (transcript) {
      content += "## Full Transcript\n" + transcript + "\n";
    }

    navigator.clipboard.writeText(content);
    setCopied(true);
    toast.success("Notes copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            AI Meeting Notes
          </CardTitle>
          <div className="flex items-center gap-2">
            {generatedAt && (
              <span className="text-xs text-muted-foreground">
                Generated {format(new Date(generatedAt), "MMM d 'at' h:mm a")}
              </span>
            )}
            {/* Host: Notify Board Button */}
            {isHost && aiSummary && (
              <Button 
                variant="default" 
                size="sm" 
                onClick={handleNotifyBoard}
                disabled={isSendingEmail}
              >
                {isSendingEmail ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <Mail className="w-4 h-4 mr-1" />
                )}
                {isSendingEmail ? "Sending..." : "Notify Board"}
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={copyAllNotes}>
              {copied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
              {copied ? "Copied!" : "Copy All"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">

        {/* Executive Summary - Editable by Host */}
        {aiSummary && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <div className="p-1 rounded bg-blue-500/10">
                  <FileText className="w-4 h-4 text-blue-600" />
                </div>
                Executive Summary
              </h4>
              {isHost && !isEditingSummary && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditingSummary(true)}
                  className="h-7 px-2"
                >
                  <Pencil className="w-3 h-3 mr-1" />
                  Edit
                </Button>
              )}
            </div>
            
            {isEditingSummary ? (
              <div className="space-y-3">
                <Textarea
                  value={editedSummary}
                  onChange={(e) => setEditedSummary(e.target.value)}
                  className="min-h-[150px] text-sm"
                  placeholder="Enter executive summary..."
                />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsEditingSummary(false);
                      setEditedSummary(aiSummary || "");
                    }}
                    disabled={isSavingSummary}
                  >
                    <X className="w-3 h-3 mr-1" />
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveSummary}
                    disabled={isSavingSummary}
                  >
                    {isSavingSummary ? (
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    ) : (
                      <Save className="w-3 h-3 mr-1" />
                    )}
                    {isSavingSummary ? "Saving..." : "Save"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bg-card border rounded-xl p-4 text-sm leading-relaxed">
                {aiSummary.split('\n').map((line, i) => (
                  <p key={i} className={`${line.startsWith('•') || line.startsWith('-') ? 'ml-4 text-muted-foreground' : 'text-foreground'} ${i > 0 ? 'mt-2' : ''}`}>
                    {line}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Decisions */}
        {aiDecisions && aiDecisions.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <div className="p-1 rounded bg-green-500/10">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              </div>
              Decisions Made
              <Badge variant="secondary" className="ml-auto">{aiDecisions.length}</Badge>
            </h4>
            <div className="grid gap-3">
              {aiDecisions.map((decision: any, i) => {
                const text = typeof decision === 'string' ? decision : (decision.statement || decision.decision || '');
                return (
                  <div key={i} className="bg-card border rounded-xl p-4 hover:border-green-500/30 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-500/10 text-green-600 text-xs font-bold flex-shrink-0 mt-0.5">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{text}</p>
                        {(decision.owner || decision.status || decision.notes) && (
                          <div className="flex items-center gap-4 mt-2 text-xs flex-wrap">
                            {decision.owner && (
                              <span className="flex items-center gap-1 text-muted-foreground">
                                <User className="w-3 h-3" />
                                {decision.owner}
                              </span>
                            )}
                            {decision.status && (
                              <Badge variant="outline" className="text-xs">
                                {decision.status}
                              </Badge>
                            )}
                            {decision.notes && (
                              <span className="text-muted-foreground/70 italic">{decision.notes}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Agenda Recap */}
        {aiAgendaRecap && aiAgendaRecap.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <div className="p-1 rounded bg-purple-500/10">
                <ClipboardList className="w-4 h-4 text-purple-600" />
              </div>
              Agenda Item Recap
              <Badge variant="secondary" className="ml-auto">{aiAgendaRecap.length}</Badge>
            </h4>
            <div className="grid gap-3">
              {aiAgendaRecap.map((recap, i) => (
                <div key={i} className="bg-card border rounded-xl p-4">
                  <p className="font-medium text-sm text-foreground">{recap.item}</p>
                  <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{recap.summary}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Risks & Blockers */}
        {aiRisks && (
          <div className="space-y-3">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <div className="p-1 rounded bg-amber-500/10">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
              </div>
              Risks & Blockers
            </h4>
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 text-sm leading-relaxed text-foreground">
              {aiRisks.split('\n').map((line, i) => (
                <p key={i} className={`${line.startsWith('•') || line.startsWith('-') ? 'ml-4 text-amber-700 dark:text-amber-400' : ''} ${i > 0 ? 'mt-2' : ''}`}>
                  {line}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Next Meeting Prep */}
        {aiNextMeetingPrep && (
          <div className="space-y-3">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <div className="p-1 rounded bg-primary/10">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              Next Meeting Prep
            </h4>
            <div className="bg-card border rounded-xl p-4 text-sm leading-relaxed text-muted-foreground">
              {aiNextMeetingPrep.split('\n').map((line, i) => (
                <p key={i} className={i > 0 ? 'mt-2' : ''}>
                  {line}
                </p>
              ))}
            </div>
          </div>
        )}

        <Separator />

        {/* Transcript (Collapsible) */}
        {transcript && (
          <Collapsible open={transcriptOpen} onOpenChange={setTranscriptOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between hover:bg-muted/50">
                <span className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Full Transcript
                </span>
                {transcriptOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 mt-2">
              <ScrollArea className="h-[400px]">
                <div className="bg-muted/30 border rounded-xl p-6 space-y-4">
                  {formatTranscript(transcript).map((paragraph) => (
                    <p 
                      key={paragraph.key} 
                      className="text-sm text-muted-foreground leading-relaxed"
                    >
                      {paragraph.content}
                    </p>
                  ))}
                </div>
              </ScrollArea>
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  );
};
