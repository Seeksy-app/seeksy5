/**
 * Product Tour Configuration
 * Central configuration for all page-level product tours
 * 
 * Each page has:
 * - basic: 4 fundamental tips for first-time users
 * - advanced: 4 additional tips for power users
 */

export type TourPlacement = 'top' | 'right' | 'bottom' | 'left' | 'auto';

export interface TourStep {
  id: string;
  selector: string;
  title: string;
  body: string;
  placement?: TourPlacement;
}

export interface PageTour {
  pageKey: string;
  pageName: string;
  basic: TourStep[];
  advanced: TourStep[];
}

export type PageTourKey = 
  | 'dashboard' 
  | 'myDay' 
  | 'creatorHub' 
  | 'meetings' 
  | 'appsTools';

export const pageTours: Record<PageTourKey, PageTour> = {
  dashboard: {
    pageKey: 'dashboard',
    pageName: 'Creator Dashboard',
    basic: [
      {
        id: 'dashboard_welcome',
        selector: '#dashboard-hero-banner, [data-onboarding="dashboard-header"]',
        title: '🏠 Welcome to Your Dashboard',
        body: 'This is your creative headquarters. Keep an eye on your identity status, recent activity, and core creator tools here.',
        placement: 'bottom',
      },
      {
        id: 'dashboard_quick_actions',
        selector: '#dashboard-quick-actions, [data-onboarding="quick-actions-row"]',
        title: '⚡ Quick Actions',
        body: 'Start fast. Use these shortcuts to create meetings, upload content for AI editing, record episodes, or launch the studio with one click.',
        placement: 'bottom',
      },
      {
        id: 'dashboard_tools_row',
        selector: '#dashboard-tools-row, [data-onboarding="dashboard-widgets"]',
        title: '🛠️ Your Core Tools',
        body: 'These tiles jump straight into your most important tools—meetings, monetization, awards, and your link-in-bio page.',
        placement: 'bottom',
      },
      {
        id: 'dashboard_identity',
        selector: '#dashboard-identity-card, [data-onboarding="identity-widget"]',
        title: '🛡️ Identity Verification',
        body: 'Your face and voice verification live here. Once verified, Seeksy can safely protect your likeness and power AI tools for you.',
        placement: 'right',
      },
    ],
    advanced: [
      {
        id: 'dashboard_recent_activity',
        selector: '#dashboard-recent-activity, [data-onboarding="recent-activity"]',
        title: '📊 Recent Activity',
        body: 'Track what\'s happening across your workspace—new content, meetings, and system updates appear here.',
        placement: 'left',
      },
      {
        id: 'dashboard_create_meeting',
        selector: '#dashboard-quick-action-create-meeting',
        title: '📅 Create a Meeting',
        body: 'Use this button to schedule calls with a studio link, SMS reminders, and calendar invites in one flow.',
        placement: 'bottom',
      },
      {
        id: 'dashboard_customize',
        selector: '#dashboard-customize-button, [data-onboarding="add-widgets"]',
        title: '🎨 Customize Your View',
        body: 'Adjust which metrics and tools you see first so your dashboard fits how you like to work.',
        placement: 'left',
      },
      {
        id: 'dashboard_ask_spark',
        selector: '#dashboard-ask-spark, [data-onboarding="ask-spark"]',
        title: '✨ Ask Spark for Help',
        body: 'Need ideas, scripts, or analysis? Ask Spark right from your dashboard to help you plan and create.',
        placement: 'top',
      },
    ],
  },

  myDay: {
    pageKey: 'myDay',
    pageName: 'My Day',
    basic: [
      {
        id: 'myday_welcome',
        selector: '#myday-hero-banner, [data-onboarding="my-day-header"]',
        title: '📅 Welcome to My Day',
        body: 'This is your daily control center—emails, meetings, tasks, and alerts for today in one place.',
        placement: 'bottom',
      },
      {
        id: 'myday_summary',
        selector: '#myday-summary-cards, [data-onboarding="kpi-cards"]',
        title: '📊 Today\'s Snapshot',
        body: 'See how many emails, meetings, tasks, and alerts need your attention right now.',
        placement: 'bottom',
      },
      {
        id: 'myday_meetings',
        selector: '#myday-upcoming-meetings, [data-onboarding="upcoming-meetings"]',
        title: '📆 Upcoming Meetings',
        body: 'Your next calls and sessions appear here. Click a meeting to view details or join the studio.',
        placement: 'right',
      },
      {
        id: 'myday_tasks',
        selector: '#myday-tasks-card, [data-onboarding="todays-tasks"]',
        title: '✅ Today\'s Key Tasks',
        body: 'Stay focused on what matters most. Track the top tasks you\'ve committed to complete today.',
        placement: 'left',
      },
    ],
    advanced: [
      {
        id: 'myday_dashboard_link',
        selector: '#myday-view-dashboard-link, [data-onboarding="cross-links"]',
        title: '📈 Jump to Dashboard',
        body: 'Need a bigger picture? Use this link to jump to your performance dashboard.',
        placement: 'bottom',
      },
      {
        id: 'myday_hub_link',
        selector: '#myday-open-creator-hub-link',
        title: '🎨 Open Creator Hub',
        body: 'Head to Creator Hub to manage the tools and modules that power your business.',
        placement: 'bottom',
      },
      {
        id: 'myday_alerts',
        selector: '#myday-alerts-area, [data-onboarding="notifications"]',
        title: '🔔 Alerts & Notifications',
        body: 'System alerts and important notices will appear here so you don\'t miss something critical.',
        placement: 'left',
      },
      {
        id: 'myday_empty_states',
        selector: '#myday-empty-states, [data-onboarding="personalize"]',
        title: '💡 Empty States as Guidance',
        body: 'When there\'s nothing scheduled or assigned, we\'ll use this space to suggest next steps to grow your audience.',
        placement: 'bottom',
      },
    ],
  },

  creatorHub: {
    pageKey: 'creatorHub',
    pageName: 'Creator Hub',
    basic: [
      {
        id: 'hub_welcome',
        selector: '#creatorhub-hero, [data-onboarding="creator-hub-header"]',
        title: '🎨 Creator Hub',
        body: 'This is your command center for creator tools—what\'s activated, what you can add, and where to discover new modules.',
        placement: 'bottom',
      },
      {
        id: 'hub_activated',
        selector: '#creatorhub-activated-section, [data-onboarding="active-modules"]',
        title: '✓ Activated Tools',
        body: 'Everything you\'ve activated appears here for quick access. These tiles mirror what\'s available in your navigation.',
        placement: 'bottom',
      },
      {
        id: 'hub_discover',
        selector: '#creatorhub-discover-section, [data-onboarding="discover-modules"]',
        title: '🔍 Discover More Tools',
        body: 'Browse additional tools you can activate with credits—analytics, brand campaigns, content library, and more.',
        placement: 'right',
      },
      {
        id: 'hub_browse',
        selector: '#creatorhub-browse-apps-button',
        title: '🛒 Browse Apps & Tools',
        body: 'Use this button to open the full Apps & Tools marketplace and customize your workspace.',
        placement: 'top',
      },
    ],
    advanced: [
      {
        id: 'hub_badge_example',
        selector: '#creatorhub-activated-badge-example, .activated-badge-example',
        title: '✓ Activated Badge',
        body: 'Look for the green "Activated" badge to see which tools are live in your workspace.',
        placement: 'right',
      },
      {
        id: 'hub_credits',
        selector: '#creatorhub-credits-strip',
        title: '💳 Credits Awareness',
        body: 'We\'ll show estimated monthly credit usage so you understand the cost of your active modules.',
        placement: 'bottom',
      },
      {
        id: 'hub_context_menu',
        selector: '#creatorhub-tool-context-menu, .tool-card-menu',
        title: '⚙️ Manage a Tool',
        body: 'From each tile, you\'ll be able to open the tool, manage settings, or remove it from your hub.',
        placement: 'left',
      },
      {
        id: 'hub_restart_tour',
        selector: '#creatorhub-start-onboarding-button, [data-onboarding="start-onboarding"]',
        title: '🔄 Restart the Tour',
        body: 'Anytime you want a refresher, use Start Onboarding to replay tips across your key pages.',
        placement: 'bottom',
      },
    ],
  },

  meetings: {
    pageKey: 'meetings',
    pageName: 'Meetings',
    basic: [
      {
        id: 'meetings_overview',
        selector: '#meetings-hero, [data-onboarding="meetings-header"]',
        title: '📅 Meetings Overview',
        body: 'Schedule and manage all of your meetings from here—both upcoming and past.',
        placement: 'bottom',
      },
      {
        id: 'meetings_tabs',
        selector: '#meetings-tabs, [data-onboarding="upcoming-meetings"]',
        title: '📁 Upcoming vs Previous',
        body: 'Use these tabs to flip between upcoming meetings and your history.',
        placement: 'bottom',
      },
      {
        id: 'meetings_schedule',
        selector: '#meetings-schedule-button, [data-onboarding="schedule-meeting"]',
        title: '➕ Schedule New Meeting',
        body: 'Click here to create a new meeting with title, attendees, SMS reminders, and a studio link.',
        placement: 'bottom',
      },
      {
        id: 'meetings_meet_now',
        selector: '#meetings-meet-now-button, [data-onboarding="meeting-types"]',
        title: '🚀 Meet Now',
        body: 'Start an instant call with a simple studio—perfect for quick check-ins or ad-hoc sessions.',
        placement: 'left',
      },
    ],
    advanced: [
      {
        id: 'meetings_row_actions',
        selector: '#meetings-row-actions, [data-onboarding="meeting-studio"]',
        title: '📋 Meeting Details',
        body: 'Click any meeting row to open details, adjust attendees, see notes, or access files.',
        placement: 'right',
      },
      {
        id: 'meetings_studio_pref',
        selector: '#meetings-studio-preference, [data-onboarding="calendar-sync"]',
        title: '🎬 Studio Preference',
        body: 'Choose whether this meeting uses the Seeksy simple studio or your full podcast studio.',
        placement: 'left',
      },
      {
        id: 'meetings_filters',
        selector: '#meetings-filters, [data-onboarding="meeting-history"]',
        title: '🔍 Filters & Search',
        body: 'Filter by date or search by title and attendee to quickly find the meeting you\'re looking for.',
        placement: 'bottom',
      },
      {
        id: 'meetings_empty_cta',
        selector: '#meetings-empty-state-cta, [data-onboarding="ai-features"]',
        title: '🎯 First Meeting CTA',
        body: 'Use the empty state CTA to guide first-time users into creating their first bookable meeting type.',
        placement: 'top',
      },
    ],
  },

  appsTools: {
    pageKey: 'appsTools',
    pageName: 'Apps & Tools',
    basic: [
      {
        id: 'apps_hero',
        selector: '#apps-hero, [data-onboarding="apps-header"]',
        title: '🛒 Apps & Tools Marketplace',
        body: 'Discover the tools that power your workspace—analytics, meetings, studio, monetization, and more.',
        placement: 'bottom',
      },
      {
        id: 'apps_activated_strip',
        selector: '#apps-activated-strip, [data-onboarding="activated-modules"]',
        title: '✓ Your Activated Modules',
        body: 'See which modules are already activated at the top, each with a green badge and quick actions.',
        placement: 'bottom',
      },
      {
        id: 'apps_grid',
        selector: '#apps-module-grid, [data-onboarding="module-grid"]',
        title: '📦 Browse Modules',
        body: 'Scroll the grid to explore new capabilities. Each card shows what it does, who it\'s for, and estimated credits.',
        placement: 'right',
      },
      {
        id: 'apps_custom_package',
        selector: '#apps-custom-package-cta, [data-onboarding="custom-package"]',
        title: '📦 Create Your Own Package',
        body: 'Use this to bundle modules into a custom workspace with your preferred layout, theme, and default tools.',
        placement: 'top',
      },
    ],
    advanced: [
      {
        id: 'apps_tooltip',
        selector: '#apps-module-card-tooltip, .module-card-tooltip',
        title: '💡 Module Details Tooltip',
        body: 'Hover to see a short description, best-for, and what the module unlocks before opening full details.',
        placement: 'right',
      },
      {
        id: 'apps_add_cta',
        selector: '#apps-module-modal-primary-cta, [data-onboarding="activate-module"]',
        title: '➕ Add to My Workspace',
        body: 'From the module detail modal, use this primary button to activate the module and surface it in your Creator Hub.',
        placement: 'bottom',
      },
      {
        id: 'apps_credits_estimate',
        selector: '#apps-credits-estimate, [data-onboarding="credits-estimate"]',
        title: '💳 Credits Estimate',
        body: 'Watch the estimated monthly credits update as you select or deselect modules in a custom package.',
        placement: 'left',
      },
      {
        id: 'apps_recommended',
        selector: '#apps-recommended-plan, [data-onboarding="recommended-plan"]',
        title: '⭐ Recommended Plan',
        body: 'We\'ll highlight a bundle that covers your estimated usage so you\'re not surprised by costs later.',
        placement: 'bottom',
      },
    ],
  },
};

/**
 * Get tour configuration for a specific page
 */
export function getPageTour(pageKey: PageTourKey): PageTour | undefined {
  return pageTours[pageKey];
}

/**
 * Map route path to page tour key
 */
export function getPageTourKeyFromRoute(pathname: string): PageTourKey | null {
  const routeMap: Record<string, PageTourKey> = {
    '/dashboard': 'dashboard',
    '/my-day': 'myDay',
    '/creator-hub': 'creatorHub',
    '/meetings': 'meetings',
    '/creator/meetings': 'meetings',
    '/apps': 'appsTools',
    '/apps-and-tools': 'appsTools',
  };

  // Check exact match first
  if (routeMap[pathname]) {
    return routeMap[pathname];
  }

  // Check if pathname starts with any route
  for (const [route, key] of Object.entries(routeMap)) {
    if (pathname.startsWith(route)) {
      return key;
    }
  }

  return null;
}

/**
 * Get all tour steps for a page (basic + advanced)
 */
export function getAllTourSteps(pageKey: PageTourKey): TourStep[] {
  const tour = pageTours[pageKey];
  if (!tour) return [];
  return [...tour.basic, ...tour.advanced];
}
