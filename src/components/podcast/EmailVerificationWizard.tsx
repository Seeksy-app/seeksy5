import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { CheckCircle2, Mail, Clock, Infinity, Copy, ExternalLink, Music, Mic, Rss } from "lucide-react";

interface EmailVerificationWizardProps {
  podcastId: string;
  podcastSlug?: string;
  currentEmail?: string | null;
  currentExpiration?: string | null;
  currentPermanent?: boolean;
  onComplete?: () => void;
}

export function EmailVerificationWizard({
  podcastId,
  podcastSlug,
  currentEmail,
  currentExpiration,
  currentPermanent,
  onComplete,
}: EmailVerificationWizardProps) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState(currentEmail || "");
  const [duration, setDuration] = useState<"48hours" | "permanent">(
    currentPermanent ? "permanent" : "48hours"
  );

  const rssUrl = `https://taxqcioheqdqtlmjeaht.supabase.co/functions/v1/podcast-rss/${podcastSlug || podcastId}`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("RSS feed URL copied to clipboard!");
  };

  const updateVerification = useMutation({
    mutationFn: async () => {
      let expiresAt = null;
      
      if (duration === "48hours") {
        const fortyEightHours = new Date();
        fortyEightHours.setHours(fortyEightHours.getHours() + 48);
        expiresAt = fortyEightHours.toISOString();
      }

      const { error } = await (supabase as any)
        .from("podcasts")
        .update({
          verification_email: email || null,
          verification_email_permanent: duration === "permanent",
          verification_email_expires_at: expiresAt,
        })
        .eq("id", podcastId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["podcast", podcastId] });
      setStep(4); // Move to success step instead of calling onComplete
    },
    onError: () => {
      toast.error("Failed to update verification email");
    },
  });

  const handleNext = () => {
    if (step === 2) {
      if (!email || !email.includes("@")) {
        toast.error("Please enter a valid email address");
        return;
      }
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleSubmit = () => {
    updateVerification.mutate();
  };

  return (
    <Card className="p-6 max-w-2xl mx-auto">
      {/* Progress Indicator */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
            step >= 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
          }`}>
            {step > 1 ? <CheckCircle2 className="w-5 h-5" /> : "1"}
          </div>
          <div className={`h-1 w-16 ${step >= 2 ? "bg-primary" : "bg-muted"}`} />
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
            step >= 2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
          }`}>
            {step > 2 ? <CheckCircle2 className="w-5 h-5" /> : "2"}
          </div>
          <div className={`h-1 w-16 ${step >= 3 ? "bg-primary" : "bg-muted"}`} />
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
            step >= 3 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
          }`}>
            {step > 3 ? <CheckCircle2 className="w-5 h-5" /> : "3"}
          </div>
          <div className={`h-1 w-16 ${step >= 4 ? "bg-primary" : "bg-muted"}`} />
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
            step >= 4 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
          }`}>
            {step > 4 ? <CheckCircle2 className="w-5 h-5" /> : "4"}
          </div>
        </div>
      </div>

      {/* Step Content */}
      <div className="min-h-[300px]">
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Why Add an Email?</h2>
              <p className="text-muted-foreground">
                Podcast directories like Spotify and Apple Podcasts require an email in your RSS feed to verify podcast ownership.
              </p>
            </div>

            <div className="p-4 bg-primary/5 border border-primary/10 rounded-lg">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <h3 className="font-semibold mb-1">How It Works</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Add your email temporarily to the RSS feed</li>
                    <li>• Directory sends verification link to your email</li>
                    <li>• Click the link to verify ownership</li>
                    <li>• We automatically remove the email after 48 hours (or keep it permanently)</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleNext}>
                Get Started
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Enter Verification Email</h2>
              <p className="text-muted-foreground">
                This email will be added to your RSS feed for directory verification.
              </p>
            </div>

            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="podcast@example.com"
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Use an email you can access to receive verification links
              </p>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={handleBack}>
                Back
              </Button>
              <Button onClick={handleNext}>
                Continue
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">How Long to Keep Email?</h2>
              <p className="text-muted-foreground">
                Choose how long the email should remain in your RSS feed.
              </p>
            </div>

            <RadioGroup value={duration} onValueChange={(val) => setDuration(val as any)}>
              <div className="space-y-3">
                <label htmlFor="48hours" className="flex items-start gap-3 p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="48hours" id="48hours" className="mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="w-4 h-4 text-primary" />
                      <span className="font-semibold">48 Hours (Recommended)</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Email stays in feed for 48 hours, then automatically removed to protect your inbox. You can re-add it later if needed.
                    </p>
                  </div>
                </label>

                <label htmlFor="permanent" className="flex items-start gap-3 p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="permanent" id="permanent" className="mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Infinity className="w-4 h-4 text-primary" />
                      <span className="font-semibold">Keep Indefinitely</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Email remains in your RSS feed permanently. May receive marketing emails from directories.
                    </p>
                  </div>
                </label>
              </div>
            </RadioGroup>

            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-900/20 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Tip:</strong> Most podcasters choose 48 hours. This gives directories time to verify while protecting your inbox from spam.
              </p>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={handleBack}>
                Back
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={updateVerification.isPending}
              >
                {updateVerification.isPending ? "Updating..." : "Add to RSS Feed"}
              </Button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Email Added Successfully!</h2>
              <p className="text-muted-foreground">
                Your verification email is now in your RSS feed. Here's what to do next:
              </p>
            </div>

            {/* RSS Feed URL */}
            <div className="p-4 bg-muted/50 rounded-lg border">
              <Label className="text-sm font-medium mb-2 block">Your RSS Feed URL</Label>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-sm bg-background p-3 rounded border overflow-x-auto">
                  {rssUrl}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(rssUrl)}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Directory Links */}
            <div>
              <h3 className="font-semibold mb-3">Submit to Directories</h3>
              <div className="space-y-2">
                {/* Spotify */}
                <a
                  href="https://podcasters.spotify.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#1DB954]/10 flex items-center justify-center">
                      <div className="w-5 h-5 rounded-full bg-[#1DB954] flex items-center justify-center">
                        <Music className="w-3 h-3 text-white" />
                      </div>
                    </div>
                    <div>
                      <div className="font-medium">Spotify for Podcasters</div>
                      <div className="text-xs text-muted-foreground">Submit your RSS feed</div>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </a>

                {/* Apple Podcasts */}
                <a
                  href="https://podcastsconnect.apple.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#9333EA]/10 flex items-center justify-center">
                      <Mic className="w-5 h-5 text-[#9333EA]" />
                    </div>
                    <div>
                      <div className="font-medium">Apple Podcasts Connect</div>
                      <div className="text-xs text-muted-foreground">Submit to Apple Podcasts</div>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </a>

                {/* Google Podcasts */}
                <a
                  href="https://play.google.com/console/podcasts"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#4285F4]/10 flex items-center justify-center">
                      <Rss className="w-5 h-5 text-[#4285F4]" />
                    </div>
                    <div>
                      <div className="font-medium">Google Podcasts Manager</div>
                      <div className="text-xs text-muted-foreground">Submit to Google Podcasts</div>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </a>
              </div>
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/20 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Next Steps:</strong> Copy your RSS feed URL and paste it into each directory's submission form. They will send a verification email to {email} to confirm ownership.
              </p>
            </div>

            <div className="flex justify-end">
              <Button onClick={() => onComplete && onComplete()}>
                Done
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
