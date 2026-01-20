import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail } from "lucide-react";
import { toast } from "sonner";
import { useNewsletterSubscribe, PLATFORM_CTA_IDS } from "@/hooks/useNewsletterSubscribe";

interface NewsletterSignupFormProps {
  ctaId?: string;
  source?: string;
}

export const NewsletterSignupForm = ({ 
  ctaId = PLATFORM_CTA_IDS.WEBSITE,
  source = 'website' 
}: NewsletterSignupFormProps) => {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const { subscribe, isLoading } = useNewsletterSubscribe();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error("Please enter your email");
      return;
    }

    const result = await subscribe({
      email,
      name: name || undefined,
      source,
      ctaId
    });

    if (result.success) {
      toast.success("Successfully subscribed to our newsletter!");
      setEmail("");
      setName("");
    } else {
      toast.error(result.error || "Failed to subscribe. Please try again.");
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="flex items-center gap-2 mb-2">
          <Mail className="w-5 h-5" />
          <CardTitle>Subscribe to Our Newsletter</CardTitle>
        </div>
        <CardDescription>
          Get the latest updates and insights delivered to your inbox
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              type="text"
              placeholder="Your name (optional)"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <Input
              type="email"
              placeholder="Your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Subscribing..." : "Subscribe"}
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            We respect your privacy. Unsubscribe at any time.
          </p>
        </form>
      </CardContent>
    </Card>
  );
};
