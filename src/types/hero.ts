export type HeroVariant = 'studio' | 'holiday' | 'technology';

export type MotionType = 'none' | 'light_shimmer' | 'bokeh_twinkle' | 'icon_float';

export interface HeroAsset {
  id: string;
  variant: HeroVariant;
  staticUrl: string;
  motionUrl?: string;
  motionType?: MotionType;
  createdAt: string;
}

export interface HeroOverlaySettings {
  overlayPosition: 'left' | 'center' | 'right';
  overlayOpacity: number; // 0-1
  textAlign: 'left' | 'center';
  headline: string;
  subheadline: string;
  motionEnabled: boolean;
  motionType: MotionType;
}

export const DEFAULT_OVERLAY_SETTINGS: Record<HeroVariant, Pick<HeroOverlaySettings, 'headline' | 'subheadline'>> = {
  studio: {
    headline: "Your Identity. Your Creativity. Fully Protected.",
    subheadline: "Verify your face and voice, create AI-powered clips, and certify your content on-chain — all from one studio."
  },
  holiday: {
    headline: "Holiday campaigns, protected by identity.",
    subheadline: "Run festive clips and campaigns with verified creators and blockchain-backed identity protection."
  },
  technology: {
    headline: "Face, voice, and clips — secured by design.",
    subheadline: "Abstract identity, voice prints, and certificates visualized with a clean, Apple/Stripe-style hero."
  }
};
