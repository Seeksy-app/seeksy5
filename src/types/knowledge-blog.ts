export type PortalType = 'admin' | 'creator' | 'board';

export interface KnowledgeArticle {
  id: string;
  portal: PortalType;
  section: string;
  category: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  purpose: string | null;
  expected_outcomes: string | null;
  key_takeaways: string[] | null;
  execution_steps: string[] | null;
  questions: string[] | null;
  screenshot_urls: string[] | null;
  author_id: string | null;
  is_published: boolean;
  view_count: number;
  version: number;
  source_url?: string | null;
  created_at: string;
  updated_at: string;
}

export const BLOG_CATEGORIES = [
  'Seeksy Updates',
  'Industry Insights',
  'Creator Growth & Monetization',
  'AI Tools & Trends',
  'Podcasting Industry',
  'Meetings & Events Industry',
  'Firecrawl Web Insights',
  'How-To Articles',
  'Partner News'
] as const;

export type BlogCategory = typeof BLOG_CATEGORIES[number];

export const PORTAL_SECTIONS: Record<PortalType, string[]> = {
  admin: [
    'Overview',
    'Monetization',
    'AI Systems',
    'Finance Ops',
    'Meetings & Events',
    'Identity & Verification',
    'Creator Tools'
  ],
  creator: [
    'Getting Started',
    'Monetization',
    'Branding & Identity',
    'Analytics',
    'Studio Tools',
    'Meetings',
    'Growth'
  ],
  board: [
    'Company Health',
    'Capital Strategy',
    '3-Year Pro Forma',
    'Financial Statements',
    'Milestones',
    'Team & Org',
    'Competitive Landscape'
  ]
};

export const PORTAL_LABELS: Record<PortalType, string> = {
  admin: 'Admin Knowledge Blog',
  creator: 'Creator Knowledge Blog',
  board: 'Board Knowledge Blog'
};

export interface BlogRssSource {
  id: string;
  name: string;
  url: string;
  category: string;
  is_active: boolean;
  last_fetched_at: string | null;
  fetch_frequency_hours: number;
  created_at: string;
  updated_at: string;
}

export interface BlogInsight {
  id: string;
  source_url: string | null;
  source_type: string;
  trending_topics: string[];
  sentiment: string | null;
  creator_opportunities: string[];
  revenue_trends: string[];
  strategic_implications: string[];
  cta_suggestions: string[];
  risk_notes: string[];
  raw_content: string | null;
  processed_at: string;
  created_at: string;
}

export interface BlogGenerationJob {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  portal: PortalType;
  category: string;
  source_insight_ids: string[];
  generated_article_id: string | null;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}
