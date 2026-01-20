import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useNewsletterSubscribe, PLATFORM_CTA_IDS } from '@/hooks/useNewsletterSubscribe';
import { trackSubscriptionStarted } from '@/lib/analytics';

export function FooterSubscribe() {
  const [email, setEmail] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const { subscribe, isLoading } = useNewsletterSubscribe();

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    trackSubscriptionStarted();

    const result = await subscribe({
      email,
      source: 'footer',
      ctaId: PLATFORM_CTA_IDS.FOOTER
    });

    if (result.success) {
      setIsSuccess(true);
      setEmail('');
      toast.success("You're subscribed! Check your email for preferences.");
    } else {
      toast.error('Failed to subscribe. Please try again.');
    }
  };

  if (isSuccess) {
    return (
      <div className="flex items-center gap-2 text-green-500">
        <CheckCircle className="w-5 h-5" />
        <span className="text-sm">Subscribed! Check your inbox.</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubscribe} className="flex gap-2 w-full max-w-md">
      <div className="relative flex-1">
        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          className="pl-10"
          required
        />
      </div>
      <Button type="submit" disabled={isLoading}>
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Subscribe'}
      </Button>
    </form>
  );
}
