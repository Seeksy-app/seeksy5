import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, CheckCircle2, AlertCircle, Loader2, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ActionItem {
  task: string;
  assignee: string;
  priority: 'high' | 'medium' | 'low';
}

interface MeetingIntelligence {
  summary: string;
  keyTakeaways: string[];
  actionItems: ActionItem[];
  decisions: string[];
}

interface AIMeetingNotesPanelProps {
  meetingId: string;
  isVisible: boolean;
  onClose: () => void;
}

const AIMeetingNotesPanel: React.FC<AIMeetingNotesPanelProps> = ({
  meetingId,
  isVisible,
  onClose
}) => {
  const [intelligence, setIntelligence] = useState<MeetingIntelligence | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [transcript, setTranscript] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (isVisible && meetingId) {
      loadIntelligence();
      subscribeToIntelligence();
    }
  }, [meetingId, isVisible]);

  const loadIntelligence = async () => {
    try {
      const result = await (supabase as any)
        .from('meeting_intelligence')
        .select('*')
        .eq('meeting_id', meetingId)
        .single();

      if (result.error && result.error.code !== 'PGRST116') throw result.error;

      const data = result.data as any;
      if (data) {
        setIntelligence({
          summary: data.summary || '',
          keyTakeaways: data.key_takeaways || [],
          actionItems: (Array.isArray(data.action_items) ? data.action_items as unknown as ActionItem[] : []),
          decisions: data.decisions || []
        });
      }
    } catch (error) {
      console.error('Error loading intelligence:', error);
    }
  };

  const subscribeToIntelligence = () => {
    const channel = supabase
      .channel(`meeting-intelligence-${meetingId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'meeting_intelligence',
          filter: `meeting_id=eq.${meetingId}`
        },
        (payload) => {
          if (payload.new) {
            const data = payload.new as any;
            setIntelligence({
              summary: data.summary || '',
              keyTakeaways: data.key_takeaways || [],
              actionItems: (Array.isArray(data.action_items) ? data.action_items as unknown as ActionItem[] : []),
              decisions: data.decisions || []
            });
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  };

  const processTranscript = async () => {
    if (!transcript.trim()) {
      toast({
        title: "No transcript",
        description: "Please wait for the meeting to generate a transcript",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.functions.invoke('process-meeting-intelligence', {
        body: { meetingId, transcript }
      });

      if (error) throw error;

      toast({
        title: "AI Notes Generated",
        description: "Meeting intelligence has been processed successfully"
      });
    } catch (error) {
      console.error('Error processing transcript:', error);
      toast({
        title: "Error",
        description: "Failed to process meeting transcript",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700 border-red-300';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'low': return 'bg-green-100 text-green-700 border-green-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  if (!isVisible) return null;

  return (
    <Card className="absolute top-4 right-4 w-96 max-h-[80vh] bg-background/95 backdrop-blur shadow-lg border-border z-50">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">AI Meeting Notes</h3>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="h-[calc(80vh-80px)] p-4">
        {!intelligence ? (
          <div className="text-center py-8">
            <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-sm text-muted-foreground mb-4">
              AI notes will appear here as the meeting progresses
            </p>
            <Button
              onClick={processTranscript}
              disabled={isLoading}
              size="sm"
            >
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Generate Notes
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {intelligence.summary && (
              <div>
                <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Summary
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {intelligence.summary}
                </p>
              </div>
            )}

            {intelligence.keyTakeaways.length > 0 && (
              <div>
                <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Key Takeaways
                </h4>
                <ul className="space-y-2">
                  {intelligence.keyTakeaways.map((takeaway, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>{takeaway}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {intelligence.actionItems.length > 0 && (
              <div>
                <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-primary" />
                  Action Items
                </h4>
                <div className="space-y-2">
                  {intelligence.actionItems.map((item, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg border ${getPriorityColor(item.priority)}`}
                    >
                      <p className="font-medium text-sm mb-1">{item.task}</p>
                      <div className="flex items-center gap-2 text-xs">
                        <span>Assignee: {item.assignee}</span>
                        <span>•</span>
                        <span className="capitalize">Priority: {item.priority}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {intelligence.decisions.length > 0 && (
              <div>
                <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Decisions
                </h4>
                <ul className="space-y-2">
                  {intelligence.decisions.map((decision, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>{decision}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </ScrollArea>
    </Card>
  );
};

export default AIMeetingNotesPanel;