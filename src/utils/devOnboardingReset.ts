/**
 * Dev-only onboarding reset utilities
 * Used for testing the full onboarding flow
 */

import { supabase } from '@/integrations/supabase/client';

// Allowlisted emails for dev testing (can use force=true)
const DEV_ALLOWLIST_EMAILS = [
  'andrew@seeksy.io',
  'coco@seeksy.io',
  'test@seeksy.io',
  'admin@seeksy.io',
];

// Check if current user is allowed to use dev features
export async function isDevUser(): Promise<boolean> {
  // Always allow in development mode
  if (import.meta.env.DEV) return true;
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) return false;
    
    return DEV_ALLOWLIST_EMAILS.includes(user.email.toLowerCase());
  } catch {
    return false;
  }
}

// All localStorage keys that might affect onboarding state
const ONBOARDING_LOCALSTORAGE_KEYS = [
  'onboarding_step',
  'onboarding_data',
  'onboarding_just_completed',
  'seen_onboarding',
  'spark_intro_seen',
  'dashboard_intro_seen',
  'tour_completed',
  'tourMode',
  'welcome_modal_dismissed',
];

// Clear all localStorage flags related to onboarding
export function clearOnboardingLocalStorage(): void {
  ONBOARDING_LOCALSTORAGE_KEYS.forEach(key => {
    localStorage.removeItem(key);
  });
  
  // Also clear sessionStorage flags
  sessionStorage.removeItem('onboarding_just_completed');
  sessionStorage.removeItem('tourMode');
  
  console.log('[DevOnboardingReset] Cleared all onboarding localStorage/sessionStorage flags');
}

// Reset onboarding state in database
export async function resetOnboardingDatabase(): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Reset profiles table
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        onboarding_completed: false,
        onboarding_data: null,
        account_type: null,
        active_account_type: null,
        account_types_enabled: [],
      })
      .eq('id', user.id);

    if (profileError) {
      console.error('[DevOnboardingReset] Profile update error:', profileError);
      return { success: false, error: profileError.message };
    }

    // Reset user_preferences table
    const { error: prefsError } = await supabase
      .from('user_preferences')
      .update({
        onboarding_completed: false,
        onboarding_progress: null,
      })
      .eq('user_id', user.id);

    if (prefsError) {
      console.error('[DevOnboardingReset] Preferences update error:', prefsError);
      // Don't fail on this - preferences row might not exist
    }

    console.log('[DevOnboardingReset] Database reset complete for user:', user.id);
    return { success: true };
  } catch (err) {
    console.error('[DevOnboardingReset] Unexpected error:', err);
    return { success: false, error: String(err) };
  }
}

// Full reset: clears localStorage + database
export async function fullOnboardingReset(): Promise<{ success: boolean; error?: string }> {
  // Clear localStorage first
  clearOnboardingLocalStorage();
  
  // Then reset database
  return resetOnboardingDatabase();
}

// Check if force mode is enabled in URL
export function isForceOnboardingMode(): boolean {
  const params = new URLSearchParams(window.location.search);
  return params.get('force') === 'true';
}
