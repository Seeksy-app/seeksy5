import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface IdentityStatus {
  faceVerified: boolean;
  voiceVerified: boolean;
  overallStatus: 'verified' | 'partial' | 'none';
  faceExplorerUrl: string | null;
  voiceExplorerUrl: string | null;
  faceAssetId: string | null;
  voiceProfileId: string | null;
}

export const useIdentityStatus = () => {
  return useQuery({
    queryKey: ['identity-status'],
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchInterval: 10000, // Refetch every 10 seconds to catch updates
    queryFn: async (): Promise<IdentityStatus> => {
      console.log('[useIdentityStatus] Fetching identity status...');
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log('[useIdentityStatus] No user authenticated');
        return {
          faceVerified: false,
          voiceVerified: false,
          overallStatus: 'none',
          faceExplorerUrl: null,
          voiceExplorerUrl: null,
          faceAssetId: null,
          voiceProfileId: null,
        };
      }

      console.log('[useIdentityStatus] User ID:', user.id);

      // Check face identity from identity_assets
      const { data: faceAsset, error: faceError } = await supabase
        .from('identity_assets')
        .select('id, cert_status, cert_explorer_url')
        .eq('user_id', user.id)
        .eq('type', 'face_identity')
        .eq('cert_status', 'minted')
        .is('revoked_at', null)
        .maybeSingle();

      console.log('[useIdentityStatus] Face asset:', faceAsset, 'Error:', faceError);

      // Check voice blockchain certificate (primary source for voice verification)
      const { data: voiceCert, error: certError } = await supabase
        .from('voice_blockchain_certificates')
        .select('id, certification_status, is_active, cert_explorer_url, voice_profile_id')
        .eq('creator_id', user.id)
        .eq('certification_status', 'verified')
        .eq('is_active', true)
        .maybeSingle();

      console.log('[useIdentityStatus] Voice cert:', voiceCert, 'Error:', certError);

      // Also check creator_voice_profiles as fallback
      const { data: voiceProfile, error: profileError } = await supabase
        .from('creator_voice_profiles')
        .select('id, is_verified')
        .eq('user_id', user.id)
        .eq('is_verified', true)
        .maybeSingle();

      console.log('[useIdentityStatus] Voice profile:', voiceProfile, 'Error:', profileError);

      const faceVerified = !!faceAsset;
      // Voice is verified if either blockchain certificate OR voice profile is verified
      const voiceVerified = !!voiceCert || !!voiceProfile;

      console.log('[useIdentityStatus] Final status:', { faceVerified, voiceVerified });

      let overallStatus: 'verified' | 'partial' | 'none' = 'none';
      if (faceVerified && voiceVerified) {
        overallStatus = 'verified';
      } else if (faceVerified || voiceVerified) {
        overallStatus = 'partial';
      }

      return {
        faceVerified,
        voiceVerified,
        overallStatus,
        faceExplorerUrl: faceAsset?.cert_explorer_url || null,
        voiceExplorerUrl: voiceCert?.cert_explorer_url || null,
        faceAssetId: faceAsset?.id || null,
        voiceProfileId: voiceCert?.voice_profile_id || null,
      };
    },
  });
};
