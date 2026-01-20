/**
 * Admin Navigation Configuration
 * 
 * This config is ONLY for admin/super_admin users.
 * Creator navigation is handled by useNavPreferences hook.
 */

export type UserRole = 'creator' | 'subscriber' | 'advertiser' | 'influencer' | 'agency' | 'admin' | 'super_admin' | 'board_member' | 'platform_owner' | 'support_admin' | 'support_agent' | 'team_manager' | 'read_only_analyst' | 'cfo' | 'cmo' | 'cco' | 'manager' | 'ad_manager';

export interface NavigationItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  roles: UserRole[];
  description?: string;
}

export interface NavigationGroup {
  group: string;
  description?: string;
  collapsible?: boolean;
  items: NavigationItem[];
}

export const NAVIGATION_CONFIG: {
  roles: UserRole[];
  navigation: NavigationGroup[];
} = {
  "roles": [
    "admin",
    "super_admin",
    "board_member",
    "cfo",
    "cmo",
    "cco",
    "manager"
  ],
  "navigation": [
    {
      "group": "Dashboard",
      "description": "Admin overview and quick access",
      "collapsible": false,
      "items": [
        {
          "id": "admin_dashboard",
          "label": "Dashboard",
          "icon": "layout-dashboard",
          "path": "/admin",
          "roles": ["admin", "super_admin", "cfo", "cmo", "cco", "manager"]
        },
        {
          "id": "admin_inbox_quick",
          "label": "Inbox",
          "icon": "inbox",
          "path": "/admin/email-client",
          "roles": ["admin", "super_admin", "cmo", "cco"]
        }
      ]
    },
    {
      "group": "Email Suite",
      "description": "Email management and communications",
      "collapsible": true,
      "items": [
        {
          "id": "admin_email_inbox",
          "label": "Inbox",
          "icon": "inbox",
          "path": "/admin/email-client",
          "roles": ["admin", "super_admin", "cmo", "cco"]
        },
        {
          "id": "admin_email_settings",
          "label": "Settings",
          "icon": "settings",
          "path": "/admin/email-settings",
          "roles": ["admin", "super_admin", "cmo", "cco"]
        }
      ]
    },
    {
      "group": "Advertising and Sales",
      "description": "Advertising, campaigns, sales, and revenue management",
      "collapsible": true,
      "items": [
        {
          "id": "admin_advertising",
          "label": "Advertising Management",
          "icon": "megaphone",
          "path": "/admin/advertising",
          "roles": ["admin", "super_admin", "cmo"]
        },
        {
          "id": "admin_rate_desk",
          "label": "Rate Desk",
          "icon": "dollar-sign",
          "path": "/admin/advertising/rate-desk",
          "roles": ["admin", "super_admin", "cfo"]
        },
        {
          "id": "admin_ad_campaigns",
          "label": "Ad Campaigns",
          "icon": "radio",
          "path": "/admin/ad-campaigns",
          "roles": ["admin", "super_admin", "cmo"]
        },
        {
          "id": "admin_ad_inventory",
          "label": "Ad Inventory",
          "icon": "package",
          "path": "/admin/ad-inventory",
          "roles": ["admin", "super_admin", "cfo", "cmo"]
        },
        {
          "id": "admin_ad_analytics",
          "label": "Ad Analytics",
          "icon": "trending-up",
          "path": "/admin/ad-analytics",
          "roles": ["admin", "super_admin", "cfo", "cmo"]
        },
        {
          "id": "admin_revenue_insights",
          "label": "Revenue Insights",
          "icon": "bar-chart-2",
          "path": "/admin/revenue-insights",
          "roles": ["admin", "super_admin", "cfo", "cmo"]
        },
        {
          "id": "admin_lead_manager",
          "label": "Lead Manager",
          "icon": "user-plus",
          "path": "/admin/sales-leads",
          "roles": ["admin", "super_admin", "cmo"]
        }
      ]
    },

    {
      "group": "Share",
      "description": "Private share pages for demos and proposals",
      "collapsible": true,
      "items": [
        {
          "id": "admin_share_pages",
          "label": "Share Pages",
          "icon": "share-2",
          "path": "/admin/share",
          "roles": ["admin", "super_admin", "cfo", "cmo"]
        }
      ]
    },
    {
      "group": "Admin Legal",
      "description": "Legal agreements and document management",
      "collapsible": true,
      "items": [
        {
          "id": "admin_form_templates",
          "label": "Form Templates",
          "icon": "file-text",
          "path": "/admin/legal/form-templates",
          "roles": ["admin", "super_admin", "cfo"]
        },
        {
          "id": "admin_doc_instances",
          "label": "Documents",
          "icon": "file-signature",
          "path": "/admin/legal/docs",
          "roles": ["admin", "super_admin", "cfo"]
        },
        {
          "id": "admin_legal_library",
          "label": "Documents Library",
          "icon": "library",
          "path": "/admin/legal/templates",
          "roles": ["admin", "super_admin", "cfo"]
        },
        {
          "id": "admin_legal_agreements",
          "label": "Stock Agreements",
          "icon": "file-signature",
          "path": "/admin/legal/generate-docx",
          "roles": ["admin", "super_admin", "cfo"]
        },
        {
          "id": "admin_pending_investments",
          "label": "Pending Investments",
          "icon": "clock",
          "path": "/admin/legal/pending-investments",
          "roles": ["admin", "super_admin", "cfo"]
        }
      ]
    },

    {
      "group": "Business Operations",
      "description": "Support, sales, billing, and operations",
      "collapsible": true,
      "items": [
        {
          "id": "admin_users",
          "label": "All Users",
          "icon": "users",
          "path": "/admin/creators",
          "roles": ["admin", "super_admin", "cfo"]
        },
        {
          "id": "admin_site_leads",
          "label": "Site Leads",
          "icon": "globe",
          "path": "/admin/site-leads",
          "roles": ["admin", "super_admin", "cmo"],
          "description": "Website visitors requesting demos or info"
        },
        {
          "id": "admin_billing_payments",
          "label": "Billing & Payments",
          "icon": "credit-card",
          "path": "/admin/billing",
          "roles": ["admin", "super_admin", "cfo", "manager"]
        },
        {
          "id": "admin_cco_dashboard",
          "label": "CCO Communications",
          "icon": "message-circle",
          "path": "/admin/cco",
          "roles": ["admin", "super_admin", "cco"]
        }
      ]
    },

    {
      "group": "Meetings",
      "description": "Meeting management and scheduling",
      "collapsible": true,
      "items": [
        {
          "id": "admin_meetings_dashboard",
          "label": "Dashboard",
          "icon": "layout-dashboard",
          "path": "/admin/meetings",
          "roles": ["admin", "super_admin", "platform_owner", "support_admin", "cmo", "cco", "cfo"]
        },
        {
          "id": "admin_meeting_types",
          "label": "Meeting Types",
          "icon": "calendar-check",
          "path": "/admin/meetings/types",
          "roles": ["admin", "super_admin", "platform_owner"]
        },
        {
          "id": "admin_booking_links",
          "label": "Booking Links",
          "icon": "link",
          "path": "/admin/meetings/links",
          "roles": ["admin", "super_admin", "platform_owner", "support_admin"]
        },
        {
          "id": "admin_scheduled_meetings",
          "label": "Scheduled Meetings",
          "icon": "calendar",
          "path": "/admin/meetings/scheduled",
          "roles": ["admin", "super_admin", "platform_owner", "support_admin", "cmo", "cco", "cfo"]
        },
        {
          "id": "admin_team_availability",
          "label": "Team Availability",
          "icon": "clock",
          "path": "/admin/meetings/availability",
          "roles": ["admin", "super_admin", "platform_owner"]
        },
        {
          "id": "admin_meeting_settings",
          "label": "Settings",
          "icon": "settings",
          "path": "/admin/meetings/settings",
          "roles": ["admin", "super_admin", "platform_owner"]
        }
      ]
    },

    {
      "group": "Financials",
      "description": "Financial planning and analysis",
      "collapsible": true,
      "items": [
        {
          "id": "admin_milestones",
          "label": "Milestones",
          "icon": "flag",
          "path": "/admin/milestones",
          "roles": ["admin", "super_admin", "cfo", "cmo", "cco"]
        },
        {
          "id": "admin_cfo_assumptions",
          "label": "CFO Assumption Studio",
          "icon": "sliders",
          "path": "/cfo/assumptions",
          "roles": ["admin", "super_admin", "cfo"]
        },
        {
          "id": "admin_proforma_events",
          "label": "Awards Pro Forma",
          "icon": "trophy",
          "path": "/cfo/proforma/events-awards",
          "roles": ["admin", "super_admin", "cfo", "board_member"]
        },
        {
          "id": "admin_swot",
          "label": "SWOT Analysis",
          "icon": "target",
          "path": "/admin/financials/swot",
          "roles": ["admin", "super_admin", "cfo", "board_member"]
        },
        {
          "id": "admin_investor_spreadsheets",
          "label": "Investor Spreadsheets",
          "icon": "file-spreadsheet",
          "path": "/admin/investor-spreadsheets",
          "roles": ["admin", "super_admin", "cfo"]
        },
        {
          "id": "admin_sales_opportunities",
          "label": "Sales Opportunities",
          "icon": "briefcase",
          "path": "/admin/cfo/sales-opportunities",
          "roles": ["admin", "super_admin", "cfo"]
        },
        {
          "id": "admin_opportunity_proformas",
          "label": "Opportunity Pro Formas",
          "icon": "bar-chart-3",
          "path": "/admin/cfo/opportunity-proformas",
          "roles": ["admin", "super_admin", "cfo"]
        }
      ]
    },

    {
      "group": "Marketing",
      "description": "Marketing campaigns and growth",
      "collapsible": true,
      "items": [
        {
          "id": "admin_cmo_dashboard",
          "label": "CMO Command Center",
          "icon": "target",
          "path": "/admin/cmo",
          "roles": ["admin", "super_admin", "cmo"]
        },
        {
          "id": "admin_roi_calculator",
          "label": "ROI Calculator",
          "icon": "calculator",
          "path": "/admin/financials/roi-calculator",
          "roles": ["admin", "super_admin", "cfo", "cmo"]
        },
        {
          "id": "admin_subscriber_lists",
          "label": "Subscriber Lists",
          "icon": "users",
          "path": "/admin/marketing/subscribers",
          "roles": ["admin", "super_admin", "cmo"],
          "description": "Newsletter and email subscribers"
        },
        {
          "id": "admin_funnels",
          "label": "Funnels & Attribution",
          "icon": "git-branch",
          "path": "/admin/marketing/funnels",
          "roles": ["admin", "super_admin", "cmo"]
        },
        {
          "id": "admin_seo_branding",
          "label": "SEO & Branding",
          "icon": "search",
          "path": "/admin/marketing/seo",
          "roles": ["admin", "super_admin", "cmo"]
        },
        {
          "id": "admin_gbp_manager",
          "label": "GBP Manager",
          "icon": "map-pin",
          "path": "/admin/gbp",
          "roles": ["admin", "super_admin", "cmo"],
          "description": "Manage Google Business Profile listings"
        },
        {
          "id": "admin_leads",
          "label": "Leads",
          "icon": "target",
          "path": "/admin/leads",
          "roles": ["admin", "super_admin", "cmo"],
          "description": "Lead Intelligence and visitor tracking"
        },
        {
          "id": "admin_analytics_gsc_ga4",
          "label": "Analytics (GSC + GA4)",
          "icon": "bar-chart-3",
          "path": "/admin/analytics",
          "roles": ["admin", "super_admin", "cmo"],
          "description": "Google Search Console and GA4 metrics"
        },
        {
          "id": "admin_logo_manager",
          "label": "Logo Manager",
          "icon": "image",
          "path": "/admin/logo-manager",
          "roles": ["admin", "super_admin", "cmo"]
        },
        {
          "id": "admin_hero_manager",
          "label": "Hero Manager",
          "icon": "layout",
          "path": "/admin/hero-manager",
          "roles": ["admin", "super_admin", "cmo"]
        },
        {
          "id": "admin_brand_settings",
          "label": "Brand Settings",
          "icon": "palette",
          "path": "/admin/brand-settings",
          "roles": ["admin", "super_admin", "cmo"]
        }
      ]
    },

    {
      "group": "Content Management",
      "description": "Content and media administration",
      "collapsible": true,
      "items": [
        {
          "id": "admin_style_guide",
          "label": "Style Guide",
          "icon": "palette",
          "path": "/admin/content/style-guide",
          "roles": ["admin", "super_admin"],
          "description": "Brand tokens, typography, and component library"
        },
        {
          "id": "admin_seeksy_tv",
          "label": "Seeksy TV",
          "icon": "tv",
          "path": "/admin/seeksy-tv",
          "roles": ["admin", "super_admin", "cco"],
          "description": "Manage Seeksy TV content and imports"
        },
        {
          "id": "admin_seeksy_tv_advertising",
          "label": "TV Advertising",
          "icon": "megaphone",
          "path": "/admin/seeksy-tv/advertising",
          "roles": ["admin", "super_admin", "ad_manager"],
          "description": "Manage Seeksy TV ad inventory and placements"
        },
        {
          "id": "admin_master_blog",
          "label": "Master Blog",
          "icon": "book-open",
          "path": "/admin/master-blog",
          "roles": ["admin", "super_admin", "cco"]
        },
        {
          "id": "admin_knowledge_hub",
          "label": "Knowledge Hub",
          "icon": "library",
          "path": "/admin/knowledge-base",
          "roles": ["admin", "super_admin", "cfo", "cmo", "cco"]
        },
        {
          "id": "admin_blog_management",
          "label": "Blog Content Generator",
          "icon": "settings-2",
          "path": "/admin/blog-management",
          "roles": ["admin", "super_admin", "cco"]
        },
        {
          "id": "admin_media_library",
          "label": "Media Library",
          "icon": "folder",
          "path": "/admin/content/media-library",
          "roles": ["admin", "super_admin", "cco"]
        },
        {
          "id": "admin_demo_videos",
          "label": "Demo Videos",
          "icon": "video",
          "path": "/admin/demo-videos",
          "roles": ["admin", "super_admin", "cco"],
          "description": "Board-ready demo videos for investors"
        },
        {
          "id": "admin_video_pages",
          "label": "Video Pages",
          "icon": "film",
          "path": "/admin/video-pages",
          "roles": ["admin", "super_admin", "cco"],
          "description": "Manage gated video collections"
        },
        {
          "id": "admin_personas",
          "label": "AI Personas",
          "icon": "bot",
          "path": "/admin/personas",
          "roles": ["admin", "super_admin", "cco"]
        },
        {
          "id": "admin_help_desk",
          "label": "Help Desk",
          "icon": "headphones",
          "path": "/admin/helpdesk",
          "roles": ["admin", "super_admin", "support_admin", "support_agent", "cco"],
          "description": "Customer support ticket management"
        }
      ]
    },

    {
      "group": "Project Management",
      "description": "Tasks and project tracking",
      "collapsible": true,
      "items": [
        {
          "id": "admin_tasks",
          "label": "Tasks",
          "icon": "list-todo",
          "path": "/admin/tasks",
          "roles": ["admin", "super_admin", "manager", "cfo", "cmo", "cco"],
          "description": "Task management and tracking"
        },
        {
          "id": "admin_projects",
          "label": "Projects",
          "icon": "folder",
          "path": "/admin/projects",
          "roles": ["admin", "super_admin", "manager"]
        }
      ]
    },

    {
      "group": "User Management",
      "description": "User, team, and access management",
      "collapsible": true,
      "items": [
        {
          "id": "admin_team_members",
          "label": "Team Members",
          "icon": "users",
          "path": "/admin/team-members",
          "roles": ["admin", "super_admin"]
        },
        {
          "id": "admin_permissions",
          "label": "Roles & Permissions",
          "icon": "shield-check",
          "path": "/admin/permissions",
          "roles": ["admin", "super_admin"]
        },
        {
          "id": "admin_identity",
          "label": "Identity & Certification",
          "icon": "fingerprint",
          "path": "/admin/identity",
          "roles": ["admin", "super_admin"]
        },
        {
          "id": "admin_impersonate",
          "label": "Impersonate User",
          "icon": "user-cog",
          "path": "/admin/impersonate",
          "roles": ["admin", "super_admin"]
        }
      ]
    },

    {
      "group": "R&D & Intelligence",
      "description": "Research and market intelligence",
      "collapsible": true,
      "items": [
        {
          "id": "admin_rd_feeds",
          "label": "R&D Intelligence Feeds",
          "icon": "rss",
          "path": "/admin/rd-feeds",
          "roles": ["admin", "super_admin", "cfo", "cmo"]
        },
        {
          "id": "admin_agent_training",
          "label": "Agent Training",
          "icon": "brain",
          "path": "/admin/agent-training",
          "roles": ["admin", "super_admin"],
          "description": "AI agent knowledge health and training"
        },
        {
          "id": "admin_market_intelligence",
          "label": "Market Intelligence",
          "icon": "globe",
          "path": "/admin/market-intelligence",
          "roles": ["admin", "super_admin", "cfo", "cmo"]
        }
      ]
    },

    {
      "group": "Developer Tools",
      "description": "API, webhooks, and system tools",
      "collapsible": true,
      "items": [
        {
          "id": "admin_integrations",
          "label": "Integrations",
          "icon": "puzzle",
          "path": "/admin/integrations",
          "roles": ["admin", "super_admin"]
        },
        {
          "id": "admin_keys_vault",
          "label": "API Keys",
          "icon": "key",
          "path": "/admin/keys-vault",
          "roles": ["admin", "super_admin"]
        },
        {
          "id": "admin_webhooks",
          "label": "Webhooks",
          "icon": "webhook",
          "path": "/admin/webhooks",
          "roles": ["admin", "super_admin"]
        },
        {
          "id": "admin_logs",
          "label": "Logs",
          "icon": "scroll-text",
          "path": "/admin/logs",
          "roles": ["admin", "super_admin"]
        },
        {
          "id": "admin_architecture",
          "label": "Architecture",
          "icon": "network",
          "path": "/admin/architecture",
          "roles": ["admin", "super_admin"]
        },
        {
          "id": "admin_tech_stack",
          "label": "Tech Stack",
          "icon": "layers",
          "path": "/admin/tech-stack",
          "roles": ["admin", "super_admin"]
        },
        {
          "id": "admin_system_status",
          "label": "System Status",
          "icon": "activity",
          "path": "/admin/system-status",
          "roles": ["admin", "super_admin"]
        },
        {
          "id": "admin_security",
          "label": "Security",
          "icon": "shield-check",
          "path": "/admin/security",
          "roles": ["admin", "super_admin"]
        },
        {
          "id": "admin_data_recovery",
          "label": "Data Recovery",
          "icon": "database-backup",
          "path": "/admin/data-recovery",
          "roles": ["admin", "super_admin"]
        },
        {
          "id": "admin_notes",
          "label": "Notes",
          "icon": "notebook-pen",
          "path": "/admin/notes",
          "roles": ["admin", "super_admin"]
        }
      ]
    },

    {
      "group": "Support",
      "description": "Help resources",
      "collapsible": true,
      "items": [
        {
          "id": "admin_help_center",
          "label": "Help Center",
          "icon": "help-circle",
          "path": "/admin/help",
          "roles": ["admin", "super_admin", "cfo", "cmo", "cco", "manager"]
        }
      ]
    },

    {
      "group": "Admin Settings",
      "description": "System configuration and administration",
      "collapsible": true,
      "items": [
        {
          "id": "admin_module_organizer",
          "label": "Module Organizer",
          "icon": "layout-grid",
          "path": "/admin/module-organizer",
          "roles": ["admin", "super_admin"]
        },
        {
          "id": "admin_global_settings",
          "label": "Global Settings",
          "icon": "settings",
          "path": "/admin/settings",
          "roles": ["admin", "super_admin"]
        },
        {
          "id": "admin_system_tools",
          "label": "System Tools",
          "icon": "wrench",
          "path": "/admin/system-tools",
          "roles": ["admin", "super_admin"]
        },
        {
          "id": "admin_team_roles",
          "label": "Team & Roles",
          "icon": "users",
          "path": "/admin/settings/team",
          "roles": ["admin", "super_admin"]
        }
      ]
    }
  ]
};

/**
 * Filter navigation items by user roles (admin only)
 */
export function filterNavigationByRoles(
  navigation: NavigationGroup[],
  userRoles: UserRole[]
): NavigationGroup[] {
  if (!userRoles || userRoles.length === 0) {
    return [];
  }

  // Check if user has any admin-level role
  const hasAdminAccess = userRoles.some(role => 
    ['admin', 'super_admin', 'cfo', 'cmo', 'cco', 'manager', 'board_member'].includes(role)
  );
  
  if (!hasAdminAccess) {
    return [];
  }

  return navigation
    .map(group => ({
      ...group,
      items: group.items.filter(item => 
        item.roles.some(role => userRoles.includes(role))
      )
    }))
    .filter(group => group.items.length > 0);
}
