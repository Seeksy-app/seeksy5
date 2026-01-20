// Newsletter Block Types for drag-and-drop builder

export type BlockType = 
  | 'text'
  | 'image'
  | 'button'
  | 'divider'
  | 'blog-excerpt'
  | 'social-embed'
  | 'product-card'
  | 'poll'
  | 'countdown'
  | 'ad-marker';

export interface NewsletterBlock {
  id: string;
  type: BlockType;
  content: BlockContent;
  order: number;
}

export interface BlockContent {
  // Text block
  text?: string;
  textAlign?: 'left' | 'center' | 'right';
  fontSize?: 'sm' | 'base' | 'lg' | 'xl' | '2xl';
  fontWeight?: 'normal' | 'medium' | 'semibold' | 'bold';
  
  // Image block
  imageUrl?: string;
  imageAlt?: string;
  imageWidth?: number;
  imageLink?: string;
  
  // Button block
  buttonText?: string;
  buttonUrl?: string;
  buttonStyle?: 'primary' | 'secondary' | 'outline';
  buttonAlign?: 'left' | 'center' | 'right';
  
  // Blog excerpt block
  blogPostId?: string;
  blogPostTitle?: string;
  blogPostExcerpt?: string;
  blogPostImage?: string;
  showReadMore?: boolean;
  
  // Social embed block
  platform?: 'twitter' | 'instagram' | 'youtube' | 'tiktok';
  embedUrl?: string;
  embedHtml?: string;
  
  // Product card block
  productName?: string;
  productDescription?: string;
  productPrice?: string;
  productImage?: string;
  productUrl?: string;
  
  // Poll block
  pollQuestion?: string;
  pollOptions?: string[];
  
  // Countdown block
  countdownDate?: string;
  countdownLabel?: string;
  
  // Ad marker block
  adType?: 'cpm' | 'cpc' | 'flat_rate' | 'hybrid';
  adPlacementType?: 'manual' | 'ai_suggested';
  adLabel?: string;
}

export interface NewsletterTemplate {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  blocks: NewsletterBlock[];
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface NewsletterAdPlacement {
  id: string;
  campaign_id: string;
  position_index: number;
  placement_type: 'manual' | 'ai_suggested';
  ad_type: 'cpm' | 'cpc' | 'flat_rate' | 'hybrid';
  advertiser_id?: string;
  ad_content?: any;
  cpm_rate?: number;
  cpc_rate?: number;
  flat_rate?: number;
  is_filled: boolean;
  created_at: string;
  updated_at: string;
}

export interface NewsletterRevenue {
  id: string;
  campaign_id: string;
  user_id: string;
  ad_placement_id?: string;
  revenue_type: 'cpm' | 'cpc' | 'flat_rate';
  gross_amount: number;
  platform_fee: number;
  creator_share: number;
  impressions: number;
  clicks: number;
  period_start?: string;
  period_end?: string;
  created_at: string;
}

// Block definitions for the editor
export const BLOCK_DEFINITIONS: Record<BlockType, { label: string; icon: string; description: string }> = {
  'text': { label: 'Text', icon: 'Type', description: 'Rich text content' },
  'image': { label: 'Image', icon: 'Image', description: 'Single image with optional link' },
  'button': { label: 'Button', icon: 'MousePointer', description: 'Call-to-action button' },
  'divider': { label: 'Divider', icon: 'Minus', description: 'Horizontal line separator' },
  'blog-excerpt': { label: 'Blog Excerpt', icon: 'FileText', description: 'Pull in a blog post' },
  'social-embed': { label: 'Social Embed', icon: 'Share2', description: 'Embed social content' },
  'product-card': { label: 'Product Card', icon: 'ShoppingBag', description: 'Showcase a product' },
  'poll': { label: 'Poll', icon: 'Vote', description: 'Interactive poll' },
  'countdown': { label: 'Countdown', icon: 'Clock', description: 'Countdown timer' },
  'ad-marker': { label: 'Ad Marker', icon: 'DollarSign', description: 'Dynamic ad placement' },
};
