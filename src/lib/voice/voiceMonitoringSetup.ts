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
    const { data: existingFingerprint } = await supabase
      .from("voice_fingerprints")
      .select("id")
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle();

    let fingerprintId: string;

    if (existingFingerprint) {
      // Update existing fingerprint
      const { data, error } = await supabase
        .from("voice_fingerprints")
        .update({
          credential_id: voiceProfileId,
          fingerprint_id: voiceFingerprint,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingFingerprint.id)
        .select()
        .single();

      if (error) throw error;
      fingerprintId = data.id;
    } else {
      // Create new fingerprint
      const { data, error } = await supabase
        .from("voice_fingerprints")
        .insert({
          user_id: userId,
          credential_id: voiceProfileId,
          fingerprint_id: voiceFingerprint,
          status: "active",
        })
        .select()
        .single();

      if (error) throw error;
      fingerprintId = data.id;
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
    const { data: existingSources } = await supabase
      .from("voice_monitoring_sources")
      .select("platform")
      .eq("user_id", userId);

    const existingPlatforms = new Set(
      (existingSources || []).map((s: any) => s.platform)
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
      const { error } = await supabase
        .from("voice_monitoring_sources")
        .insert(newSources);

      if (error) {
        console.error("Error creating monitoring sources:", error);
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
  const { data, error } = await supabase
    .from("voice_fingerprints")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();

  if (error) {
    console.error("Error checking voice fingerprint:", error);
    return false;
  }

  return !!data;
}

/**
 * Check if user has active monitoring sources
 */
export async function hasActiveMonitoring(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("voice_monitoring_sources")
    .select("id")
    .eq("user_id", userId)
    .eq("is_active", true)
    .limit(1);

  if (error) {
    console.error("Error checking monitoring sources:", error);
    return false;
  }

  return (data || []).length > 0;
}
