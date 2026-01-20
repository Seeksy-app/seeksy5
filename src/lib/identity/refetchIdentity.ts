import { QueryClient } from "@tanstack/react-query";

/**
 * Central utility to refetch all identity-related data across the app.
 * Call this after any identity-changing event (face verify, voice mint, revocation, etc.)
 */
export const refetchUserIdentity = async (queryClient: QueryClient) => {
  console.log('[refetchUserIdentity] Starting global identity refresh...');
  
  // Force refetch all critical identity queries
  await Promise.all([
    queryClient.refetchQueries({ 
      queryKey: ['identity-status'], 
      type: 'all',
      exact: true 
    }),
    queryClient.refetchQueries({ 
      queryKey: ['voice-identity-status'], 
      type: 'all',
      exact: true 
    }),
    queryClient.refetchQueries({ 
      queryKey: ['identity-assets'], 
      type: 'all',
      exact: true 
    }),
    queryClient.refetchQueries({ 
      queryKey: ['auth-user'], 
      type: 'all',
      exact: true 
    }),
    queryClient.refetchQueries({ 
      queryKey: ['identity-rights-settings'], 
      type: 'all',
      exact: true 
    }),
  ]);
  
  console.log('[refetchUserIdentity] Identity refresh complete');
};
