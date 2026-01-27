import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  Sparkles, Copy, RefreshCw, Loader2, CheckCircle2,
  ArrowRight, Wand2
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface ToneOption {
  id: string;
  label: string;
  description: string;
}

const toneOptions: ToneOption[] = [
  { id: "rewrite", label: "Rewrite", description: "Maintain meaning, improve clarity" },
  { id: "improve", label: "Improve", description: "Enhance quality and impact" },
  { id: "shorten", label: "Shorten", description: "Make more concise" },
  { id: "executive_tone", label: "Executive Tone", description: "Professional and authoritative" },
  { id: "friendly_tone", label: "Friendly Tone", description: "Warm and approachable" },
  { id: "press_tone", label: "Press Tone", description: "Media-ready and newsworthy" }
];

export function VoiceOfSeeksyAI() {
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [selectedTone, setSelectedTone] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [context, setContext] = useState("");

  const processText = async (tone: string) => {
    if (!inputText.trim()) {
      toast.error("Please enter some text to process");
      return;
    }

    setProcessing(true);
    setSelectedTone(tone);

    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 1500));

    const transformations: Record<string, (text: string) => string> = {
      rewrite: (text) => {
        // Simple rewrite simulation
        return text
          .replace(/\bvery\b/gi, '')
          .replace(/\breally\b/gi, '')
          .replace(/\bjust\b/gi, '')
          .trim();
      },
      improve: (text) => {
        return `${text}\n\n✨ Enhanced with Seeksy brand voice: Clear, confident, and creator-focused.`;
      },
      shorten: (text) => {
        const sentences = text.split(/[.!?]+/).filter(Boolean);
        return sentences.slice(0, Math.ceil(sentences.length / 2)).join('. ') + '.';
      },
      executive_tone: (text) => {
        return `Executive Summary:\n\n${text}\n\nKey Takeaway: ${text.split('.')[0]}.`;
      },
      friendly_tone: (text) => {
        return `Hey there! 👋\n\n${text}\n\nLet us know if you have any questions — we're here to help!`;
      },
      press_tone: (text) => {
        return `FOR IMMEDIATE RELEASE\n\n${text}\n\nAbout Seeksy:\nSeeksy is the creator operating system that helps creators produce, monetize, and grow their audience.\n\nMedia Contact: press@seeksy.io`;
      }
    };

    const transformer = transformations[tone];
    const result = transformer ? transformer(inputText) : inputText;
    
    setOutputText(result);
    setProcessing(false);

    // Log the session
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await (supabase as any).from("cco_ai_sessions").insert({
        user_id: user.id,
        session_type: tone,
        input_text: inputText,
        output_text: result,
        tone_requested: tone,
        context: context || null
      });
    }
  };

  const copyOutput = () => {
    navigator.clipboard.writeText(outputText);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Voice of Seeksy AI
          </CardTitle>
          <CardDescription>
            AI-powered writing assistant trained on Seeksy's brand voice, values, and communication style
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Input */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Input Text</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea 
              placeholder="Paste or type your text here..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              rows={10}
              className="resize-none"
            />
            <div>
              <label className="text-sm text-muted-foreground">Context (optional)</label>
              <Textarea 
                placeholder="e.g., 'This is for a creator newsletter' or 'Investor update email'"
                value={context}
                onChange={(e) => setContext(e.target.value)}
                rows={2}
                className="resize-none mt-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Output */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Output</CardTitle>
              {outputText && (
                <Button variant="ghost" size="sm" onClick={copyOutput}>
                  <Copy className="h-4 w-4 mr-1" />
                  Copy
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {outputText ? (
              <div className="p-4 bg-muted rounded-lg min-h-[200px]">
                <p className="text-sm whitespace-pre-wrap">{outputText}</p>
              </div>
            ) : (
              <div className="p-4 bg-muted/50 rounded-lg min-h-[200px] flex items-center justify-center text-muted-foreground">
                <p className="text-sm">Select a transformation below to see results</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tone Options */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Wand2 className="h-4 w-4" />
            Transformations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {toneOptions.map((tone) => (
              <Button
                key={tone.id}
                variant={selectedTone === tone.id ? "default" : "outline"}
                className="h-auto py-4 flex flex-col items-center gap-2"
                disabled={processing}
                onClick={() => processText(tone.id)}
              >
                {processing && selectedTone === tone.id ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : selectedTone === tone.id ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <ArrowRight className="h-5 w-5" />
                )}
                <span className="font-medium text-sm">{tone.label}</span>
                <span className="text-xs text-muted-foreground text-center">
                  {tone.description}
                </span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tips */}
      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-amber-600 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800">Pro Tips</p>
              <ul className="text-sm text-amber-700 mt-2 space-y-1">
                <li>• Use <strong>Executive Tone</strong> for board communications and investor updates</li>
                <li>• Use <strong>Friendly Tone</strong> for creator newsletters and community announcements</li>
                <li>• Use <strong>Press Tone</strong> for media releases and public announcements</li>
                <li>• Always review AI output before publishing — human judgment is essential</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
