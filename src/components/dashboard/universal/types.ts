import { LucideIcon } from "lucide-react";

export interface DashboardWidget {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  category: WidgetCategory;
  enabled: boolean;
  expanded: boolean;
  order: number;
}

export type WidgetCategory = 
  | "studio" 
  | "media" 
  | "ai" 
  | "calendar" 
  | "analytics" 
  | "tasks" 
  | "marketing" 
  | "actions";

export interface WidgetConfig {
  widgets: DashboardWidget[];
  version: number;
}

export const WIDGET_CATEGORIES: Record<WidgetCategory, { label: string; colorClass: string }> = {
  studio: { label: "Studio", colorClass: "bg-primary/10 text-primary" },
  media: { label: "Media", colorClass: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300" },
  ai: { label: "AI Tools", colorClass: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300" },
  calendar: { label: "Calendar", colorClass: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" },
  analytics: { label: "Analytics", colorClass: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" },
  tasks: { label: "Tasks", colorClass: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300" },
  marketing: { label: "Marketing", colorClass: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  actions: { label: "Actions", colorClass: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300" },
};
