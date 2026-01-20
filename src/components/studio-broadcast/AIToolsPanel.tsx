import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Mic, Scissors, FileText, Volume2, Wand2, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface Transcription {
  id: string;
  timestamp_seconds: number;
  speaker_id?: string;
  text: string;
  is_key_moment: boolean;
  is_chapter_start: boolean;
  chapter_title?: string;
}

interface ClipSuggestion {
  id: string;
  start_timestamp_seconds: number;
  end_timestamp_seconds: number;
  suggested_title?: string;
  reason?: string;
  ai_confidence_score: number;
}

interface AIToolsPanelProps {
  broadcastId: string;
  transcriptions: Transcription[];
  clipSuggestions: ClipSuggestion[];
  aiFeatures: {
    liveTranscription: boolean;
    noiseReduction: boolean;
    chapterDetection: boolean;
    autoIntroOutro: boolean;
  };
  onToggleFeature: (feature: keyof AIToolsPanelProps['aiFeatures']) => void;
  onAcceptClip: (clipId: string) => void;
  onSeekToTime: (timestamp: number) => void;
}

export function AIToolsPanel({
  broadcastId,
  transcriptions,
  clipSuggestions,
  aiFeatures,
  onToggleFeature,
  onAcceptClip,
  onSeekToTime
}: AIToolsPanelProps) {
  const [selectedTab, setSelectedTab] = useState("transcription");

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const keyMoments = transcriptions.filter(t => t.is_key_moment);
  const chapters = transcriptions.filter(t => t.is_chapter_start);

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">AI Tools</h3>
        <Badge variant="outline" className="ml-auto">
          {Object.values(aiFeatures).filter(Boolean).length} active
        </Badge>
      </div>

      {/* AI Feature Toggles */}
      <div className="space-y-3 pb-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="live-transcription" className="text-sm">
              Live Transcription
            </Label>
          </div>
          <Switch
            id="live-transcription"
            checked={aiFeatures.liveTranscription}
            onCheckedChange={() => onToggleFeature('liveTranscription')}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Volume2 className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="noise-reduction" className="text-sm">
              Noise Reduction
            </Label>
          </div>
          <Switch
            id="noise-reduction"
            checked={aiFeatures.noiseReduction}
            onCheckedChange={() => onToggleFeature('noiseReduction')}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="chapter-detection" className="text-sm">
              Auto Chapter Detection
            </Label>
          </div>
          <Switch
            id="chapter-detection"
            checked={aiFeatures.chapterDetection}
            onCheckedChange={() => onToggleFeature('chapterDetection')}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wand2 className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="auto-intro-outro" className="text-sm">
              Auto Intro/Outro
            </Label>
          </div>
          <Switch
            id="auto-intro-outro"
            checked={aiFeatures.autoIntroOutro}
            onCheckedChange={() => onToggleFeature('autoIntroOutro')}
          />
        </div>
      </div>

      {/* AI Content Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="transcription" className="text-xs">
            <FileText className="h-3 w-3 mr-1" />
            Transcript
          </TabsTrigger>
          <TabsTrigger value="clips" className="text-xs">
            <Scissors className="h-3 w-3 mr-1" />
            Clips ({clipSuggestions.length})
          </TabsTrigger>
          <TabsTrigger value="moments" className="text-xs">
            <Sparkles className="h-3 w-3 mr-1" />
            Moments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="transcription" className="mt-4">
          <ScrollArea className="h-80">
            <div className="space-y-3 pr-4">
              {transcriptions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">No transcription yet</p>
                  <p className="text-xs">Enable live transcription to start</p>
                </div>
              ) : (
                transcriptions.map((trans) => (
                  <div
                    key={trans.id}
                    className={cn(
                      "p-3 rounded-lg border cursor-pointer hover:bg-accent transition-colors",
                      trans.is_key_moment && "border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20",
                      trans.is_chapter_start && "border-blue-500/50 bg-blue-50 dark:bg-blue-950/20"
                    )}
                    onClick={() => onSeekToTime(trans.timestamp_seconds)}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        {formatTime(trans.timestamp_seconds)}
                      </Badge>
                      {trans.is_key_moment && (
                        <Badge variant="outline" className="text-xs bg-yellow-100 dark:bg-yellow-900/50">
                          <Sparkles className="h-2 w-2 mr-1" />
                          Key Moment
                        </Badge>
                      )}
                    </div>
                    {trans.is_chapter_start && trans.chapter_title && (
                      <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">
                        Chapter: {trans.chapter_title}
                      </div>
                    )}
                    <p className="text-sm leading-relaxed">{trans.text}</p>
                    {trans.speaker_id && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Speaker: {trans.speaker_id}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="clips" className="mt-4">
          <ScrollArea className="h-80">
            <div className="space-y-3 pr-4">
              {clipSuggestions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Scissors className="h-12 w-12 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">No clip suggestions yet</p>
                  <p className="text-xs">AI will suggest clips during broadcast</p>
                </div>
              ) : (
                clipSuggestions.map((clip) => (
                  <div
                    key={clip.id}
                    className="p-3 rounded-lg border border-border space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="font-medium text-sm mb-1">
                          {clip.suggested_title || 'Suggested Clip'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatTime(clip.start_timestamp_seconds)} - {formatTime(clip.end_timestamp_seconds)}
                          <span className="mx-2">•</span>
                          {clip.end_timestamp_seconds - clip.start_timestamp_seconds}s
                        </div>
                        {clip.reason && (
                          <p className="text-xs text-muted-foreground mt-1">{clip.reason}</p>
                        )}
                      </div>
                      <div className="flex flex-col gap-1">
                        <Badge variant="outline" className="text-xs">
                          {(clip.ai_confidence_score * 100).toFixed(0)}% match
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => onSeekToTime(clip.start_timestamp_seconds)}
                      >
                        Preview
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => onAcceptClip(clip.id)}
                      >
                        <Scissors className="h-3 w-3 mr-1" />
                        Create Clip
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="moments" className="mt-4">
          <ScrollArea className="h-80">
            <div className="space-y-4 pr-4">
              {/* Key Moments */}
              {keyMoments.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase">
                    Key Moments
                  </h4>
                  {keyMoments.map((moment) => (
                    <div
                      key={moment.id}
                      className="p-3 rounded-lg border border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20 cursor-pointer hover:bg-yellow-100 dark:hover:bg-yellow-950/30 transition-colors"
                      onClick={() => onSeekToTime(moment.timestamp_seconds)}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Sparkles className="h-3 w-3 text-yellow-600" />
                        <Badge variant="outline" className="text-xs">
                          {formatTime(moment.timestamp_seconds)}
                        </Badge>
                      </div>
                      <p className="text-sm">{moment.text}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Chapters */}
              {chapters.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase">
                    Chapters
                  </h4>
                  {chapters.map((chapter) => (
                    <div
                      key={chapter.id}
                      className="p-3 rounded-lg border border-blue-500/50 bg-blue-50 dark:bg-blue-950/20 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-950/30 transition-colors"
                      onClick={() => onSeekToTime(chapter.timestamp_seconds)}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {formatTime(chapter.timestamp_seconds)}
                        </Badge>
                      </div>
                      <div className="font-medium text-sm text-blue-600 dark:text-blue-400">
                        {chapter.chapter_title}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {keyMoments.length === 0 && chapters.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Sparkles className="h-12 w-12 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">No key moments detected yet</p>
                  <p className="text-xs">AI will identify important moments during broadcast</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
