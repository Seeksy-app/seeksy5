import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, X, CheckCircle2 } from "lucide-react";

interface ClaimsSavePromptProps {
  onSave: (email: string, name?: string) => Promise<void>;
  onDismiss: () => void;
}

export function ClaimsSavePrompt({ onSave, onDismiss }: ClaimsSavePromptProps) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    
    setIsSubmitting(true);
    try {
      await onSave(email, name || undefined);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-orange-200 bg-orange-50/50 dark:bg-orange-950/20 dark:border-orange-900/50 mx-4 my-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Save className="w-5 h-5 text-orange-600" />
            Save Your Progress?
          </CardTitle>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onDismiss}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-[15px] text-muted-foreground mb-4">
          Would you like to save this conversation so you don't lose your notes?
        </p>
        
        <div className="space-y-2 mb-4 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span>Come back later and pick up where you left off</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span>Save your notes and answers for your claim</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span>Share a summary with a claims professional</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label htmlFor="save-email" className="text-sm">Email</Label>
            <Input
              id="save-email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="save-name" className="text-sm">First Name (optional)</Label>
            <Input
              id="save-name"
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2 pt-2">
            <Button 
              type="submit" 
              className="flex-1 bg-orange-600 hover:bg-orange-700"
              disabled={isSubmitting || !email.trim()}
            >
              {isSubmitting ? "Saving..." : "Save my conversation"}
            </Button>
            <Button 
              type="button" 
              variant="ghost" 
              onClick={onDismiss}
            >
              Maybe later
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
