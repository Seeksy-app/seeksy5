import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail } from "lucide-react";
import { toast } from "sonner";
import { useNewsletterSubscribe, PLATFORM_CTA_IDS } from "@/hooks/useNewsletterSubscribe";

interface NewsletterSubscribeWidgetProps {
  userId: string;
  heading?: string;
  description?: string;
  ctaId?: string;
}

export const NewsletterSubscribeWidget = ({ 
  userId, 
  heading = "Stay Updated",
  description = "Subscribe to get the latest updates delivered to your inbox.",
  ctaId = PLATFORM_CTA_IDS.PROFILE
}: NewsletterSubscribeWidgetProps) => {
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
      source: 'profile',
      ctaId
    });

    if (result.success) {
      toast.success("Successfully subscribed!");
      setEmail("");
      setName("");
    } else {
      toast.error(result.error || "Failed to subscribe. Please try again.");
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-2 mb-2">
          <Mail className="w-5 h-5" />
          <CardTitle>{heading}</CardTitle>
        </div>
        <CardDescription>
          {description}
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
        </form>
      </CardContent>
    </Card>
  );
};
