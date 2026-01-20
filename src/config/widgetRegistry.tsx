import { WidgetDefinition } from "@/types/dashboard";
import {
  RecentEpisodesWidget,
  IdentityStatusWidget,
  ClipLibraryWidget,
  BrandRequestsWidget,
} from "@/components/dashboard-v2/widgets";

export const WIDGET_REGISTRY: WidgetDefinition[] = [
  // Content & Podcasting
  {
    id: "recent-episodes",
    type: "recent-episodes",
    name: "Recent Episodes",
    description: "Your latest podcast episodes",
    category: "content",
    component: RecentEpisodesWidget,
  },
  {
    id: "clip-library",
    type: "clip-library",
    name: "Clip Library",
    description: "AI-generated video clips",
    category: "content",
    component: ClipLibraryWidget,
  },

  // Identity & Rights
  {
    id: "identity-status",
    type: "identity-status",
    name: "Identity Verification",
    description: "Face and voice verification status",
    category: "identity",
    component: IdentityStatusWidget,
  },

  // Monetization
  {
    id: "brand-requests",
    type: "brand-requests",
    name: "Brand Requests",
    description: "Advertiser access requests",
    category: "monetization",
    component: BrandRequestsWidget,
  },
];
