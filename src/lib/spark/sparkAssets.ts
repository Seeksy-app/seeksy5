/**
 * Seeksy Spark Asset Utilities
 * Handles dynamic asset selection based on theme, season, and holiday mode
 */

export type SparkPose = 
  | "idle"
  | "happy"
  | "thinking"
  | "waving"
  | "idea"
  | "typing";

export type SparkSize = "full" | "icon-32" | "icon-20" | "icon-16";

// Global holiday mode state (updated by components via setHolidayMode)
let holidayModeEnabled = false;

/**
 * Set the global holiday mode state
 */
export const setHolidayMode = (enabled: boolean) => {
  holidayModeEnabled = enabled;
};

/**
 * Get the current holiday mode state
 */
export const getHolidayMode = () => holidayModeEnabled;

/**
 * Detect current theme from DOM or system preference
 */
export const getCurrentTheme = (): "light" | "dark" => {
  // Check if data-theme is set on html element
  const htmlElement = document.documentElement;
  const dataTheme = htmlElement.getAttribute("data-theme");
  
  if (dataTheme === "dark") return "dark";
  if (dataTheme === "light") return "light";
  
  // Check class-based theme (Tailwind dark mode)
  if (htmlElement.classList.contains("dark")) return "dark";
  
  // Fallback to system preference
  if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  
  return "light";
};

/**
 * Get the appropriate Spark asset path based on pose, theme, and holiday mode
 */
export const getSparkAsset = (
  pose: SparkPose = "idle",
  size: SparkSize = "full",
  forceTheme?: "light" | "dark",
  forceHoliday?: boolean
): string => {
  const theme = forceTheme || getCurrentTheme();
  const useHoliday = forceHoliday !== undefined ? forceHoliday : holidayModeEnabled;
  
  // Icon sizes
  if (size !== "full") {
    return `/spark/icons/spark-icon-${size.replace("icon-", "")}.png`;
  }
  
  // Holiday mode - use Santa Spark variants
  if (useHoliday) {
    // Map pose names to match actual file names
    const poseMap: Record<SparkPose, string> = {
      idle: "idle",
      happy: "happy",
      thinking: "idle", // fallback
      waving: "wave",
      idea: "idle", // fallback
      typing: "typing"
    };
    const mappedPose = poseMap[pose] || "idle";
    return `/spark/holiday/spark_${mappedPose}_santa.png`;
  }
  
  // Regular assets
  if (theme === "dark") {
    return `/spark/dark/spark-${pose}-dark.png`;
  }
  
  return `/spark/base/spark-${pose}.png`;
};

/**
 * Preload critical Spark assets for smoother animations
 */
export const preloadSparkAssets = () => {
  const theme = getCurrentTheme();
  
  const assetsToPreload = [
    getSparkAsset("idle", "full", theme),
    getSparkAsset("waving", "full", theme),
    getSparkAsset("thinking", "full", theme),
    getSparkAsset("typing", "full", theme),
  ];
  
  assetsToPreload.forEach(src => {
    const img = new Image();
    img.src = src;
  });
};
