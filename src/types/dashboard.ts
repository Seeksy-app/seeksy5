export interface DashboardWidget {
  id: string;
  type: string;
  category: string;
  enabled: boolean;
  position?: { x: number; y: number };
}

export interface DashboardTemplate {
  id: string;
  name: string;
  description: string;
  widgets: string[]; // Widget type IDs
  targetAudience: string[];
}

export interface WidgetDefinition {
  id: string;
  type: string;
  name: string;
  description: string;
  category: 'content' | 'identity' | 'monetization' | 'meetings' | 'social' | 'admin';
  component: React.ComponentType<any>;
  minWidth?: number;
  minHeight?: number;
}
