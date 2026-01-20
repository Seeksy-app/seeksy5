import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Save, FileCheck2 } from 'lucide-react';
import { format } from 'date-fns';

interface SaveProFormaVersionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (name: string, notes?: string) => void;
  isSaving: boolean;
}

export function SaveProFormaVersionModal({
  open,
  onOpenChange,
  onSave,
  isSaving,
}: SaveProFormaVersionModalProps) {
  const defaultName = `Pro Forma — ${format(new Date(), 'MMM d, yyyy h:mm a')}`;
  const [name, setName] = useState(defaultName);
  const [notes, setNotes] = useState('');

  const handleSave = () => {
    onSave(name.trim() || defaultName, notes.trim() || undefined);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
              <FileCheck2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <DialogTitle>Save Pro Forma Version</DialogTitle>
              <DialogDescription>
                This will lock current assumptions and publish to the Board.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="version-name">Version Name</Label>
            <Input
              id="version-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={defaultName}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="version-notes">Notes (optional)</Label>
            <Textarea
              id="version-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Q1 baseline with updated CAC assumptions..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save & Publish'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
