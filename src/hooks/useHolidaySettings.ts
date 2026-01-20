/**
 * Hook to fetch and manage Holiday Mode settings from database
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_HOLIDAY_SETTINGS, HolidaySettings } from "@/config/holidayMode";

export async function fetchHolidaySettings(): Promise<HolidaySettings> {
  try {
    const { data, error } = await supabase
      .from("app_settings")
      .select("holiday_mode, holiday_snow")
      .eq("key", "global")
      .maybeSingle();

    if (error) {
      console.warn("Failed to fetch holiday settings, using defaults:", error);
      return DEFAULT_HOLIDAY_SETTINGS;
    }

    if (!data) {
      return DEFAULT_HOLIDAY_SETTINGS;
    }

    return {
      holidayMode: data.holiday_mode ?? DEFAULT_HOLIDAY_SETTINGS.holidayMode,
      holidaySnow: data.holiday_snow ?? DEFAULT_HOLIDAY_SETTINGS.holidaySnow,
    };
  } catch (err) {
    console.error("Error fetching holiday settings:", err);
    return DEFAULT_HOLIDAY_SETTINGS;
  }
}

export function useHolidaySettings() {
  return useQuery({
    queryKey: ["holiday-settings"],
    queryFn: fetchHolidaySettings,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: true,
  });
}
