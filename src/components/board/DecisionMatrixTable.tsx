import { useState, useCallback, useEffect } from "react";
import { Plus, Trash2, Check, AlertCircle, Clock, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BoardDecision, DecisionStatus, useBoardDecisions, CreateDecisionInput, UpdateDecisionInput } from "@/hooks/useBoardDecisions";
import { useDebounce } from "@/hooks/use-debounce";

interface DecisionMatrixTableProps {
  meetingId: string;
  isHost: boolean;
  isCompleted: boolean;
  meetingStatus: string;
}

const statusConfig: Record<DecisionStatus, { label: string; color: string; icon: React.ReactNode }> = {
  open: { label: "Open", color: "bg-blue-100 text-blue-800 border-blue-200", icon: <Clock className="w-3 h-3" /> },
  needs_followup: { label: "Needs Follow-up", color: "bg-amber-100 text-amber-800 border-amber-200", icon: <AlertCircle className="w-3 h-3" /> },
  final: { label: "Final", color: "bg-green-100 text-green-800 border-green-200", icon: <Check className="w-3 h-3" /> },
  deferred: { label: "Deferred", color: "bg-muted text-muted-foreground border-muted", icon: <X className="w-3 h-3" /> },
};

interface EditableRow {
  id: string;
  topic: string;
  option_summary: string;
  upside: string;
  risk: string;
  decision: string;
  status: DecisionStatus;
  owner_name: string;
  due_date: string;
}

