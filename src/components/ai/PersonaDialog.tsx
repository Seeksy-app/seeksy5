import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Sparkles, Loader2, Copy, Check } from "lucide-react";
import { EMAIL_PERSONAS } from "@/lib/email-personas";

interface PersonaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  persona: keyof typeof EMAIL_PERSONAS;
  prompt: string;
  context?: any;
  onApply?: (result: string) => void;
  placeholder?: string;
}

export const PersonaDialog = ({
  open,
  onOpenChange,
  persona,
  prompt,
  context,
  onApply,
  placeholder,
}: PersonaDialogProps) => {
  const [input, setInput] = useState("");
  const [result, setResult] = useState("");
  const [copied, setCopied] = useState(false);

  const personaData = EMAIL_PERSONAS[persona];
  const Icon = personaData.icon;

  const generateMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("global-agent", {
        body: {
          message: input || prompt,
          context: {
            ...context,
            persona,
          },
        },
      });

      if (error) throw error;
      return data.response;
    },
    onSuccess: (data) => {
      setResult(data);
      toast.success(`${personaData.name} generated a response`);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to generate");
    },
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
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
    setResult("");
    setInput("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${personaData.bgColor}`}>
              <Icon className={`h-5 w-5 ${personaData.color}`} />
            </div>
            <div className="flex-1">
              <DialogTitle>Ask {personaData.name}</DialogTitle>
              <DialogDescription>{personaData.description}</DialogDescription>
            </div>
            <Badge variant="secondary" className="gap-1">
              <Sparkles className="h-3 w-3" />
              AI Assistant
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {!result && (
            <>
              <div className="space-y-2">
                <Label>What would you like {personaData.name} to help with?</Label>
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={placeholder || prompt}
                  rows={4}
                  className="resize-none"
                />
              </div>

              <Button
                onClick={() => generateMutation.mutate()}
                disabled={generateMutation.isPending || (!input && !prompt)}
                className="w-full"
              >
                {generateMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {personaData.name} is thinking...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Ask {personaData.name}
                  </>
                )}
              </Button>
            </>
          )}

          {result && (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${personaData.color}`} />
                    {personaData.name}'s Response
                  </Label>
                  <Button variant="ghost" size="sm" onClick={handleCopy}>
                    {copied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <div className="p-4 bg-muted rounded-lg prose prose-sm max-w-none">
                  <div className="whitespace-pre-wrap">{result}</div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={handleReset} className="flex-1">
                  Ask Again
                </Button>
                {onApply && (
                  <Button onClick={handleApply} className="flex-1">
                    Apply
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
