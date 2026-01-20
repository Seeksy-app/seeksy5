import { 
  Video, Upload, Scissors, FolderOpen, Calendar, 
  ListTodo, Wand2, Mic, Sparkles, BarChart3,
  Share2, CheckCircle, ClipboardList, FileText, Shield
} from "lucide-react";
import { DashboardWidget } from "./types";

export const defaultWidgets: DashboardWidget[] = [
  // Studio Tools
  {
    id: "studio-tools",
    name: "My Studio Tools",
    description: "Quick access to recording and media tools",
    icon: Video,
    category: "studio",
    enabled: true,
    expanded: true,
    order: 0,
  },
  // Upcoming Meetings
  {
    id: "upcoming-meetings",
    name: "Upcoming Meetings & Events",
    description: "Your scheduled meetings and events",
    icon: Calendar,
    category: "calendar",
    enabled: true,
    expanded: true,
    order: 1,
  },
  // Latest Recordings
  {
    id: "latest-recordings",
    name: "Latest Recordings",
    description: "Your most recent media uploads",
    icon: FolderOpen,
    category: "media",
    enabled: true,
    expanded: true,
    order: 2,
  },
  // AI Quick Actions
  {
    id: "ai-quick-actions",
    name: "AI Quick Actions",
    description: "AI-powered tools for content creation",
    icon: Wand2,
    category: "ai",
    enabled: true,
    expanded: true,
    order: 3,
  },
  // Performance Overview
  {
    id: "performance-overview",
    name: "Performance Overview",
    description: "Activity summary and stats",
    icon: BarChart3,
    category: "analytics",
    enabled: true,
    expanded: true,
    order: 4,
  },
  // Tasks & Notes
  {
    id: "tasks-notes",
    name: "Tasks & Notes",
    description: "Your to-do list and quick notes",
    icon: ListTodo,
    category: "tasks",
    enabled: true,
    expanded: true,
    order: 5,
  },
  // Marketing & Publishing
  {
    id: "marketing-publishing",
    name: "Marketing & Publishing",
    description: "Social publishing and content distribution",
    icon: Share2,
    category: "marketing",
    enabled: true,
    expanded: true,
    order: 6,
  },
  // Recommended Actions
  {
    id: "recommended-actions",
    name: "Recommended Actions",
    description: "Suggested next steps to grow your presence",
    icon: CheckCircle,
    category: "actions",
    enabled: true,
    expanded: true,
    order: 7,
  },
  // Identity Verification
  {
    id: "identity-verification",
    name: "Voice & Face Verification",
    description: "Verify your identity to unlock monetization",
    icon: Shield,
    category: "actions",
    enabled: true,
    expanded: true,
    order: 8,
  },
];

// All available widgets (including disabled ones)
export const allAvailableWidgets: DashboardWidget[] = [
  ...defaultWidgets,
  // Additional widgets users can add
  {
    id: "clips-highlights",
    name: "Clips & Highlights",
    description: "Generated video clips and highlights",
    icon: Scissors,
    category: "media",
    enabled: false,
    expanded: true,
    order: 8,
  },
  {
    id: "contacts",
    name: "Contacts",
    description: "Your contact list and recent additions",
    icon: ClipboardList,
    category: "tasks",
    enabled: false,
    expanded: true,
    order: 9,
  },
  {
    id: "templates",
    name: "Templates",
    description: "Saved templates for quick creation",
    icon: FileText,
    category: "studio",
    enabled: false,
    expanded: true,
    order: 10,
  },
  {
    id: "quick-create",
    name: "Quick Create",
    description: "Create new content quickly",
    icon: Sparkles,
    category: "studio",
    enabled: false,
    expanded: true,
    order: 11,
  },
];
