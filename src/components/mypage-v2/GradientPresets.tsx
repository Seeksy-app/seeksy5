export const GRADIENT_PRESETS = [
  {
    name: "Sunrise",
    gradient: { from: "#ff6b6b", to: "#ffd93d", direction: "br" },
    preview: "linear-gradient(to bottom right, #ff6b6b, #ffd93d)",
  },
  {
    name: "Cosmic",
    gradient: { from: "#6366f1", to: "#ec4899", direction: "br" },
    preview: "linear-gradient(to bottom right, #6366f1, #ec4899)",
  },
  {
    name: "Electric Blue",
    gradient: { from: "#3b82f6", to: "#06b6d4", direction: "br" },
    preview: "linear-gradient(to bottom right, #3b82f6, #06b6d4)",
  },
  {
    name: "Soft Violet",
    gradient: { from: "#a78bfa", to: "#c084fc", direction: "br" },
    preview: "linear-gradient(to bottom right, #a78bfa, #c084fc)",
  },
  {
    name: "Forest",
    gradient: { from: "#10b981", to: "#059669", direction: "br" },
    preview: "linear-gradient(to bottom right, #10b981, #059669)",
  },
  {
    name: "Ocean",
    gradient: { from: "#0ea5e9", to: "#0284c7", direction: "br" },
    preview: "linear-gradient(to bottom right, #0ea5e9, #0284c7)",
  },
];

export const THEME_PRESETS = [
  {
    name: "Creator",
    description: "Vibrant and engaging",
    themeColor: "#3b82f6",
    backgroundColor: "#ffffff",
    backgroundType: "gradient" as const,
    backgroundGradient: { from: "#eff6ff", to: "#dbeafe", direction: "br" },
    cardStyle: "glass" as const,
  },
  {
    name: "Minimal",
    description: "Clean and focused",
    themeColor: "#18181b",
    backgroundColor: "#ffffff",
    backgroundType: "solid" as const,
    cardStyle: "square" as const,
  },
  {
    name: "Bold",
    description: "High contrast",
    themeColor: "#dc2626",
    backgroundColor: "#000000",
    backgroundType: "solid" as const,
    cardStyle: "shadow" as const,
  },
  {
    name: "Dark",
    description: "Modern dark mode",
    themeColor: "#8b5cf6",
    backgroundColor: "#0f172a",
    backgroundType: "gradient" as const,
    backgroundGradient: { from: "#0f172a", to: "#1e293b", direction: "br" },
    cardStyle: "glass" as const,
  },
];