export function DecisionMatrixTable({ meetingId, isHost, isCompleted, meetingStatus }: DecisionMatrixTableProps) {
  const { decisions, isLoading, createDecision, updateDecision, deleteDecision } = useBoardDecisions(meetingId);
  const [editedRows, setEditedRows] = useState<Record<string, EditableRow>>({});
  const [newTopic, setNewTopic] = useState("");

  // Initialize edited rows from decisions
  useEffect(() => {
    const rows: Record<string, EditableRow> = {};
    decisions.forEach(d => {
      if (!editedRows[d.id]) {
        rows[d.id] = {
          id: d.id,
          topic: d.topic,
          option_summary: d.option_summary || "",
          upside: d.upside || "",
          risk: d.risk || "",
          decision: d.decision || "",
          status: d.status || 'open',
          owner_name: d.owner_name || "",
          due_date: d.due_date || "",
        };
      }
    });
    if (Object.keys(rows).length > 0) {
      setEditedRows(prev => ({ ...prev, ...rows }));
    }
  }, [decisions]);

  const debouncedSave = useDebounce((id: string, field: string, value: string) => {
    updateDecision.mutate({ id, [field]: value } as UpdateDecisionInput);
  }, 500);

  const handleFieldChange = useCallback((id: string, field: keyof EditableRow, value: string) => {
    setEditedRows(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));
    
    // Auto-save on change (debounced)
    if (field !== 'id') {
      debouncedSave(id, field, value);
    }
  }, [debouncedSave]);

  const handleStatusChange = useCallback((id: string, status: DecisionStatus) => {
    setEditedRows(prev => ({
      ...prev,
      [id]: { ...prev[id], status },
    }));
    updateDecision.mutate({ id, status });
  }, [updateDecision]);

  const handleAddDecision = useCallback(() => {
    if (!newTopic.trim()) return;
    const input: CreateDecisionInput = {
      meeting_id: meetingId,
      topic: newTopic.trim(),
    };
    createDecision.mutate(input);
    setNewTopic("");
  }, [meetingId, newTopic, createDecision]);

  const handleDelete = useCallback((id: string) => {
    deleteDecision.mutate(id);
    setEditedRows(prev => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });
  }, [deleteDecision]);

  // Members can add agenda items + pre-meeting questions before start only
  const canAddDecisions = isHost || meetingStatus === 'upcoming';
  const canEditDecisions = isHost && !isCompleted;
  const canEditStatus = isHost && !isCompleted;

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading decisions...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[140px]">Topic</TableHead>
              <TableHead className="w-[120px]">Option</TableHead>
              <TableHead className="w-[140px]">Upside</TableHead>
              <TableHead className="w-[140px]">Risk</TableHead>
              <TableHead className="w-[160px]">Decision</TableHead>
              <TableHead className="w-[130px]">Status</TableHead>
              <TableHead className="w-[100px]">Owner</TableHead>
              <TableHead className="w-[110px]">Due Date</TableHead>
              {isHost && !isCompleted && <TableHead className="w-[50px]"></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {decisions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isHost && !isCompleted ? 9 : 8} className="text-center text-muted-foreground py-8">
                  No decisions recorded for this meeting.
                </TableCell>
              </TableRow>
            ) : (
              decisions.map((decision) => {
                const row = editedRows[decision.id] || {
                  id: decision.id,
                  topic: decision.topic,
                  option_summary: decision.option_summary || "",
                  upside: decision.upside || "",
                  risk: decision.risk || "",
                  decision: decision.decision || "",
                  status: decision.status,
                  owner_name: decision.owner_name || "",
                  due_date: decision.due_date || "",
                };
                const isFinalOrDeferred = row.status === 'final' || row.status === 'deferred';
                const isEditable = canEditDecisions && !isFinalOrDeferred;
                const statusInfo = statusConfig[row.status];
                const isUnresolved = row.status === 'open' || row.status === 'needs_followup' || !row.decision?.trim();

                return (
                  <TableRow 
                    key={decision.id} 
                    className={isUnresolved && !isCompleted ? "bg-amber-50/50" : ""}
                  >
                    <TableCell>
                      {isEditable ? (
                        <Input
                          value={row.topic}
                          onChange={(e) => handleFieldChange(decision.id, 'topic', e.target.value)}
                          className="h-8 text-sm"
                        />
                      ) : (
                        <span className="text-sm font-medium">{row.topic}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditable ? (
                        <Input
                          value={row.option_summary}
                          onChange={(e) => handleFieldChange(decision.id, 'option_summary', e.target.value)}
                          placeholder="A vs B..."
                          className="h-8 text-sm"
                        />
                      ) : (
                        <span className="text-sm text-muted-foreground">{row.option_summary || "—"}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditable ? (
                        <Input
                          value={row.upside}
                          onChange={(e) => handleFieldChange(decision.id, 'upside', e.target.value)}
                          placeholder="Benefits..."
                          className="h-8 text-sm"
                        />
                      ) : (
                        <span className="text-sm text-muted-foreground">{row.upside || "—"}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditable ? (
                        <Input
                          value={row.risk}
                          onChange={(e) => handleFieldChange(decision.id, 'risk', e.target.value)}
                          placeholder="Risks..."
                          className="h-8 text-sm"
                        />
                      ) : (
                        <span className="text-sm text-muted-foreground">{row.risk || "—"}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditable ? (
                        <Input
                          value={row.decision}
                          onChange={(e) => handleFieldChange(decision.id, 'decision', e.target.value)}
                          placeholder="Enter decision..."
                          className={`h-8 text-sm ${!row.decision?.trim() ? 'border-amber-400 focus:border-amber-500' : ''}`}
                        />
                      ) : (
                        <span className="text-sm">{row.decision || "—"}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {canEditStatus ? (
                        <Select
                          value={row.status}
                          onValueChange={(value) => handleStatusChange(decision.id, value as DecisionStatus)}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="open">
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" /> Open
                              </div>
                            </SelectItem>
                            <SelectItem value="needs_followup">
                              <div className="flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" /> Needs Follow-up
                              </div>
                            </SelectItem>
                            <SelectItem value="final">
                              <div className="flex items-center gap-1">
                                <Check className="w-3 h-3" /> Final
                              </div>
                            </SelectItem>
                            <SelectItem value="deferred">
                              <div className="flex items-center gap-1">
                                <X className="w-3 h-3" /> Deferred
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge variant="outline" className={`text-xs ${statusInfo.color}`}>
                          {statusInfo.icon}
                          <span className="ml-1">{statusInfo.label}</span>
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditable ? (
                        <Input
                          value={row.owner_name}
                          onChange={(e) => handleFieldChange(decision.id, 'owner_name', e.target.value)}
                          placeholder="Owner"
                          className="h-8 text-sm"
                        />
                      ) : (
                        <span className="text-sm text-muted-foreground">{row.owner_name || "—"}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditable ? (
                        <Input
                          type="date"
                          value={row.due_date}
                          onChange={(e) => handleFieldChange(decision.id, 'due_date', e.target.value)}
                          className="h-8 text-sm"
                        />
                      ) : (
                        <span className="text-sm text-muted-foreground">{row.due_date || "—"}</span>
                      )}
                    </TableCell>
                    {isHost && !isCompleted && (
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDelete(decision.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add new decision row */}
      {canAddDecisions && !isCompleted && (
        <div className="flex gap-2 pt-2 border-t">
          <Input
            placeholder="Add decision topic..."
            value={newTopic}
            onChange={(e) => setNewTopic(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddDecision()}
            className="flex-1"
          />
          <Button size="sm" onClick={handleAddDecision} disabled={!newTopic.trim() || createDecision.isPending}>
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </div>
      )}
    </div>
  );
}
