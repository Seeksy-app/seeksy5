/**
 * OnboardingTooltipSystem - DISABLED
 * This component is permanently disabled to prevent random popups.
 */

export interface TooltipStep {
  id: string;
  target: string;
  title: string;
  content: string;
  position?: "top" | "bottom" | "left" | "right";
}

interface OnboardingTooltipSystemProps {
  enabled?: boolean;
}

export function OnboardingTooltipSystem({ enabled = false }: OnboardingTooltipSystemProps) {
  // DISABLED: Onboarding tooltips are permanently disabled
  return null;
}

export function resetOnboardingTooltips() {
  localStorage.removeItem("seeksy-onboarding-tooltips-dismissed");
}
