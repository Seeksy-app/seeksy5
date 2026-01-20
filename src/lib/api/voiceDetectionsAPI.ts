/**
 * Voice Detections API
 * 
 * Client-side API for fetching and managing voice detections
 */

import { supabase } from "@/integrations/supabase/client";

export interface VoiceDetectionFilters {
  platform?: string[];
  status?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  usageCategory?: string[];
}

export interface VoiceDetection {
  id: string;
  user_id: string;
  voice_fingerprint_id: string | null;
  platform: string;
  source_type: string;
  source_id: string | null;
  source_title: string | null;
  source_url: string | null;
  detected_at: string;
  first_spoken_at_sec: number | null;
  last_spoken_at_sec: number | null;
  confidence: number | null;
  usage_category: string | null;
  status: string;
  notes: string | null;
  raw_metadata: any;
  linked_revenue_event_id: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Fetches voice detections for the current user with optional filters
 */
export async function getVoiceDetectionsForUser(
  userId: string,
  filters?: VoiceDetectionFilters
): Promise<VoiceDetection[]> {
  let query = supabase
    .from("voice_detections")
    .select("*")
    .eq("user_id", userId)
    .order("detected_at", { ascending: false });

  // Apply platform filter
  if (filters?.platform && filters.platform.length > 0) {
    query = query.in("platform", filters.platform);
  }

  // Apply status filter
  if (filters?.status && filters.status.length > 0) {
    query = query.in("status", filters.status);
  }

  // Apply date range filter
  if (filters?.dateRange) {
    query = query
      .gte("detected_at", filters.dateRange.start.toISOString())
      .lte("detected_at", filters.dateRange.end.toISOString());
  }

  // Apply usage category filter
  if (filters?.usageCategory && filters.usageCategory.length > 0) {
    query = query.in("usage_category", filters.usageCategory);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching voice detections:", error);
    throw error;
  }

  return (data as VoiceDetection[]) || [];
}

/**
 * Updates the status of a voice detection
 */
export async function updateVoiceDetectionStatus(
  detectionId: string,
  status: string,
  notes?: string
): Promise<void> {
  const updateData: any = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (notes !== undefined) {
    updateData.notes = notes;
  }

  // If status is "licensed", create placeholder for revenue event link
  if (status === "licensed") {
    // PLACEHOLDER: Create or link revenue event
    // This would eventually call an edge function to:
    // 1. Create a revenue_events entry
    // 2. Link it to this detection via linked_revenue_event_id
    console.log("[Voice Detection] Status set to 'licensed' - revenue event integration pending");
  }

  const { error } = await supabase
    .from("voice_detections")
    .update(updateData)
    .eq("id", detectionId);

  if (error) {
    console.error("Error updating voice detection status:", error);
    throw error;
  }
}

/**
 * Gets detection count statistics by platform
 */
export async function getDetectionStatsByPlatform(
  userId: string
): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from("voice_detections")
    .select("platform")
    .eq("user_id", userId);

  if (error) {
    console.error("Error fetching detection stats:", error);
    return {};
  }

  const stats: Record<string, number> = {};
  (data || []).forEach((detection: any) => {
    stats[detection.platform] = (stats[detection.platform] || 0) + 1;
  });

  return stats;
}

/**
 * Gets recent detection count for dashboard summary
 */
export async function getRecentDetectionCount(
  userId: string,
  days: number = 7
): Promise<number> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { count, error } = await supabase
    .from("voice_detections")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("detected_at", startDate.toISOString());

  if (error) {
    console.error("Error fetching recent detection count:", error);
    return 0;
  }

  return count || 0;
}
