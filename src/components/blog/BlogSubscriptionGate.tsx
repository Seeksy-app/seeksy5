import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { gtmEvents } from '@/utils/gtm';
import { useNewsletterSubscribe, PLATFORM_CTA_IDS } from '@/hooks/useNewsletterSubscribe';

interface BlogSubscriptionGateProps {
  postId: string;
  postTitle?: string;
  isGated?: boolean;
  children: React.ReactNode;
}

const GATE_DISMISSED_KEY = 'blog_gate_dismissed_session';

export const BlogSubscriptionGate = ({ 
  postId, 
  postTitle = '',
  isGated = true, 
  children
}: BlogSubscriptionGateProps) => {
  const [showGate, setShowGate] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [email, setEmail] = useState('');
  const [gateImpression, setGateImpression] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { subscribe, isLoading } = useNewsletterSubscribe();

  // Check if user is admin (skip gate)
  const [isAdmin, setIsAdmin] = useState(false);
  
  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: roles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);
        
        if (roles?.some(r => ['admin', 'super_admin'].includes(r.role))) {
          setIsAdmin(true);
        }
      }
    };
    checkAdmin();
  }, []);

  // Check session storage for dismissed state
  useEffect(() => {
    const dismissedPosts = sessionStorage.getItem(GATE_DISMISSED_KEY);
    if (dismissedPosts) {
      const parsed = JSON.parse(dismissedPosts);
      if (parsed.includes(postId)) {
        setDismissed(true);
      }
    }
  }, [postId]);

  // Scroll tracking for 40% trigger
  useEffect(() => {
    if (!isGated || dismissed || subscribed || isAdmin) return;

    const handleScroll = () => {
      if (!contentRef.current) return;
      
      const rect = contentRef.current.getBoundingClientRect();
      const contentHeight = contentRef.current.scrollHeight;
      const scrolledAmount = window.scrollY + window.innerHeight - rect.top;
      const scrollPercentage = scrolledAmount / contentHeight;
      
      if (scrollPercentage >= 0.4 && !showGate) {
        setShowGate(true);
        
        // Track impression (only once)
        if (!gateImpression) {
          setGateImpression(true);
          trackGateEvent('impression');
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isGated, dismissed, subscribed, showGate, gateImpression, isAdmin]);

  const trackGateEvent = (eventType: 'impression' | 'dismiss') => {
    console.log(`[BlogGate] Event: ${eventType} for post ${postId}`);
    
    // Push GTM events
    if (eventType === 'impression') {
      gtmEvents.subscriptionGateShown(postId, postTitle);
    }
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    // Always show success UI immediately - analytics fires in hook
    setSubscribed(true);
    setShowGate(false);
    toast({
      title: 'Subscribed!',
      description: 'You now have full access to all articles.',
    });

    // Call edge function via hook (non-blocking, analytics already fired)
    await subscribe({
      email,
      source: 'blog_gate',
      ctaId: PLATFORM_CTA_IDS.BLOG_GATE
    });
  };

  const handleDismiss = () => {
    trackGateEvent('dismiss');
    setDismissed(true);
    setShowGate(false);
    
    // Store in session storage
    const dismissedPosts = sessionStorage.getItem(GATE_DISMISSED_KEY);
    const parsed = dismissedPosts ? JSON.parse(dismissedPosts) : [];
    parsed.push(postId);
    sessionStorage.setItem(GATE_DISMISSED_KEY, JSON.stringify(parsed));
  };

  // If not gated, admin, or already subscribed/dismissed, show full content
  if (!isGated || isAdmin || subscribed || dismissed) {
    return <div ref={contentRef}>{children}</div>;
  }

  return (
    <div ref={contentRef} className="relative">
      {children}
      
      {/* Blur overlay when gate is triggered */}
      {showGate && (
        <>
          {/* Gradient fade into blur */}
          <div 
            className="absolute inset-x-0 bottom-0 h-[60%] pointer-events-none"
            style={{
              background: 'linear-gradient(to bottom, transparent 0%, hsl(var(--background)) 30%)',
            }}
          />
          
          {/* Subscription modal overlay - positioned just under the fade start */}
          <div className="absolute inset-x-0 top-[45%] flex items-start justify-center pointer-events-none">
            <div className="pointer-events-auto bg-card border border-border rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
              <button
                onClick={handleDismiss}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="text-center">
                <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-7 h-7 text-primary" />
                </div>
                
                <h3 className="text-xl font-bold mb-2 text-foreground">
                  Read more from Seeksy
                </h3>
                <p className="text-muted-foreground mb-6">
                  Subscribe to keep reading and get weekly creator insights.
                </p>
                
                <form onSubmit={handleSubscribe} className="space-y-3">
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12"
                  />
                  <Button 
                    type="submit" 
                    className="w-full h-12"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Subscribing...' : 'Subscribe'}
                  </Button>
                </form>
                
                <button
                  onClick={handleDismiss}
                  className="mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Not now
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
