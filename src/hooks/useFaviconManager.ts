import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type FaviconMode = "auto" | "default" | "holiday" | "winter";

interface FaviconSettings {
  mode: FaviconMode;
  defaultPack: string[];
  holidayPack: string[];
  winterPack: string[];
}

const DEFAULT_FAVICON_SETTINGS: FaviconSettings = {
  mode: "auto",
  defaultPack: ["/favicon-orange.png"],
  holidayPack: ["/favicon-orange.png"],
  winterPack: ["/favicon-orange.png"],
};

// Random rotation interval: 4-6 hours (in milliseconds)
const getRandomRotationInterval = () => {
  const minHours = 4;
  const maxHours = 6;
  const hours = minHours + Math.random() * (maxHours - minHours);
  return hours * 60 * 60 * 1000;
};

export const useFaviconManager = () => {
  const [faviconUrl, setFaviconUrl] = useState<string>(DEFAULT_FAVICON_SETTINGS.defaultPack[0]);

  // Fetch favicon settings from database (admin-controlled)
  const { data: settings } = useQuery({
    queryKey: ["favicon-settings"],
    queryFn: async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("*")
        .eq("key", "favicon_settings")
        .single();
      
      if (!data || !data.holiday_mode) return DEFAULT_FAVICON_SETTINGS;
      return {
        ...DEFAULT_FAVICON_SETTINGS,
        mode: data.holiday_mode ? "auto" : "default"
      } as FaviconSettings;
    },
  });

  useEffect(() => {
    const currentSettings = settings || DEFAULT_FAVICON_SETTINGS;
    
    // Determine which pack to use based on mode and date
    const selectFaviconPack = (): string[] => {
      if (currentSettings.mode === "auto") {
        const now = new Date();
        const month = now.getMonth() + 1; // 1-indexed
        const day = now.getDate();

        // Nov 15 – Jan 5 → Holiday
        if ((month === 11 && day >= 15) || month === 12 || (month === 1 && day <= 5)) {
          return currentSettings.holidayPack;
        }
        // Jan 5 – Feb 15 → Winter
        else if ((month === 1 && day > 5) || (month === 2 && day <= 15)) {
          return currentSettings.winterPack;
        }
        // All other dates → Default
        return currentSettings.defaultPack;
      } else if (currentSettings.mode === "holiday") {
        return currentSettings.holidayPack;
      } else if (currentSettings.mode === "winter") {
        return currentSettings.winterPack;
      }
      return currentSettings.defaultPack;
    };

    const updateFavicon = () => {
      const pack = selectFaviconPack();
      const randomIndex = Math.floor(Math.random() * pack.length);
      const selectedUrl = pack[randomIndex];
      
      setFaviconUrl(selectedUrl);

      // Update favicon link element
      const faviconLink = document.querySelector<HTMLLinkElement>("link[rel='icon']");
      if (faviconLink) {
        faviconLink.href = selectedUrl;
      } else {
        const newLink = document.createElement("link");
        newLink.rel = "icon";
        newLink.type = "image/png";
        newLink.href = selectedUrl;
        document.head.appendChild(newLink);
      }
    };

    // Initial favicon set
    updateFavicon();

    // Set up random rotation (4-6 hours)
    const rotationInterval = setInterval(() => {
      updateFavicon();
    }, getRandomRotationInterval());

    return () => clearInterval(rotationInterval);
  }, [settings]);

  return { faviconUrl };
};
