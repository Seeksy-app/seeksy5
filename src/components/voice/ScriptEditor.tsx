import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload, FileText, Sparkles, Copy, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface ScriptEditorProps {
  script: string;
  onScriptChange: (script: string) => void;
  cloneType: 'instant' | 'professional';
}

export default function ScriptEditor({ script, onScriptChange, cloneType }: ScriptEditorProps) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [preferences, setPreferences] = useState({
    topic: "",
    tone: "",
    style: "",
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    const validTypes = ['text/plain', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type) && !file.name.endsWith('.txt') && !file.name.endsWith('.doc') && !file.name.endsWith('.docx')) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a .txt, .doc, or .docx file",
        variant: "destructive",
      });
      return;
    }

    try {
      const text = await file.text();
      onScriptChange(text);
      toast({
        title: "Script Uploaded",
        description: "Your script has been loaded successfully",
      });
    } catch (error) {
      toast({
        title: "Upload Error",
        description: "Failed to read the file. Please try again.",
        variant: "destructive",
      });
    }
  };

  const generateAIScript = async () => {
    if (!preferences.topic) {
      toast({
        title: "Missing Information",
        description: "Please provide at least a topic for your script",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      const duration = cloneType === 'instant' ? '2 minutes' : '30 minutes';
      
      const { data, error } = await supabase.functions.invoke('generate-voice-script', {
        body: {
          duration,
          topic: preferences.topic,
          tone: preferences.tone || 'conversational',
          style: preferences.style || 'natural',
        },
      });

      if (error) throw error;

      onScriptChange(data.script);
      setAiDialogOpen(false);
      toast({
        title: "Script Generated",
        description: "Your AI-generated script is ready to use",
      });
    } catch (error) {
      console.error("Error generating script:", error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate script",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(script);
    toast({
      title: "Copied",
      description: "Script copied to clipboard",
    });
  };

  const suggestedLength = cloneType === 'instant' ? '200-300 words' : '3000-4000 words';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Recording Script
        </CardTitle>
        <CardDescription>
          Upload, write, or generate a script to read from during recording (Suggested: {suggestedLength})
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Action Buttons */}
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => document.getElementById('script-upload')?.click()}
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload Script
          </Button>
          <input
            id="script-upload"
            type="file"
            accept=".txt,.doc,.docx"
            className="hidden"
            onChange={handleFileUpload}
          />

          <Dialog open={aiDialogOpen} onOpenChange={setAiDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Sparkles className="h-4 w-4 mr-2" />
                Generate with AI
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Generate AI Script</DialogTitle>
                <DialogDescription>
                  Tell us what you'd like to talk about, and AI will create a script for you
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="topic">Topic / Subject *</Label>
                  <Input
                    id="topic"
                    placeholder="e.g., entrepreneurship, technology, personal development"
                    value={preferences.topic}
                    onChange={(e) => setPreferences({ ...preferences, topic: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="tone">Tone (Optional)</Label>
                  <Input
                    id="tone"
                    placeholder="e.g., professional, casual, energetic"
                    value={preferences.tone}
                    onChange={(e) => setPreferences({ ...preferences, tone: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="style">Style (Optional)</Label>
                  <Input
                    id="style"
                    placeholder="e.g., storytelling, educational, motivational"
                    value={preferences.style}
                    onChange={(e) => setPreferences({ ...preferences, style: e.target.value })}
                  />
                </div>
                <Button
                  onClick={generateAIScript}
                  disabled={isGenerating}
                  className="w-full"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate Script
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {script && (
            <Button variant="ghost" size="sm" onClick={copyToClipboard}>
              <Copy className="h-4 w-4 mr-2" />
              Copy
            </Button>
          )}
        </div>

        {/* Script Editor */}
        <div>
          <Textarea
            placeholder="Type or paste your script here... You can also upload a file or generate one with AI."
            value={script}
            onChange={(e) => onScriptChange(e.target.value)}
            className="min-h-[300px] font-mono text-sm"
          />
          <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
            <span>{script.split(/\s+/).filter(Boolean).length} words</span>
            <span>Suggested: {suggestedLength}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
