/**
 * Onboarding Tips Registry
 * Central configuration for all page-level onboarding tooltips
 */

export type PageKey = 
  | 'my_day'
  | 'dashboard'
  | 'creator_hub'
  | 'meetings'
  | 'email_inbox'
  | 'studio'
  | 'page_builder'
  | 'identity'
  | 'marketing_tools'
  | 'contacts'
  | 'podcasts'
  | 'media_library';

export interface OnboardingTip {
  id: string;
  target: string; // CSS selector or data-onboarding attribute
  title: string;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export interface PageOnboarding {
  pageKey: PageKey;
  pageName: string;
  primaryTips: OnboardingTip[]; // First 4 tips
  advancedTips: OnboardingTip[]; // Additional 4 tips
}

export const ONBOARDING_TIPS: Record<PageKey, PageOnboarding> = {
  my_day: {
    pageKey: 'my_day',
    pageName: 'My Day',
    primaryTips: [
      {
        id: 'my_day_overview',
        target: '[data-onboarding="my-day-header"]',
        title: '📅 Your Daily Command Center',
        content: 'My Day gives you a quick snapshot of what needs your attention today—meetings, tasks, and key metrics at a glance.',
        position: 'bottom',
      },
      {
        id: 'my_day_meetings',
        target: '[data-onboarding="upcoming-meetings"]',
        title: '📆 Upcoming Meetings',
        content: 'See all your scheduled meetings for today. Click any meeting to join or view details.',
        position: 'right',
      },
      {
        id: 'my_day_tasks',
        target: '[data-onboarding="todays-tasks"]',
        title: '✅ Today\'s Tasks',
        content: 'Your most important tasks for today. Check them off as you complete them!',
        position: 'left',
      },
      {
        id: 'my_day_quick_actions',
        target: '[data-onboarding="quick-actions"]',
        title: '⚡ Quick Actions',
        content: 'Jump to common actions like scheduling a meeting or creating content without navigating away.',
        position: 'bottom',
      },
    ],
    advancedTips: [
      {
        id: 'my_day_kpis',
        target: '[data-onboarding="kpi-cards"]',
        title: '📊 Key Performance Indicators',
        content: 'Track your most important metrics at a glance. These update in real-time based on your activity.',
        position: 'bottom',
      },
      {
        id: 'my_day_notifications',
        target: '[data-onboarding="notifications"]',
        title: '🔔 Smart Notifications',
        content: 'Important updates appear here. Never miss a meeting reminder or task deadline.',
        position: 'left',
      },
      {
        id: 'my_day_personalize',
        target: '[data-onboarding="personalize"]',
        title: '🎨 Personalize Your Day',
        content: 'Customize which widgets appear on your My Day page to focus on what matters most.',
        position: 'bottom',
      },
      {
        id: 'my_day_shortcuts',
        target: '[data-onboarding="cross-links"]',
        title: '🔗 Quick Navigation',
        content: 'Jump to other areas of your workspace directly from here.',
        position: 'top',
      },
    ],
  },

  dashboard: {
    pageKey: 'dashboard',
    pageName: 'Dashboard',
    primaryTips: [
      {
        id: 'dashboard_overview',
        target: '[data-onboarding="dashboard-header"]',
        title: '🏠 Welcome to Your Dashboard',
        content: 'This is your creative headquarters. Everything you need to grow your audience and content is right here.',
        position: 'bottom',
      },
      {
        id: 'dashboard_widgets',
        target: '[data-onboarding="dashboard-widgets"]',
        title: '📦 Customizable Widgets',
        content: 'Your dashboard is built from widgets. Drag, drop, and customize to create your perfect workspace.',
        position: 'bottom',
      },
      {
        id: 'dashboard_quick_actions',
        target: '[data-onboarding="quick-actions-row"]',
        title: '⚡ Quick Actions',
        content: 'Start creating immediately! Record, upload, or schedule content with one click.',
        position: 'bottom',
      },
      {
        id: 'dashboard_stats',
        target: '[data-onboarding="performance-stats"]',
        title: '📈 Performance Overview',
        content: 'Track your growth with real-time analytics across all your content and channels.',
        position: 'left',
      },
    ],
    advancedTips: [
      {
        id: 'dashboard_add_widgets',
        target: '[data-onboarding="add-widgets"]',
        title: '➕ Add More Widgets',
        content: 'Click here to browse available widgets and add new features to your dashboard.',
        position: 'left',
      },
      {
        id: 'dashboard_identity',
        target: '[data-onboarding="identity-widget"]',
        title: '🛡️ Identity Verification',
        content: 'Verify your voice and face to unlock premium features and protect your content.',
        position: 'right',
      },
      {
        id: 'dashboard_monetization',
        target: '[data-onboarding="monetization-widget"]',
        title: '💰 Monetization Hub',
        content: 'Track your earnings and discover new ways to monetize your content.',
        position: 'left',
      },
      {
        id: 'dashboard_activity',
        target: '[data-onboarding="recent-activity"]',
        title: '🕐 Recent Activity',
        content: 'See what\'s happening across your workspace with the activity feed.',
        position: 'top',
      },
    ],
  },

  creator_hub: {
    pageKey: 'creator_hub',
    pageName: 'Creator Hub',
    primaryTips: [
      {
        id: 'hub_overview',
        target: '[data-onboarding="creator-hub-header"]',
        title: '🎨 Creator Hub',
        content: 'Your central place to manage all creator tools, modules, and integrations.',
        position: 'bottom',
      },
      {
        id: 'hub_modules',
        target: '[data-onboarding="active-modules"]',
        title: '📦 Active Modules',
        content: 'See all your activated tools and features. Click any module to jump right in.',
        position: 'bottom',
      },
      {
        id: 'hub_discover',
        target: '[data-onboarding="discover-modules"]',
        title: '🔍 Discover New Tools',
        content: 'Browse available modules and activate new features to expand your toolkit.',
        position: 'right',
      },
      {
        id: 'hub_categories',
        target: '[data-onboarding="module-categories"]',
        title: '📁 Module Categories',
        content: 'Tools are organized by category—Media, Marketing, Business, and more.',
        position: 'left',
      },
    ],
    advancedTips: [
      {
        id: 'hub_recommendations',
        target: '[data-onboarding="recommended-modules"]',
        title: '✨ Recommended For You',
        content: 'AI-powered suggestions based on your goals and activity.',
        position: 'bottom',
      },
      {
        id: 'hub_integrations',
        target: '[data-onboarding="integrations"]',
        title: '🔗 Integrations',
        content: 'Connect external services like social media, calendars, and more.',
        position: 'right',
      },
      {
        id: 'hub_usage',
        target: '[data-onboarding="usage-stats"]',
        title: '📊 Module Usage',
        content: 'Track how much you use each module to optimize your workflow.',
        position: 'left',
      },
      {
        id: 'hub_settings',
        target: '[data-onboarding="module-settings"]',
        title: '⚙️ Module Settings',
        content: 'Configure individual module settings and preferences.',
        position: 'bottom',
      },
    ],
  },

  meetings: {
    pageKey: 'meetings',
    pageName: 'Meetings',
    primaryTips: [
      {
        id: 'meetings_overview',
        target: '[data-onboarding="meetings-header"]',
        title: '📅 Meetings Hub',
        content: 'Schedule, manage, and join meetings all in one place. Perfect for podcasts, interviews, and collaborations.',
        position: 'bottom',
      },
      {
        id: 'meetings_schedule',
        target: '[data-onboarding="schedule-meeting"]',
        title: '➕ Schedule a Meeting',
        content: 'Create a new meeting with custom settings, attendees, and calendar integration.',
        position: 'bottom',
      },
      {
        id: 'meetings_upcoming',
        target: '[data-onboarding="upcoming-meetings"]',
        title: '📆 Upcoming Meetings',
        content: 'See all your scheduled meetings. Click to view details or join when it\'s time.',
        position: 'right',
      },
      {
        id: 'meetings_types',
        target: '[data-onboarding="meeting-types"]',
        title: '🎯 Meeting Types',
        content: 'Create reusable meeting templates for different purposes—podcasts, calls, consultations.',
        position: 'left',
      },
    ],
    advancedTips: [
      {
        id: 'meetings_studio',
        target: '[data-onboarding="meeting-studio"]',
        title: '🎬 Meeting Studio',
        content: 'Record meetings in our professional studio with AI-powered post-production.',
        position: 'right',
      },
      {
        id: 'meetings_calendar',
        target: '[data-onboarding="calendar-sync"]',
        title: '📆 Calendar Sync',
        content: 'Connect your Google or Outlook calendar for automatic scheduling.',
        position: 'left',
      },
      {
        id: 'meetings_history',
        target: '[data-onboarding="meeting-history"]',
        title: '🕐 Meeting History',
        content: 'Access past meetings, recordings, and transcripts.',
        position: 'bottom',
      },
      {
        id: 'meetings_ai',
        target: '[data-onboarding="ai-features"]',
        title: '🤖 AI Features',
        content: 'Get AI-generated summaries, action items, and insights from your meetings.',
        position: 'top',
      },
    ],
  },

  email_inbox: {
    pageKey: 'email_inbox',
    pageName: 'Email Inbox',
    primaryTips: [
      {
        id: 'email_overview',
        target: '[data-onboarding="inbox-header"]',
        title: '📧 Your Unified Inbox',
        content: 'Manage all your email communications in one place. Connect multiple accounts for a complete view.',
        position: 'bottom',
      },
      {
        id: 'email_compose',
        target: '[data-onboarding="compose-email"]',
        title: '✏️ Compose Email',
        content: 'Write and send emails with templates, tracking, and AI assistance.',
        position: 'right',
      },
      {
        id: 'email_folders',
        target: '[data-onboarding="email-folders"]',
        title: '📁 Folders & Labels',
        content: 'Organize your emails with folders, labels, and smart filters.',
        position: 'left',
      },
      {
        id: 'email_search',
        target: '[data-onboarding="email-search"]',
        title: '🔍 Search',
        content: 'Quickly find any email with powerful search across all accounts.',
        position: 'bottom',
      },
    ],
    advancedTips: [
      {
        id: 'email_templates',
        target: '[data-onboarding="email-templates"]',
        title: '📝 Email Templates',
        content: 'Save time with reusable email templates for common responses.',
        position: 'right',
      },
      {
        id: 'email_tracking',
        target: '[data-onboarding="email-tracking"]',
        title: '📊 Email Tracking',
        content: 'See when emails are opened and links are clicked.',
        position: 'left',
      },
      {
        id: 'email_ai',
        target: '[data-onboarding="email-ai"]',
        title: '🤖 AI Scribe',
        content: 'Let AI help you draft, respond, and summarize emails.',
        position: 'bottom',
      },
      {
        id: 'email_accounts',
        target: '[data-onboarding="connected-accounts"]',
        title: '🔗 Connected Accounts',
        content: 'Add more email accounts to manage everything in one inbox.',
        position: 'top',
      },
    ],
  },

  studio: {
    pageKey: 'studio',
    pageName: 'Studio',
    primaryTips: [
      {
        id: 'studio_overview',
        target: '[data-onboarding="studio-header"]',
        title: '🎬 Seeksy Studio',
        content: 'Your professional recording studio. Create podcasts, videos, and clips with AI-powered tools.',
        position: 'bottom',
      },
      {
        id: 'studio_record',
        target: '[data-onboarding="record-button"]',
        title: '🔴 Start Recording',
        content: 'Choose audio or video recording. Invite guests and record in high quality.',
        position: 'bottom',
      },
      {
        id: 'studio_scenes',
        target: '[data-onboarding="studio-scenes"]',
        title: '🎨 Scene Presets',
        content: 'Switch between different layouts—solo, side-by-side, or speaker focus.',
        position: 'right',
      },
      {
        id: 'studio_controls',
        target: '[data-onboarding="studio-controls"]',
        title: '🎛️ Studio Controls',
        content: 'Access camera, microphone, and screen sharing settings.',
        position: 'left',
      },
    ],
    advancedTips: [
      {
        id: 'studio_markers',
        target: '[data-onboarding="markers"]',
        title: '📌 Markers',
        content: 'Add markers during recording to highlight important moments for easy editing later.',
        position: 'right',
      },
      {
        id: 'studio_ai',
        target: '[data-onboarding="ai-production"]',
        title: '🤖 AI Post-Production',
        content: 'After recording, AI removes filler words, enhances audio, and generates clips.',
        position: 'left',
      },
      {
        id: 'studio_guests',
        target: '[data-onboarding="guest-invite"]',
        title: '👥 Invite Guests',
        content: 'Send invite links to guests—they join with no account required.',
        position: 'bottom',
      },
      {
        id: 'studio_brand',
        target: '[data-onboarding="brand-assets"]',
        title: '🎨 Brand Assets',
        content: 'Add your logo, lower thirds, and custom overlays to recordings.',
        position: 'top',
      },
    ],
  },

  page_builder: {
    pageKey: 'page_builder',
    pageName: 'My Page',
    primaryTips: [
      {
        id: 'page_overview',
        target: '[data-onboarding="page-header"]',
        title: '🌐 Your Public Page',
        content: 'Create a beautiful link-in-bio page to showcase your content, links, and brand.',
        position: 'bottom',
      },
      {
        id: 'page_sections',
        target: '[data-onboarding="page-sections"]',
        title: '📦 Page Sections',
        content: 'Add sections for videos, social links, podcasts, meetings, and more.',
        position: 'right',
      },
      {
        id: 'page_preview',
        target: '[data-onboarding="page-preview"]',
        title: '📱 Live Preview',
        content: 'See exactly how your page looks on mobile, tablet, and desktop.',
        position: 'left',
      },
      {
        id: 'page_theme',
        target: '[data-onboarding="page-theme"]',
        title: '🎨 Themes & Styling',
        content: 'Choose colors, fonts, and layouts that match your brand.',
        position: 'bottom',
      },
    ],
    advancedTips: [
      {
        id: 'page_analytics',
        target: '[data-onboarding="page-analytics"]',
        title: '📊 Page Analytics',
        content: 'Track views, clicks, and engagement on your public page.',
        position: 'right',
      },
      {
        id: 'page_seo',
        target: '[data-onboarding="page-seo"]',
        title: '🔍 SEO Settings',
        content: 'Optimize your page for search engines with meta tags and descriptions.',
        position: 'left',
      },
      {
        id: 'page_domain',
        target: '[data-onboarding="custom-domain"]',
        title: '🔗 Custom Domain',
        content: 'Connect your own domain for a professional branded URL.',
        position: 'bottom',
      },
      {
        id: 'page_verification',
        target: '[data-onboarding="verification-badge"]',
        title: '✓ Verification Badge',
        content: 'Complete identity verification to display a trust badge on your page.',
        position: 'top',
      },
    ],
  },

  identity: {
    pageKey: 'identity',
    pageName: 'Identity & Rights',
    primaryTips: [
      {
        id: 'identity_overview',
        target: '[data-onboarding="identity-header"]',
        title: '🛡️ Identity & Rights',
        content: 'Protect your creative identity with voice and face verification, blockchain certification, and rights management.',
        position: 'bottom',
      },
      {
        id: 'identity_voice',
        target: '[data-onboarding="voice-verification"]',
        title: '🎤 Voice Verification',
        content: 'Verify your unique voice to protect against deepfakes and unauthorized use.',
        position: 'right',
      },
      {
        id: 'identity_face',
        target: '[data-onboarding="face-verification"]',
        title: '👤 Face Verification',
        content: 'Verify your face for additional identity protection and trust signals.',
        position: 'left',
      },
      {
        id: 'identity_permissions',
        target: '[data-onboarding="permissions"]',
        title: '⚙️ Permissions',
        content: 'Control how your identity can be used—clips, AI, advertisers, and more.',
        position: 'bottom',
      },
    ],
    advancedTips: [
      {
        id: 'identity_blockchain',
        target: '[data-onboarding="blockchain-cert"]',
        title: '⛓️ Blockchain Certification',
        content: 'Your identity is secured on the blockchain for tamper-proof verification.',
        position: 'right',
      },
      {
        id: 'identity_access',
        target: '[data-onboarding="access-requests"]',
        title: '📩 Access Requests',
        content: 'Review and manage requests from brands to use your identity.',
        position: 'left',
      },
      {
        id: 'identity_audit',
        target: '[data-onboarding="audit-log"]',
        title: '📋 Audit Log',
        content: 'Track all activity related to your identity—verifications, requests, and grants.',
        position: 'bottom',
      },
      {
        id: 'identity_monetize',
        target: '[data-onboarding="monetize-identity"]',
        title: '💰 Monetize Your Identity',
        content: 'Earn premium rates by licensing your verified identity to advertisers.',
        position: 'top',
      },
    ],
  },

  marketing_tools: {
    pageKey: 'marketing_tools',
    pageName: 'Marketing Tools',
    primaryTips: [
      {
        id: 'marketing_overview',
        target: '[data-onboarding="marketing-header"]',
        title: '📣 Marketing Tools',
        content: 'Grow your audience with email campaigns, SMS, automations, and more.',
        position: 'bottom',
      },
      {
        id: 'marketing_campaigns',
        target: '[data-onboarding="campaigns"]',
        title: '📧 Campaigns',
        content: 'Create and send email and SMS campaigns to your audience.',
        position: 'right',
      },
      {
        id: 'marketing_segments',
        target: '[data-onboarding="segments"]',
        title: '👥 Audience Segments',
        content: 'Group your contacts for targeted messaging and personalization.',
        position: 'left',
      },
      {
        id: 'marketing_automation',
        target: '[data-onboarding="automations"]',
        title: '🤖 Automations',
        content: 'Set up automated workflows that trigger based on user actions.',
        position: 'bottom',
      },
    ],
    advancedTips: [
      {
        id: 'marketing_templates',
        target: '[data-onboarding="templates"]',
        title: '📝 Templates',
        content: 'Use pre-built templates or create your own for consistent branding.',
        position: 'right',
      },
      {
        id: 'marketing_analytics',
        target: '[data-onboarding="marketing-analytics"]',
        title: '📊 Campaign Analytics',
        content: 'Track opens, clicks, conversions, and ROI for every campaign.',
        position: 'left',
      },
      {
        id: 'marketing_forms',
        target: '[data-onboarding="forms"]',
        title: '📋 Lead Forms',
        content: 'Capture leads with customizable forms and landing pages.',
        position: 'bottom',
      },
      {
        id: 'marketing_pixel',
        target: '[data-onboarding="lead-pixel"]',
        title: '🎯 Lead Pixel',
        content: 'Track visitor behavior on your website for retargeting.',
        position: 'top',
      },
    ],
  },

  contacts: {
    pageKey: 'contacts',
    pageName: 'Contacts',
    primaryTips: [
      {
        id: 'contacts_overview',
        target: '[data-onboarding="contacts-header"]',
        title: '👥 Contacts',
        content: 'Your central address book for all contacts, subscribers, and leads.',
        position: 'bottom',
      },
      {
        id: 'contacts_add',
        target: '[data-onboarding="add-contact"]',
        title: '➕ Add Contacts',
        content: 'Add contacts manually, import from CSV, or sync from integrations.',
        position: 'right',
      },
      {
        id: 'contacts_search',
        target: '[data-onboarding="contact-search"]',
        title: '🔍 Search & Filter',
        content: 'Find any contact instantly with powerful search and filters.',
        position: 'left',
      },
      {
        id: 'contacts_tags',
        target: '[data-onboarding="contact-tags"]',
        title: '🏷️ Tags & Lists',
        content: 'Organize contacts with tags and lists for easy segmentation.',
        position: 'bottom',
      },
    ],
    advancedTips: [
      {
        id: 'contacts_import',
        target: '[data-onboarding="import-contacts"]',
        title: '📥 Import Contacts',
        content: 'Bulk import contacts from CSV files or sync from other tools.',
        position: 'right',
      },
      {
        id: 'contacts_activity',
        target: '[data-onboarding="contact-activity"]',
        title: '📊 Contact Activity',
        content: 'See each contact\'s full history—emails, meetings, purchases.',
        position: 'left',
      },
      {
        id: 'contacts_merge',
        target: '[data-onboarding="merge-contacts"]',
        title: '🔀 Merge Duplicates',
        content: 'Find and merge duplicate contacts to keep your list clean.',
        position: 'bottom',
      },
      {
        id: 'contacts_export',
        target: '[data-onboarding="export-contacts"]',
        title: '📤 Export',
        content: 'Export contacts to CSV for use in other tools.',
        position: 'top',
      },
    ],
  },

  podcasts: {
    pageKey: 'podcasts',
    pageName: 'Podcasts',
    primaryTips: [
      {
        id: 'podcasts_overview',
        target: '[data-onboarding="podcasts-header"]',
        title: '🎙️ Podcasts',
        content: 'Manage your podcasts, episodes, and RSS distribution all in one place.',
        position: 'bottom',
      },
      {
        id: 'podcasts_shows',
        target: '[data-onboarding="podcast-shows"]',
        title: '📺 Your Shows',
        content: 'View and manage all your podcast shows and their settings.',
        position: 'right',
      },
      {
        id: 'podcasts_create',
        target: '[data-onboarding="create-episode"]',
        title: '➕ Create Episode',
        content: 'Record in Studio, upload, or import from your media library.',
        position: 'left',
      },
      {
        id: 'podcasts_rss',
        target: '[data-onboarding="rss-feed"]',
        title: '📡 RSS Distribution',
        content: 'Your RSS feed distributes automatically to Apple, Spotify, and more.',
        position: 'bottom',
      },
    ],
    advancedTips: [
      {
        id: 'podcasts_analytics',
        target: '[data-onboarding="podcast-analytics"]',
        title: '📊 Analytics',
        content: 'Track downloads, listeners, and audience demographics.',
        position: 'right',
      },
      {
        id: 'podcasts_monetize',
        target: '[data-onboarding="podcast-monetize"]',
        title: '💰 Monetization',
        content: 'Add ad slots and sponsorships to earn from your episodes.',
        position: 'left',
      },
      {
        id: 'podcasts_import',
        target: '[data-onboarding="import-podcast"]',
        title: '📥 Import Podcast',
        content: 'Migrate your existing podcast from another host via RSS import.',
        position: 'bottom',
      },
      {
        id: 'podcasts_schedule',
        target: '[data-onboarding="schedule-episode"]',
        title: '📅 Schedule Episodes',
        content: 'Schedule episodes to publish automatically at the best time.',
        position: 'top',
      },
    ],
  },

  media_library: {
    pageKey: 'media_library',
    pageName: 'Media Library',
    primaryTips: [
      {
        id: 'media_overview',
        target: '[data-onboarding="media-header"]',
        title: '📁 Media Library',
        content: 'Your central hub for all media files—recordings, uploads, and generated content.',
        position: 'bottom',
      },
      {
        id: 'media_upload',
        target: '[data-onboarding="upload-media"]',
        title: '⬆️ Upload Files',
        content: 'Upload audio, video, and images. We support all major formats.',
        position: 'right',
      },
      {
        id: 'media_folders',
        target: '[data-onboarding="media-folders"]',
        title: '📂 Folders',
        content: 'Organize your files into folders for easy management.',
        position: 'left',
      },
      {
        id: 'media_search',
        target: '[data-onboarding="media-search"]',
        title: '🔍 Search',
        content: 'Find any file quickly with search across names and transcripts.',
        position: 'bottom',
      },
    ],
    advancedTips: [
      {
        id: 'media_clips',
        target: '[data-onboarding="generate-clips"]',
        title: '✂️ Generate Clips',
        content: 'Select any video and let AI generate short-form clips automatically.',
        position: 'right',
      },
      {
        id: 'media_transcribe',
        target: '[data-onboarding="transcribe"]',
        title: '📝 Transcription',
        content: 'Auto-transcribe any audio or video for searchable text.',
        position: 'left',
      },
      {
        id: 'media_certify',
        target: '[data-onboarding="certify-content"]',
        title: '✓ Certify Content',
        content: 'Certify media on the blockchain for proof of ownership.',
        position: 'bottom',
      },
      {
        id: 'media_share',
        target: '[data-onboarding="share-media"]',
        title: '🔗 Share & Embed',
        content: 'Get shareable links and embed codes for any file.',
        position: 'top',
      },
    ],
  },
};

// Helper function to get tips for a specific page
export function getPageTips(pageKey: PageKey): PageOnboarding | undefined {
  return ONBOARDING_TIPS[pageKey];
}

// Helper to get all tips (primary + advanced) for a page
export function getAllTips(pageKey: PageKey): OnboardingTip[] {
  const page = ONBOARDING_TIPS[pageKey];
  if (!page) return [];
  return [...page.primaryTips, ...page.advancedTips];
}

// Map routes to page keys
export function getPageKeyFromRoute(pathname: string): PageKey | null {
  const routeMap: Record<string, PageKey> = {
    '/my-day': 'my_day',
    '/': 'dashboard',
    '/dashboard': 'dashboard',
    '/creator-hub': 'creator_hub',
    '/meetings': 'meetings',
    '/inbox': 'email_inbox',
    '/email': 'email_inbox',
    '/studio': 'studio',
    '/studio/audio': 'studio',
    '/studio/video': 'studio',
    '/profile/edit': 'page_builder',
    '/my-page': 'page_builder',
    '/identity': 'identity',
    '/marketing': 'marketing_tools',
    '/contacts': 'contacts',
    '/podcasts': 'podcasts',
    '/media': 'media_library',
    '/media-library': 'media_library',
  };

  // Check exact matches first
  if (routeMap[pathname]) {
    return routeMap[pathname];
  }

  // Check prefix matches
  for (const [route, key] of Object.entries(routeMap)) {
    if (pathname.startsWith(route) && route !== '/') {
      return key;
    }
  }

  return null;
}
