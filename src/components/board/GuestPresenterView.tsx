import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Presentation, 
  ListChecks, 
  Table2, 
  Sparkles, 
  HelpCircle, 
  FileText,
  Eye,
  EyeOff,
  Loader2,
  LayoutDashboard,
  Briefcase,
  Target,
  TrendingUp,
  PlayCircle,
  FolderOpen,
} from "lucide-react";
import { PresenterSection, PresenterState, MeetingSection, isBoardPortalRoute, getBoardPortalPath } from "@/hooks/usePresenterMode";

// Only meeting sections need icons/labels here - Board Portal routes navigate away
const sectionIcons: Record<MeetingSection, React.ReactNode> = {
  'video-only': <Eye className="h-5 w-5" />,
  'agenda': <ListChecks className="h-5 w-5" />,
  'decisions': <Table2 className="h-5 w-5" />,
  'ai-notes': <Sparkles className="h-5 w-5" />,
  'questions': <HelpCircle className="h-5 w-5" />,
  'summary': <FileText className="h-5 w-5" />,
};

const sectionLabels: Record<MeetingSection, string> = {
  'video-only': 'Video Only',
  'agenda': 'Meeting Agenda',
  'decisions': 'Decision Matrix',
  'ai-notes': 'AI Meeting Notes',
  'questions': 'Member Questions',
  'summary': 'Meeting Summary',
};

const boardPortalLabels: Record<string, string> = {
  'board-dashboard': 'Board Dashboard',
  'board-business-model': 'Business Model',
  'board-gtm': 'GTM Strategy',
  'board-forecasts': '3-Year Forecasts',
  'board-videos': 'Videos',
  'board-docs': 'Documents',
};

interface GuestPresenterViewProps {
  meetingId: string;
  presenterState: PresenterState;
  isFollowing: boolean;
  onToggleFollowing: () => void;
}

interface MeetingData {
  title: string;
  agenda_items: Array<{ text: string; checked: boolean }>;
  decision_table: Array<{
    Topic: string;
    Option: string;
    Upside: string;
    Risk: string;
    Decision: string;
  }>;
  member_questions: Array<{
    id: string;
    author: string;
    text: string;
    created_at: string;
  }>;
  ai_summary_draft: string | null;
  decisions_summary: string | null;
}

export function GuestPresenterView({
  meetingId,
  presenterState,
  isFollowing,
  onToggleFollowing,
}: GuestPresenterViewProps) {
  const navigate = useNavigate();
  const [meetingData, setMeetingData] = useState<MeetingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Navigate to Board Portal routes when host presents them
  useEffect(() => {
    if (!isFollowing || !presenterState.isPresenting) return;
    
    if (isBoardPortalRoute(presenterState.currentSection)) {
      const path = getBoardPortalPath(presenterState.currentSection);
      console.log("[GuestPresenterView] Navigating to Board Portal:", path);
      navigate(path);
    }
  }, [presenterState.currentSection, presenterState.isPresenting, isFollowing, navigate]);

  // Fetch meeting data
  useEffect(() => {
    if (!meetingId) return;

    const fetchMeetingData = async () => {
      setIsLoading(true);
      const result = await (supabase as any)
        .from("board_meeting_notes")
        .select("title, agenda_items, decision_table, member_questions, ai_summary_draft, decisions_summary")
        .eq("id", meetingId)
        .single();

      if (result.error) {
        console.error("Error fetching meeting data:", result.error);
      } else {
        setMeetingData(result.data as MeetingData);
      }
      setIsLoading(false);
    };

    fetchMeetingData();

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`meeting-data:${meetingId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'board_meeting_notes',
          filter: `id=eq.${meetingId}`,
        },
        (payload) => {
          console.log("[GuestPresenterView] Meeting data updated:", payload);
          setMeetingData(payload.new as MeetingData);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [meetingId]);

  // Don't show anything if not presenting or video-only mode
  if (!presenterState.isPresenting || presenterState.currentSection === 'video-only') {
    return null;
  }

  if (isLoading) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </CardContent>
      </Card>
    );
  }

  const renderContent = () => {
    if (!meetingData) return <p className="text-slate-400">No meeting data available</p>;

    switch (presenterState.currentSection) {
      case 'agenda':
        return (
          <div className="space-y-2">
            {meetingData.agenda_items?.length > 0 ? (
              meetingData.agenda_items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 p-2 rounded bg-slate-700/50">
                  <Checkbox checked={item.checked} disabled className="pointer-events-none" />
                  <span className={item.checked ? "line-through text-slate-500" : "text-slate-200"}>
                    {item.text}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-slate-400 text-sm">No agenda items</p>
            )}
          </div>
        );

      case 'decisions':
        return (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-600">
                  <th className="text-left p-2 text-slate-400">Topic</th>
                  <th className="text-left p-2 text-slate-400">Option</th>
                  <th className="text-left p-2 text-slate-400">Decision</th>
                </tr>
              </thead>
              <tbody>
                {meetingData.decision_table?.length > 0 ? (
                  meetingData.decision_table.map((row, idx) => (
                    <tr key={idx} className="border-b border-slate-700">
                      <td className="p-2 text-slate-200">{row.Topic}</td>
                      <td className="p-2 text-slate-300">{row.Option}</td>
                      <td className="p-2 text-slate-200 font-medium">{row.Decision || "—"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="p-4 text-center text-slate-400">
                      No decisions recorded for this meeting.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        );

      case 'ai-notes':
        return (
          <div className="prose prose-invert prose-sm max-w-none">
            {meetingData.ai_summary_draft ? (
              <div className="whitespace-pre-wrap text-slate-300">
                {meetingData.ai_summary_draft}
              </div>
            ) : (
              <p className="text-slate-400">AI notes will appear here during the meeting.</p>
            )}
          </div>
        );

      case 'questions':
        return (
          <div className="space-y-3">
            {meetingData.member_questions?.length > 0 ? (
              meetingData.member_questions.map((q) => (
                <div key={q.id} className="p-3 rounded bg-slate-700/50">
                  <p className="text-slate-200">{q.text}</p>
                  <p className="text-xs text-slate-500 mt-1">— {q.author}</p>
                </div>
              ))
            ) : (
              <p className="text-slate-400 text-sm">No questions submitted</p>
            )}
          </div>
        );

      case 'summary':
        return (
          <div className="prose prose-invert prose-sm max-w-none">
            {meetingData.decisions_summary ? (
              <div className="whitespace-pre-wrap text-slate-300">
                {meetingData.decisions_summary}
              </div>
            ) : (
              <p className="text-slate-400">Meeting summary will be generated after the meeting.</p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-primary/20 text-primary gap-1">
              <Presentation className="h-3 w-3" />
              {presenterState.hostName} is presenting
            </Badge>
            <div className="flex items-center gap-1 text-slate-400">
              {sectionIcons[presenterState.currentSection]}
              <span className="text-sm">{sectionLabels[presenterState.currentSection]}</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleFollowing}
            className="text-slate-400 hover:text-slate-200"
          >
            {isFollowing ? (
              <>
                <Eye className="h-4 w-4 mr-1" />
                Following
              </>
            ) : (
              <>
                <EyeOff className="h-4 w-4 mr-1" />
                Not Following
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px]">
          {renderContent()}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
