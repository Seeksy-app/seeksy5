// Lead Magnet Engine Configuration
// Now uses database for storage, with fallback to hardcoded values

import { supabase } from "@/integrations/supabase/client";

export interface LeadMagnetOffer {
  id: string;
  title: string;
  description: string;
  pdfPath: string;
  bullets: string[];
  audienceRoles?: string[];
}

export interface PersonaConfig {
  label: string;
  icon: string;
}

// Persona display configuration (labels and icons)
export const personaConfig: Record<string, PersonaConfig> = {
  podcaster: { label: "Podcaster", icon: "🎙️" },
  influencer: { label: "Creator / Influencer", icon: "⭐" },
  event_creator: { label: "Event Host / Speaker", icon: "🎤" },
  business: { label: "Business Professional", icon: "💼" },
  advertiser: { label: "Brand / Advertiser", icon: "📢" },
  investor: { label: "Investor / Analyst", icon: "📊" },
  agency: { label: "Agency / Consultant", icon: "🏢" },
};

// Fetch lead magnets from database
export async function fetchLeadMagnetsFromDB(audienceRole?: string): Promise<LeadMagnetOffer[]> {
  try {
    let query = supabase
      .from("lead_magnets")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (audienceRole) {
      query = query.contains("audience_roles", [audienceRole]);
    }

    const { data, error } = await query;
    
    if (error) {
      console.error("Error fetching lead magnets:", error);
      return [];
    }

    return (data || []).map((item: any) => ({
      id: item.slug,
      title: item.title,
      description: item.description || "",
      pdfPath: item.storage_path,
      bullets: item.bullets || [],
      audienceRoles: item.audience_roles || [],
    }));
  } catch (error) {
    console.error("Error fetching lead magnets:", error);
    return [];
  }
}

// Get offers grouped by persona from database
export async function getLeadMagnetOffersByPersonaFromDB(persona: string): Promise<LeadMagnetOffer[]> {
  return fetchLeadMagnetsFromDB(persona);
}

// Get all persona options for selector
export function getPersonaOptions(): Array<{ id: string; label: string; icon: string }> {
  return Object.entries(personaConfig).map(([id, config]) => ({
    id,
    label: config.label,
    icon: config.icon,
  }));
}

// Generate signed URL for a lead magnet PDF
export async function getLeadMagnetSignedUrl(pdfPath: string): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage
      .from("lead-magnets")
      .createSignedUrl(pdfPath, 60 * 60 * 24 * 7); // 7 days

    if (error) {
      console.error("Error generating signed URL:", error);
      return null;
    }

    return data.signedUrl;
  } catch (error) {
    console.error("Error generating signed URL:", error);
    return null;
  }
}

// Legacy exports for backward compatibility - now fetches from DB
// These are kept for any code that might still use synchronous access
export const leadMagnetOffers: Record<string, { label: string; icon: string; offers: LeadMagnetOffer[] }> = {};

export function getLeadMagnetOffersByPersona(persona: string): LeadMagnetOffer[] {
  // This function is now async-dependent, return empty for sync calls
  // Use getLeadMagnetOffersByPersonaFromDB for actual data
  console.warn("getLeadMagnetOffersByPersona is deprecated, use getLeadMagnetOffersByPersonaFromDB");
  return [];
}

export function getOfferById(offerId: string): LeadMagnetOffer | null {
  console.warn("getOfferById is deprecated, use database queries directly");
  return null;
}

export function getPersonaByOfferId(offerId: string): string | null {
  console.warn("getPersonaByOfferId is deprecated");
  return null;
}
