import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, Clock, Zap, TrendingUp, CheckCircle2, AlertTriangle } from "lucide-react";
import { VideoAnalysisResults } from "./VideoAnalysisResults";

interface VideoComparisonViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mediaFile: {
    id: string;
    file_name: string;
    file_url: string;
    duration_seconds?: number;
  };
  analysis: any;
}

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const VideoComparisonView = ({ 
  open, 
  onOpenChange, 
  mediaFile,
  analysis 
}: VideoComparisonViewProps) => {
  const totalFillerDuration = analysis.fillerWords?.reduce((sum: number, fw: any) => sum + fw.duration, 0) || 0;
  const timeSaved = totalFillerDuration;
  const originalDuration = mediaFile.duration_seconds || 120;
  const newDuration = originalDuration - timeSaved;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            AI Analysis Complete - {mediaFile.file_name}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="comparison" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="comparison">Before & After</TabsTrigger>
            <TabsTrigger value="analysis">Detailed Analysis</TabsTrigger>
            <TabsTrigger value="timeline">Timeline View</TabsTrigger>
          </TabsList>

          {/* Before & After Comparison */}
          <TabsContent value="comparison" className="space-y-4">
            <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-yellow-500" />
                  <p className="text-sm font-medium">Time Saved</p>
                </div>
                <p className="text-2xl font-bold text-yellow-500">{formatTime(timeSaved)}</p>
                <p className="text-xs text-muted-foreground">Can be removed</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Zap className="h-4 w-4 text-blue-500" />
                  <p className="text-sm font-medium">Original Length</p>
                </div>
                <p className="text-2xl font-bold">{formatTime(originalDuration)}</p>
                <p className="text-xs text-muted-foreground">Current duration</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <p className="text-sm font-medium">Optimized Length</p>
                </div>
                <p className="text-2xl font-bold text-green-500">{formatTime(newDuration)}</p>
                <p className="text-xs text-muted-foreground">After AI edits</p>
              </div>
            </div>

            {/* Video Preview Section */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Original Video</h3>
                  <Badge variant="outline">Unprocessed</Badge>
                </div>
                <div className="aspect-video bg-black rounded-lg flex items-center justify-center relative overflow-hidden">
                  <video 
                    src={mediaFile.file_url} 
                    controls 
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p className="flex items-center gap-2">
                    <AlertTriangle className="h-3 w-3 text-yellow-500" />
                    {analysis.fillerWords?.length || 0} filler words detected
                  </p>
                  <p className="flex items-center gap-2">
                    <AlertTriangle className="h-3 w-3 text-orange-500" />
                    {analysis.qualityIssues?.filter((i: any) => i.severity === 'high').length || 0} quality issues found
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">AI-Enhanced Preview</h3>
                  <Badge variant="default" className="bg-green-500">Optimized</Badge>
                </div>
                <div className="aspect-video bg-gradient-to-br from-green-500/10 to-blue-500/10 rounded-lg flex items-center justify-center relative border-2 border-green-500/20">
                  <div className="text-center space-y-2 p-6">
                    <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
                    <p className="font-medium">AI Processing Complete</p>
                    <p className="text-sm text-muted-foreground">
                      Ready to apply {analysis.fillerWords?.length || 0} edits
                    </p>
                    <Button variant="default" size="sm" className="mt-4">
                      Apply AI Edits
                    </Button>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p className="flex items-center gap-2">
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                    Removes {formatTime(timeSaved)} of dead air
                  </p>
                  <p className="flex items-center gap-2">
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                    {analysis.qualityIssues?.length || 0} enhancement suggestions ready
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between items-center pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                <p>Changes are reversible - original video is preserved</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Review Later
                </Button>
                <Button variant="default">
                  <Download className="h-4 w-4 mr-2" />
                  Download Analysis Report
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Detailed Analysis */}
          <TabsContent value="analysis">
            <ScrollArea className="h-[60vh]">
              <VideoAnalysisResults analysis={analysis} />
            </ScrollArea>
          </TabsContent>

          {/* Timeline View */}
          <TabsContent value="timeline" className="space-y-4">
            <div className="relative">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-border" />
              <ScrollArea className="h-[60vh] pl-6">
                <div className="space-y-4">
                  {/* Timeline events */}
                  {analysis.fillerWords?.map((fw: any, idx: number) => (
                    <div key={idx} className="relative">
                      <div className="absolute -left-[25px] top-2 w-3 h-3 rounded-full bg-yellow-500" />
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <Badge variant="outline">{fw.word}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {formatTime(fw.timestamp)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Duration: {fw.duration.toFixed(2)}s - Can be removed
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {analysis.suggestedAdBreaks?.map((adBreak: any, idx: number) => (
                    <div key={`ad-${idx}`} className="relative">
                      <div className="absolute -left-[25px] top-2 w-3 h-3 rounded-full bg-green-500" />
                      <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                        <div className="flex items-center justify-between mb-1">
                          <Badge variant="default" className="bg-green-500">Ad Break</Badge>
                          <span className="text-sm text-muted-foreground">
                            {formatTime(adBreak.timestamp)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {adBreak.reason}
                        </p>
                      </div>
                    </div>
                  ))}

                  {analysis.qualityIssues?.map((issue: any, idx: number) => (
                    <div key={`issue-${idx}`} className="relative">
                      <div className="absolute -left-[25px] top-2 w-3 h-3 rounded-full bg-orange-500" />
                      <div className="p-3 bg-orange-500/10 rounded-lg border border-orange-500/20">
                        <div className="flex items-center justify-between mb-1">
                          <Badge 
                            variant={issue.severity === 'high' ? 'destructive' : 'secondary'}
                            className="capitalize"
                          >
                            {issue.type}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {formatTime(issue.timestamp)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {issue.suggestion}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
