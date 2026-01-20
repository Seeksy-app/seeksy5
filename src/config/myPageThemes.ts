// My Page v2 Theme Configuration

export interface MyPageTheme {
  // Profile
  displayName: string;
  username: string;
  bio: string;
  imageStyle: "circular" | "square" | "portrait";
  profileImage: string | null;
  
  // Theme Colors
  themeColor: string;
  backgroundColor: string;
  profileImageBgColor: string;
  titleColor: string;
  bioColor: string;
  linkColor: string;
  
  // Background
  backgroundType: "solid" | "gradient" | "image";
  backgroundGradient?: {
    from: string;
    to: string;
    direction: "to-t" | "to-tr" | "to-r" | "to-br" | "to-b" | "to-bl" | "to-l" | "to-tl";
  };
  backgroundImage?: string;
  
  // Card Style
  cardStyle: "round" | "square" | "shadow" | "glass";
  cardShadow: boolean;
  
  // Typography
  titleFont: string;
  textSize: "small" | "medium" | "large";
  
  // Link Style
  linkShape: "rounded" | "oval" | "rectangle";
  linkStyle: "default" | "gradient" | "shadow" | "outline" | "filled";
  
  // Mode
  mode: "light" | "dark";
  
  // Sections
  sections: MyPageSection[];

  // Social Links
  socialLinks?: Record<string, any>;
}

export interface MyPageSection {
  id: string;
  type: "featured-video" | "featured-podcast" | "stream" | "social" | "custom-links" | "embed" | "shop" | "voice-badge" | "meetings";
  enabled: boolean;
  order: number;
  config?: any;
}

export const defaultTheme: MyPageTheme = {
  displayName: "",
  username: "",
  bio: "",
  imageStyle: "circular",
  profileImage: null,
  
  themeColor: "#3b82f6",
  backgroundColor: "#ffffff",
  profileImageBgColor: "#f3f4f6",
  titleColor: "#1f2937",
  bioColor: "#6b7280",
  linkColor: "#3b82f6",
  
  backgroundType: "solid",
  
  cardStyle: "shadow",
  cardShadow: true,
  
  titleFont: "sans",
  textSize: "medium",
  
  linkShape: "rounded",
  linkStyle: "filled",
  
  mode: "light",
  
  sections: [
    { id: "stream", type: "stream", enabled: true, order: 0 },
    { id: "meetings", type: "meetings", enabled: true, order: 1 },
    { id: "social", type: "social", enabled: true, order: 2 },
  ],
};

export const fontOptions = [
  { value: "sans", label: "Inter", className: "font-sans" },
  { value: "serif", label: "Playfair Display", className: "font-serif" },
  { value: "script", label: "Dancing Script", className: "font-['Dancing_Script']" },
  { value: "mono", label: "Roboto Mono", className: "font-mono" },
  { value: "poppins", label: "Poppins", className: "font-['Poppins']" },
  { value: "montserrat", label: "Montserrat", className: "font-['Montserrat']" },
];

export const colorPalette = [
  "#000000", "#1f2937", "#991b1b", "#dc2626", "#ea580c", "#f97316",
  "#d946ef", "#a855f7", "#0000ff", "#3b82f6", "#06b6d4", "#10b981",
  "#ffffff", "#f3f4f6", "#fecaca", "#fca5a5", "#fdba74", "#fb923c",
];
