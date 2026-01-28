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

interface FaceAsset {
  id: string;
  cert_status: string;
  cert_explorer_url: string | null;
}

interface VoiceCert {
  id: string;
  certification_status: string;
  is_active: boolean;
  cert_explorer_url: string | null;
  voice_profile_id: string | null;
}

interface VoiceProfile {
  id: string;
  is_verified: boolean;
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
      const faceResult = await (supabase as any)
        .from('identity_assets')
        .select('id, cert_status, cert_explorer_url')
        .eq('user_id', user.id)
        .eq('type', 'face_identity')
        .eq('cert_status', 'minted')
        .is('revoked_at', null)
        .maybeSingle();

      const faceAsset = faceResult.data as FaceAsset | null;
      console.log('[useIdentityStatus] Face asset:', faceAsset, 'Error:', faceResult.error);

      // Check voice blockchain certificate (primary source for voice verification)
      const certResult = await (supabase as any)
        .from('voice_blockchain_certificates')
        .select('id, certification_status, is_active, cert_explorer_url, voice_profile_id')
        .eq('creator_id', user.id)
        .eq('certification_status', 'verified')
        .eq('is_active', true)
        .maybeSingle();

      const voiceCert = certResult.data as VoiceCert | null;
      console.log('[useIdentityStatus] Voice cert:', voiceCert, 'Error:', certResult.error);

      // Also check creator_voice_profiles as fallback
      const profileResult = await (supabase as any)
        .from('creator_voice_profiles')
        .select('id, is_verified')
        .eq('user_id', user.id)
        .eq('is_verified', true)
        .maybeSingle();

      const voiceProfile = profileResult.data as VoiceProfile | null;
      console.log('[useIdentityStatus] Voice profile:', voiceProfile, 'Error:', profileResult.error);

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
