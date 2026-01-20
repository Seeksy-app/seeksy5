import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Clock, Zap, FileText, AlertTriangle, TrendingUp } from "lucide-react";

interface VideoAnalysisResultsProps {
  analysis: {
    transcript?: string;
    fillerWords?: Array<{ word: string; timestamp: number; duration: number }>;
    scenes?: Array<{ start: number; end: number; description: string; quality: string }>;
    suggestedAdBreaks?: Array<{ timestamp: number; reason: string }>;
    qualityIssues?: Array<{ type: string; timestamp: number; severity: string; suggestion: string }>;
  };
}

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const VideoAnalysisResults = ({ analysis }: VideoAnalysisResultsProps) => {
  const totalFillerDuration = analysis.fillerWords?.reduce((sum, fw) => sum + fw.duration, 0) || 0;
  const highSeverityIssues = analysis.qualityIssues?.filter(i => i.severity === 'high').length || 0;

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <Zap className="h-5 w-5 text-yellow-500 mb-2" />
              <p className="text-2xl font-bold">{analysis.fillerWords?.length || 0}</p>
              <p className="text-xs text-muted-foreground">Filler Words</p>
              <p className="text-xs text-muted-foreground mt-1">
                {formatTime(totalFillerDuration)} total
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <FileText className="h-5 w-5 text-blue-500 mb-2" />
              <p className="text-2xl font-bold">{analysis.scenes?.length || 0}</p>
              <p className="text-xs text-muted-foreground">Scenes</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <TrendingUp className="h-5 w-5 text-green-500 mb-2" />
              <p className="text-2xl font-bold">{analysis.suggestedAdBreaks?.length || 0}</p>
              <p className="text-xs text-muted-foreground">Ad Breaks</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <AlertTriangle className="h-5 w-5 text-red-500 mb-2" />
              <p className="text-2xl font-bold">{highSeverityIssues}</p>
              <p className="text-xs text-muted-foreground">Quality Issues</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analysis */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Filler Words */}
        {analysis.fillerWords && analysis.fillerWords.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Filler Words Detected
              </CardTitle>
              <CardDescription>
                AI identified {analysis.fillerWords.length} filler words that can be removed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[200px]">
                <div className="space-y-2">
                  {analysis.fillerWords.slice(0, 10).map((fw, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{fw.word}</Badge>
                        <span className="text-sm text-muted-foreground">
                          {formatTime(fw.timestamp)}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {fw.duration.toFixed(1)}s
                      </span>
                    </div>
                  ))}
                  {analysis.fillerWords.length > 10 && (
                    <p className="text-sm text-muted-foreground text-center py-2">
                      + {analysis.fillerWords.length - 10} more
                    </p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {/* Quality Issues */}
        {analysis.qualityIssues && analysis.qualityIssues.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Quality Issues
              </CardTitle>
              <CardDescription>
                AI detected {analysis.qualityIssues.length} areas that could be enhanced
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[200px]">
                <div className="space-y-2">
                  {analysis.qualityIssues.map((issue, idx) => (
                    <div key={idx} className="p-2 bg-muted/50 rounded space-y-1">
                      <div className="flex items-center justify-between">
                        <Badge 
                          variant={issue.severity === 'high' ? 'destructive' : 'secondary'}
                          className="capitalize"
                        >
                          {issue.type}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatTime(issue.timestamp)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {issue.suggestion}
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {/* Scene Analysis */}
        {analysis.scenes && analysis.scenes.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Scene Breakdown
              </CardTitle>
              <CardDescription>
                AI identified {analysis.scenes.length} distinct scenes in your video
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[200px]">
                <div className="space-y-2">
                  {analysis.scenes.map((scene, idx) => (
                    <div key={idx} className="p-2 bg-muted/50 rounded space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Scene {idx + 1}</span>
                        <Badge variant={
                          scene.quality === 'good' ? 'default' : 
                          scene.quality === 'fair' ? 'secondary' : 
                          'outline'
                        }>
                          {scene.quality}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatTime(scene.start)} - {formatTime(scene.end)}
                      </p>
                      <p className="text-xs">{scene.description}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {/* Ad Break Suggestions */}
        {analysis.suggestedAdBreaks && analysis.suggestedAdBreaks.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Suggested Ad Breaks
              </CardTitle>
              <CardDescription>
                AI identified {analysis.suggestedAdBreaks.length} optimal points for ad insertion
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[200px]">
                <div className="space-y-2">
                  {analysis.suggestedAdBreaks.map((adBreak, idx) => (
                    <div key={idx} className="p-2 bg-muted/50 rounded space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          <Clock className="h-3 w-3 inline mr-1" />
                          {formatTime(adBreak.timestamp)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{adBreak.reason}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Transcript */}
      {analysis.transcript && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Full Transcript
            </CardTitle>
            <CardDescription>
              AI-generated transcript for auto-captions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px]">
              <p className="text-sm whitespace-pre-wrap">{analysis.transcript}</p>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
