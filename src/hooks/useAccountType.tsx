/**
 * Hook to manage user account types and switching
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { attemptBootRecovery, isAuthError, shouldAttemptRecovery } from '@/utils/bootRecovery';

export type AccountType = 
  | 'creator'
  | 'advertiser'
  | 'agency'
  | 'podcaster'
  | 'event_planner'
  | 'brand'
  | 'studio_team'
  | 'admin'
  | 'influencer';

// Database-compatible type (without influencer until migration)
type DbAccountType = Exclude<AccountType, 'influencer'> | 'influencer';

interface AccountTypeData {
  account_type: AccountType | null;
  active_account_type: AccountType | null;
  account_types_enabled: string[];
  onboarding_completed: boolean;
  onboarding_data: any;
}

export function useAccountType() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['accountType'],
    queryFn: async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError) {
          console.error('[useAccountType] Auth error:', authError);
          // If auth error and recovery is allowed, trigger it
          if (isAuthError(authError) && shouldAttemptRecovery()) {
            attemptBootRecovery();
          }
          return null;
        }
        
        if (!user) return null;

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('account_type, active_account_type, account_types_enabled, onboarding_completed, onboarding_data')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error('[useAccountType] Profile fetch error:', profileError);
          // If RLS/auth error (406, etc.), attempt recovery
          if (isAuthError(profileError) && shouldAttemptRecovery()) {
            attemptBootRecovery();
          }
          // Return null instead of throwing to prevent stuck loading
          return null;
        }
        
        return profile as AccountTypeData;
      } catch (err) {
        console.error('[useAccountType] Unexpected error:', err);
        if (isAuthError(err) && shouldAttemptRecovery()) {
          attemptBootRecovery();
        }
        return null;
      }
    },
    retry: 1,
    retryDelay: 1000,
  });

  const switchAccountType = useMutation({
    mutationFn: async (newType: AccountType) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Check if user has this type enabled
      if (!data?.account_types_enabled?.includes(newType)) {
        throw new Error('Account type not enabled');
      }

      const { error } = await supabase
        .from('profiles')
        .update({ active_account_type: newType as any })
        .eq('id', user.id);

      if (error) throw error;
      return newType;
    },
    onSuccess: (newType) => {
      queryClient.invalidateQueries({ queryKey: ['accountType'] });
      toast({
        title: 'Account type switched',
        description: `Now viewing as ${newType}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to switch account type',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const enableAccountType = useMutation({
    mutationFn: async (newType: AccountType) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const currentTypes = data?.account_types_enabled || [];
      if (currentTypes.includes(newType)) {
        return; // Already enabled
      }

      const updatedTypes = [...currentTypes, newType];

      const { error } = await supabase
        .from('profiles')
        .update({
          account_types_enabled: updatedTypes,
          active_account_type: newType as any,
        })
        .eq('id', user.id);

      if (error) throw error;
      return newType;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accountType'] });
    },
  });

  const completeOnboarding = useMutation({
    mutationFn: async (updates: { 
      account_type: AccountType;
      onboarding_data?: any;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('profiles')
        .update({
          account_type: updates.account_type as any,
          active_account_type: updates.account_type as any,
          account_types_enabled: [updates.account_type],
          onboarding_completed: true,
          onboarding_data: updates.onboarding_data || {},
        })
        .eq('id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accountType'] });
    },
  });

  return {
    accountType: data?.account_type,
    activeAccountType: data?.active_account_type,
    accountTypesEnabled: data?.account_types_enabled || [],
    // Only return false if we explicitly know onboarding is not completed
    // Return undefined/null if we don't have data yet to prevent false redirects
    onboardingCompleted: data ? data.onboarding_completed : undefined,
    onboardingData: data?.onboarding_data,
    isLoading,
    error,
    switchAccountType: switchAccountType.mutate,
    isSwitching: switchAccountType.isPending,
    enableAccountType: enableAccountType.mutate,
    completeOnboarding: completeOnboarding.mutate,
    isCompletingOnboarding: completeOnboarding.isPending,
  };
}
