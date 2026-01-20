import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { sanitizeHtml } from "@/lib/sanitizeHtml";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Sparkles, Loader2, Copy, Check, AlertTriangle } from "lucide-react";

interface ScribeAssistantProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: "draft" | "rewrite" | "personalize" | "check_deliverability" | "improve_subject";
  initialInput?: string;
  contactId?: string;
  context?: any;
  onApply?: (result: any) => void;
}

const TONES = [
  { value: "professional", label: "Professional" },
  { value: "friendly", label: "Friendly" },
  { value: "casual", label: "Casual" },
  { value: "formal", label: "Formal" },
  { value: "creator", label: "Creator Style" },
];

const ACTION_TITLES = {
  draft: "Draft Email with Scribe",
  rewrite: "Rewrite with Scribe",
  personalize: "Personalize with Scribe",
  check_deliverability: "Deliverability Check",
  improve_subject: "Improve Subject Line",
};

const ACTION_DESCRIPTIONS = {
  draft: "Describe what you want to communicate, and Scribe will generate a complete email",
  rewrite: "Paste your email and Scribe will improve it",
  personalize: "Add personalization based on contact data",
  check_deliverability: "Check for spam triggers and deliverability issues",
  improve_subject: "Generate alternative subject lines",
};

export const ScribeAssistant = ({
  open,
  onOpenChange,
  action,
  initialInput = "",
  contactId,
  context,
  onApply,
}: ScribeAssistantProps) => {
  const [input, setInput] = useState(initialInput);
  const [tone, setTone] = useState("friendly");
  const [result, setResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const generateMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("scribe-agent", {
        body: {
          action,
          input,
          tone,
          contactId,
          context,
        },
      });

      if (error) throw error;
      return data.result;
    },
    onSuccess: (data) => {
      setResult(data);
      toast.success("Generated successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to generate");
    },
  });

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Copied to clipboard");
  };

  const handleApply = () => {
    if (onApply && result) {
      onApply(result);
      onOpenChange(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setInput(initialInput);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            <SheetTitle>{ACTION_TITLES[action]}</SheetTitle>
          </div>
          <SheetDescription>{ACTION_DESCRIPTIONS[action]}</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Input Section */}
          {!result && (
            <>
              {(action === "draft" || action === "rewrite" || action === "improve_subject") && (
                <div className="space-y-2">
                  <Label>Tone</Label>
                  <Select value={tone} onValueChange={setTone}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TONES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label>
                  {action === "draft" && "What do you want to say?"}
                  {action === "rewrite" && "Paste your email"}
                  {action === "personalize" && "Current email"}
                  {action === "check_deliverability" && "Email to check"}
                  {action === "improve_subject" && "Current subject line"}
                </Label>
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={
                    action === "draft"
                      ? "E.g., Welcome new subscribers and tell them about our upcoming podcast episode..."
                      : "Paste your email content here..."
                  }
                  rows={8}
                  className="font-mono text-sm"
                />
              </div>

              <Button
                onClick={() => generateMutation.mutate()}
                disabled={generateMutation.isPending || !input.trim()}
                className="w-full"
              >
                {generateMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate with Scribe
                  </>
                )}
              </Button>
            </>
          )}

          {/* Result Section */}
          {result && (
            <>
              {(action === "draft" || action === "rewrite" || action === "personalize") && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Subject</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopy(result.subject)}
                      >
                        {copied ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <div className="p-3 bg-muted rounded-md font-semibold">
                      {result.subject}
                    </div>
                  </div>

                  {result.preheader && (
                    <div className="space-y-2">
                      <Label>Preheader</Label>
                      <div className="p-3 bg-muted rounded-md text-sm text-muted-foreground">
                        {result.preheader}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Body</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopy(result.body)}
                      >
                        {copied ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <div className="p-4 bg-muted rounded-md prose prose-sm max-w-none">
                      <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(result.body) }} />
                    </div>
                  </div>
                </div>
              )}

              {action === "check_deliverability" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="text-4xl font-bold text-primary">
                      {result.score}
                    </div>
                    <div>
                      <div className="font-semibold">Deliverability Score</div>
                      <Badge
                        variant={
                          result.score >= 80
                            ? "default"
                            : result.score >= 60
                            ? "secondary"
                            : "destructive"
                        }
                      >
                        {result.score >= 80
                          ? "Excellent"
                          : result.score >= 60
                          ? "Good"
                          : "Needs Work"}
                      </Badge>
                    </div>
                  </div>

                  {result.issues?.length > 0 && (
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        Issues Found
                      </Label>
                      <ul className="space-y-1 text-sm">
                        {result.issues.map((issue: string, i: number) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-muted-foreground">•</span>
                            <span>{issue}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {result.suggestions?.length > 0 && (
                    <div className="space-y-2">
                      <Label>Suggestions</Label>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        {result.suggestions.map((suggestion: string, i: number) => (
                          <li key={i} className="flex items-start gap-2">
                            <span>✓</span>
                            <span>{suggestion}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {action === "improve_subject" && (
                <div className="space-y-4">
                  <Label>Alternative Subject Lines</Label>
                  {result.alternatives?.map((alt: string, i: number) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 bg-muted rounded-md group hover:bg-muted/80 transition-colors"
                    >
                      <span className="font-medium">{alt}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopy(alt)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="outline" onClick={handleReset} className="flex-1">
                  Try Again
                </Button>
                {onApply && (
                  <Button onClick={handleApply} className="flex-1">
                    Apply to Email
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
