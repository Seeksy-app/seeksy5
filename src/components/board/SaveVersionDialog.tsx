import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Save, Loader2 } from 'lucide-react';

interface SaveVersionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: { label: string; summary: string }) => void;
  scenarioLabel: string;
  isSaving: boolean;
}

export function SaveVersionDialog({
  open,
  onOpenChange,
  onSave,
  scenarioLabel,
  isSaving,
}: SaveVersionDialogProps) {
  const [label, setLabel] = useState('');
  const [summary, setSummary] = useState('');

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      const defaultLabel = `${scenarioLabel} – ${new Date().toLocaleDateString()}`;
      setLabel(defaultLabel);
      setSummary('');
    }
  }, [open, scenarioLabel]);

  const handleSave = () => {
    onSave({ label, summary });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="w-5 h-5 text-blue-600" />
            Save Pro Forma Version
          </DialogTitle>
          <DialogDescription>
            Save this forecast as a named version for future reference.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="version-label">Version Name</Label>
            <Input
              id="version-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g., Base – March 2025"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="version-summary">Summary (optional)</Label>
            <Textarea
              id="version-summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Key highlights or notes about this forecast..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!label.trim() || isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Version
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
