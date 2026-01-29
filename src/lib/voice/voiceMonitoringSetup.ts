/**
 * Voice Monitoring Setup
 * 
 * Handles automatic setup of voice fingerprints and monitoring sources
 * after successful voice certification
 */

import { supabase } from "@/integrations/supabase/client";

export interface VoiceMonitoringSetupResult {
  fingerprintId: string;
  monitoringSourcesCreated: number;
  success: boolean;
  error?: string;
}

/**
 * Auto-setup voice monitoring after successful certification
 * Creates fingerprint + monitoring sources for main platforms
 */
export async function setupVoiceMonitoring(
  userId: string,
  voiceProfileId: string,
  voiceFingerprint: string
): Promise<VoiceMonitoringSetupResult> {
  try {
    // Step 1: Check if fingerprint already exists
    const existingResult = await (supabase as any)
      .from("voice_fingerprints")
      .select("id")
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle();
    
    const existingFingerprint = existingResult.data as any;

    let fingerprintId: string;

    if (existingFingerprint) {
      // Update existing fingerprint
      const updateResult = await (supabase as any)
        .from("voice_fingerprints")
        .update({
          credential_id: voiceProfileId,
          fingerprint_id: voiceFingerprint,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingFingerprint.id)
        .select()
        .single();

      if (updateResult.error) throw updateResult.error;
      fingerprintId = (updateResult.data as any).id;
    } else {
      // Create new fingerprint
      const insertResult = await (supabase as any)
        .from("voice_fingerprints")
        .insert({
          user_id: userId,
          credential_id: voiceProfileId,
          fingerprint_id: voiceFingerprint,
          status: "active",
        })
        .select()
        .single();

      if (insertResult.error) throw insertResult.error;
      fingerprintId = (insertResult.data as any).id;
    }

    // Step 2: Auto-create monitoring sources for main platforms
    const platforms = [
      { platform: "youtube", label: "YouTube" },
      { platform: "spotify", label: "Spotify" },
      { platform: "apple_podcasts", label: "Apple Podcasts" },
      { platform: "tiktok", label: "TikTok" },
      { platform: "instagram", label: "Instagram" },
      { platform: "twitter", label: "Twitter/X" },
    ];

    // Check existing sources
    const sourcesResult = await (supabase as any)
      .from("voice_monitoring_sources")
      .select("platform")
      .eq("user_id", userId);
    
    const existingSources = sourcesResult.data as any[] || [];

    const existingPlatforms = new Set(
      existingSources.map((s: any) => s.platform)
    );

    // Insert only missing platforms
    const newSources = platforms
      .filter((p) => !existingPlatforms.has(p.platform))
      .map((p) => ({
        user_id: userId,
        platform: p.platform,
        label: p.label,
        is_active: true,
      }));

    let sourcesCreated = 0;
    if (newSources.length > 0) {
      const insertResult = await (supabase as any)
        .from("voice_monitoring_sources")
        .insert(newSources);

      if (insertResult.error) {
        console.error("Error creating monitoring sources:", insertResult.error);
      } else {
        sourcesCreated = newSources.length;
      }
    }

    return {
      fingerprintId,
      monitoringSourcesCreated: sourcesCreated,
      success: true,
    };
  } catch (error) {
    console.error("Error setting up voice monitoring:", error);
    return {
      fingerprintId: "",
      monitoringSourcesCreated: 0,
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * Check if user has voice fingerprint enabled
 */
export async function hasVoiceFingerprint(userId: string): Promise<boolean> {
  const result = await (supabase as any)
    .from("voice_fingerprints")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();

  if (result.error) {
    console.error("Error checking voice fingerprint:", result.error);
    return false;
  }

  return !!result.data;
}

/**
 * Check if user has active monitoring sources
 */
export async function hasActiveMonitoring(userId: string): Promise<boolean> {
  const result = await (supabase as any)
    .from("voice_monitoring_sources")
    .select("id")
    .eq("user_id", userId)
    .eq("is_active", true)
    .limit(1);

  if (result.error) {
    console.error("Error checking monitoring sources:", result.error);
    return false;
  }

  return ((result.data as any[]) || []).length > 0;
}
