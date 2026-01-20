import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";

interface MeetingNotesEditorProps {
  initialAgenda?: string[];
  initialMemo?: {
    purpose?: string;
    current_state?: string[];
    key_questions?: string[];
    objective?: string;
  };
  onSave: (data: { agenda: string[]; memo: any }) => void;
  onCancel: () => void;
}

export function MeetingNotesEditor({ initialAgenda = [], initialMemo, onSave, onCancel }: MeetingNotesEditorProps) {
  const [agenda, setAgenda] = useState<string[]>(initialAgenda.length > 0 ? initialAgenda : [""]);
  const [memo, setMemo] = useState({
    purpose: initialMemo?.purpose || "",
    current_state: initialMemo?.current_state || [""],
    key_questions: initialMemo?.key_questions || [""],
    objective: initialMemo?.objective || "",
  });

  const addAgendaItem = () => setAgenda([...agenda, ""]);
  const removeAgendaItem = (index: number) => setAgenda(agenda.filter((_, i) => i !== index));
  const updateAgendaItem = (index: number, value: string) => {
    const updated = [...agenda];
    updated[index] = value;
    setAgenda(updated);
  };

  const addCurrentStateItem = () => setMemo({ ...memo, current_state: [...memo.current_state, ""] });
  const removeCurrentStateItem = (index: number) => {
    setMemo({ ...memo, current_state: memo.current_state.filter((_, i) => i !== index) });
  };
  const updateCurrentStateItem = (index: number, value: string) => {
    const updated = [...memo.current_state];
    updated[index] = value;
    setMemo({ ...memo, current_state: updated });
  };

  const addKeyQuestion = () => setMemo({ ...memo, key_questions: [...memo.key_questions, ""] });
  const removeKeyQuestion = (index: number) => {
    setMemo({ ...memo, key_questions: memo.key_questions.filter((_, i) => i !== index) });
  };
  const updateKeyQuestion = (index: number, value: string) => {
    const updated = [...memo.key_questions];
    updated[index] = value;
    setMemo({ ...memo, key_questions: updated });
  };

  const handleSave = () => {
    onSave({
      agenda: agenda.filter(a => a.trim() !== ""),
      memo: {
        purpose: memo.purpose,
        current_state: memo.current_state.filter(s => s.trim() !== ""),
        key_questions: memo.key_questions.filter(q => q.trim() !== ""),
        objective: memo.objective,
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Agenda */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Agenda Items</Label>
        {agenda.map((item, index) => (
          <div key={index} className="flex gap-2">
            <span className="text-sm text-muted-foreground w-6 pt-2">{index + 1}.</span>
            <Input
              value={item}
              onChange={(e) => updateAgendaItem(index, e.target.value)}
              placeholder="Agenda item..."
              className="flex-1"
            />
            {agenda.length > 1 && (
              <Button variant="ghost" size="icon" onClick={() => removeAgendaItem(index)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={addAgendaItem}>
          <Plus className="w-4 h-4 mr-2" />
          Add Item
        </Button>
      </div>

      {/* Memo Purpose */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Memo: Purpose</Label>
        <Textarea
          value={memo.purpose}
          onChange={(e) => setMemo({ ...memo, purpose: e.target.value })}
          placeholder="Meeting purpose..."
          rows={2}
        />
      </div>

      {/* Current State */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Memo: Current State</Label>
        {memo.current_state.map((item, index) => (
          <div key={index} className="flex gap-2">
            <Textarea
              value={item}
              onChange={(e) => updateCurrentStateItem(index, e.target.value)}
              placeholder="Current state item..."
              rows={2}
              className="flex-1"
            />
            {memo.current_state.length > 1 && (
              <Button variant="ghost" size="icon" onClick={() => removeCurrentStateItem(index)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={addCurrentStateItem}>
          <Plus className="w-4 h-4 mr-2" />
          Add State
        </Button>
      </div>

      {/* Key Questions */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Memo: Key Questions</Label>
        {memo.key_questions.map((item, index) => (
          <div key={index} className="flex gap-2">
            <Input
              value={item}
              onChange={(e) => updateKeyQuestion(index, e.target.value)}
              placeholder="Key question..."
              className="flex-1"
            />
            {memo.key_questions.length > 1 && (
              <Button variant="ghost" size="icon" onClick={() => removeKeyQuestion(index)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={addKeyQuestion}>
          <Plus className="w-4 h-4 mr-2" />
          Add Question
        </Button>
      </div>

      {/* Objective */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Memo: Objective</Label>
        <Textarea
          value={memo.objective}
          onChange={(e) => setMemo({ ...memo, objective: e.target.value })}
          placeholder="Meeting objective..."
          rows={2}
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={handleSave}>Save</Button>
      </div>
    </div>
  );
}