import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Copy, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TalkingPointsWidgetProps {
  teamType: 'cfo' | 'sales';
  title: string;
  description: string;
}

export const TalkingPointsWidget = ({ teamType, title, description }: TalkingPointsWidgetProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [talkingPoints, setTalkingPoints] = useState("");
  const { toast } = useToast();

  const generateTalkingPoints = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-team-talking-points', {
        body: { teamType }
      });

      if (error) throw error;

      if (data?.talkingPoints) {
        setTalkingPoints(data.talkingPoints);
        toast({
          title: "Talking Points Generated",
          description: "AI-powered insights are ready to review.",
        });
      }
    } catch (error: any) {
      console.error('Error generating talking points:', error);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate talking points. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(talkingPoints);
    toast({
      title: "Copied",
      description: "Talking points copied to clipboard.",
    });
  };

  return (
    <Card className="transition-all duration-300 hover:shadow-lg border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              {title}
            </CardTitle>
            <CardDescription className="mt-1">{description}</CardDescription>
          </div>
          <Button
            onClick={generateTalkingPoints}
            disabled={isGenerating}
            size="sm"
            className="gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {talkingPoints ? (
          <div className="space-y-4">
            <ScrollArea className="h-[400px] rounded-lg border bg-muted/30 p-4">
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {talkingPoints}
                </div>
              </div>
            </ScrollArea>
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={copyToClipboard}
                className="gap-2"
              >
                <Copy className="h-4 w-4" />
                Copy to Clipboard
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">
              Click "Generate" to create AI-powered talking points based on current data
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};