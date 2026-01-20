import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Calculator, Save, Loader2 } from 'lucide-react';
import { useCFONotes } from '@/hooks/useCFONotes';

interface CFONotesCardProps {
  pageKey: string;
  readOnly?: boolean;
}

export function CFONotesCard({ pageKey, readOnly = false }: CFONotesCardProps) {
  const { notes, setNotes, loading, saving, saveNotes } = useCFONotes(pageKey);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="w-5 h-5" />
          CFO Notes
        </CardTitle>
        <CardDescription>
          {readOnly 
            ? 'Context and commentary from the CFO' 
            : 'Add notes about financial performance, assumptions, or key considerations for the board'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {readOnly ? (
          <div className="min-h-[100px] p-3 bg-muted/50 rounded-md text-sm whitespace-pre-wrap">
            {notes || <span className="text-muted-foreground italic">No notes added yet</span>}
          </div>
        ) : (
          <>
            <Textarea
              placeholder="Add notes about financial performance, assumptions, or key considerations for the board..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[100px]"
            />
            <Button 
              onClick={() => saveNotes(notes)} 
              disabled={saving}
              size="sm"
              className="gap-2"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Notes
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
