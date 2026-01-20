export type SectionType =
  | 'featured_video'
  | 'stream_channel'
  | 'social_links'
  | 'meetings'
  | 'books'
  | 'promo_codes'
  | 'store'
  | 'tips'
  | 'custom_links'
  | 'podcast'
  | 'blog'
  | 'newsletter';

export interface SectionConfig {
  // Featured Video
  videoId?: string;
  videoTitle?: string;
  videoDescription?: string;
  ctaText?: string;
  ctaUrl?: string;

  // Stream Channel
  showPastStreams?: boolean;

  // Social Links
  links?: Array<{
    platform: 'facebook' | 'instagram' | 'x' | 'tiktok' | 'youtube' | 'linkedin' | 'website' | 'custom';
    url: string;
    label?: string;
  }>;

  // Meetings
  meetingTypeId?: string;
  externalUrl?: string;
  title?: string;
  description?: string;

  // Books
  books?: Array<{
    id: string;
    title: string;
    subtitle?: string;
    coverImage: string;
    description: string;
    ctaLabel: string;
    ctaUrl: string;
  }>;

  // Promo Codes
  promoCodes?: Array<{
    id: string;
    title: string;
    code: string;
    description: string;
    ctaLabel: string;
    ctaUrl: string;
    expirationDate?: string;
  }>;

  // Store
  storeMode?: 'shopify' | 'manual';
  shopifyDomain?: string;
  shopifyToken?: string;
  products?: Array<{
    id: string;
    name: string;
    price: number;
    image: string;
    description: string;
    ctaLabel: string;
    ctaUrl: string;
  }>;

  // Tips / Support Me
  tipsEnabled?: boolean;
  tipsMessage?: string;
  tipAmounts?: number[];
  paymentMethods?: Array<{
    type: 'cashapp' | 'venmo' | 'paypal' | 'tipjar';
    username: string;
    url: string;
  }>;

  // Custom Links
  customLinks?: Array<{
    id: string;
    label: string;
    url: string;
    thumbnail?: string;
    groupName?: string;
  }>;

  // Podcast
  podcastId?: string;
  showLatestEpisodes?: boolean;
  episodeCount?: number;

  // Blog
  blogDisplayMode?: 'latest' | 'featured';
  blogPostCount?: number;

  // Newsletter
  newsletterTitle?: string;
  newsletterDescription?: string;
  subscriberListId?: string;
}

export interface MyPageSection {
  id: string;
  user_id: string;
  section_type: SectionType;
  display_order: number;
  is_enabled: boolean;
  config: SectionConfig;
  created_at: string;
  updated_at: string;
}

export const SECTION_TYPE_INFO: Record<SectionType, {
  label: string;
  description: string;
  icon: string;
}> = {
  featured_video: {
    label: 'Featured Video',
    description: 'Highlight a video from your media library',
    icon: '🎬',
  },
  stream_channel: {
    label: 'My Streaming Channel',
    description: 'Show your live streams and replays',
    icon: '📺',
  },
  social_links: {
    label: 'Social Links',
    description: 'Connect your social media profiles',
    icon: '🔗',
  },
  meetings: {
    label: 'Book a Meeting',
    description: 'Let visitors schedule time with you',
    icon: '📅',
  },
  books: {
    label: 'Books',
    description: 'Showcase your published books',
    icon: '📚',
  },
  promo_codes: {
    label: 'Promo Codes',
    description: 'Share discount codes and special offers',
    icon: '🎟️',
  },
  store: {
    label: 'Store',
    description: 'Sell products directly from your page',
    icon: '🛍️',
  },
  tips: {
    label: 'Tips / Support Me',
    description: 'Accept tips and donations from supporters',
    icon: '💰',
  },
  custom_links: {
    label: 'Custom Links',
    description: 'Add unlimited custom links with grouping',
    icon: '🔗',
  },
  podcast: {
    label: 'Podcast',
    description: 'Showcase your podcast and episodes',
    icon: '🎙️',
  },
  blog: {
    label: 'Blog',
    description: 'Display your blog posts',
    icon: '✍️',
  },
  newsletter: {
    label: 'Newsletter',
    description: 'Collect email subscribers',
    icon: '📧',
  },
};
