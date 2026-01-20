import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  trackSubscriptionStarted, 
  trackSubscriptionCompleted, 
  trackSubscriptionError 
} from '@/utils/gtm';

interface SubscribeOptions {
  email: string;
  name?: string;
  source?: string;
  ctaId?: string;
}

interface SubscribeResult {
  success: boolean;
  subscriberId?: string;
  tenantId?: string;
  error?: string;
}

/**
 * Unified newsletter subscription hook that routes all subscriptions
 * through the edge function for proper tenant scoping.
 * 
 * SECURITY: Never accepts tenant_id from client - derived from CTA only.
 * ANALYTICS: Uses single GTM path via trackEvent functions.
 */
export function useNewsletterSubscribe() {
  const [isLoading, setIsLoading] = useState(false);

  const subscribe = async (options: SubscribeOptions): Promise<SubscribeResult> => {
    const { email, name, source = 'website', ctaId } = options;
    
    if (!email?.trim()) {
      return { success: false, error: 'Email is required' };
    }

    setIsLoading(true);

    const emailDomain = email.split('@')[1] || 'unknown';
    const eventPayload = {
      email_domain: emailDomain,
      source: source,
      cta_id: ctaId || 'none',
    };

    // Fire subscription_started BEFORE API call (tracks attempt)
    trackSubscriptionStarted(eventPayload);

    try {
      const response = await supabase.functions.invoke('subscribe-newsletter', {
        body: { 
          email: email.trim(), 
          name: name?.trim() || null,
          source,
          cta_id: ctaId || null
        }
      });

      if (response.error) {
        console.warn('Subscription edge function error:', response.error);
        trackSubscriptionError({ ...eventPayload, error_message: response.error.message });
        return { success: false, error: response.error.message };
      }

      if (!response.data?.success) {
        console.warn('Subscription failed:', response.data?.error);
        trackSubscriptionError({ ...eventPayload, error_message: response.data?.error || 'Unknown error' });
        return { success: false, error: response.data?.error };
      }

      // Fire subscription_completed ONLY on actual success
      trackSubscriptionCompleted({
        ...eventPayload,
        subscriber_id: response.data.subscriber_id,
        tenant_id: response.data.tenant_id
      });

      return {
        success: true,
        subscriberId: response.data.subscriber_id,
        tenantId: response.data.tenant_id
      };
    } catch (error) {
      console.warn('Subscription error:', error);
      trackSubscriptionError({ ...eventPayload, error_message: 'Network or server error' });
      return { success: false, error: 'Backend error' };
    } finally {
      setIsLoading(false);
    }
  };

  return { subscribe, isLoading };
}

// Platform CTA IDs for common use cases (UUIDs from cta_definitions)
// These are bound to seeksy_platform tenant
export const PLATFORM_CTA_IDS = {
  BLOG_GATE: 'bab86227-0886-4ad8-8293-73badf8e581c',
  FOOTER: '95a4f634-0a07-44af-9dd3-e74da750e82d',
  WEBSITE: '166b6d99-60c2-405a-a67c-fa46adb1e8e4',
  PROFILE: '720227f9-6750-43ab-809b-d28bc647ebab'
} as const;
