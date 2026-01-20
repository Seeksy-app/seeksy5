import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Sparkles, Download } from "lucide-react";

export function AIBRollGenerator() {
  const [prompt, setPrompt] = useState("");
  const [count, setCount] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a description for the B-roll");
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-ai-broll', {
        body: { prompt, count }
      });

      if (error) throw error;

      if (data?.images) {
        setGeneratedImages(data.images);
        toast.success(`Generated ${data.images.length} B-roll image(s)`);
      }
    } catch (error: any) {
      console.error('Error generating B-roll:', error);
      toast.error(error.message || "Failed to generate B-roll");
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = (imageUrl: string, index: number) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `broll-${index + 1}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold mb-1">AI B-Roll Generator</h3>
        <p className="text-xs text-muted-foreground">
          Generate custom B-roll images using AI
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label className="text-sm font-medium mb-2 block">Description</Label>
          <Textarea
            placeholder="Describe the B-roll you need (e.g., 'Mountain landscape at sunset', 'Modern office workspace', 'Coffee being poured')"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="min-h-[80px] text-sm"
          />
        </div>

        <div>
          <Label className="text-sm font-medium mb-2 block">Number of Images</Label>
          <Input
            type="number"
            min={1}
            max={5}
            value={count}
            onChange={(e) => setCount(Math.max(1, Math.min(5, parseInt(e.target.value) || 1)))}
            className="text-sm"
          />
        </div>

        <Button 
          onClick={handleGenerate} 
          disabled={isGenerating || !prompt.trim()}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Generate B-Roll
            </>
          )}
        </Button>

        {generatedImages.length > 0 && (
          <div className="space-y-3">
            <Label className="text-sm font-medium">Generated B-Roll</Label>
            <div className="grid grid-cols-1 gap-3">
              {generatedImages.map((imageUrl, index) => (
                <Card key={index} className="border-primary/20">
                  <CardContent className="p-3">
                    <img 
                      src={imageUrl} 
                      alt={`Generated B-roll ${index + 1}`}
                      className="w-full h-auto rounded-md mb-2"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => downloadImage(imageUrl, index)}
                      className="w-full"
                    >
                      <Download className="h-3 w-3 mr-2" />
                      Download Image {index + 1}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
