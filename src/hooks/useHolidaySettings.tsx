import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface HolidaySettings {
  holidayMode: boolean;
  holidaySnow: boolean;
}

const DEFAULT_HOLIDAY_SETTINGS: HolidaySettings = {
  holidayMode: false,
  holidaySnow: false,
};

// Helper function to check if we're in holiday season (Dec 1-31)
export const isHolidaySeason = () => {
  const now = new Date();
  const month = now.getMonth(); // 0-indexed (11 = December)
  return month === 11; // December only
};

export const useHolidaySettings = () => {
  return useQuery({
    queryKey: ["holiday-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_settings")
        .select("holiday_mode, holiday_snow")
        .eq("key", "global")
        .maybeSingle();

      if (error) {
        console.error("Error fetching holiday settings:", error);
        return DEFAULT_HOLIDAY_SETTINGS;
      }

      // Map snake_case DB columns to camelCase
      if (data) {
        return {
          holidayMode: data.holiday_mode,
          holidaySnow: data.holiday_snow,
        };
      }

      return DEFAULT_HOLIDAY_SETTINGS;
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
};
