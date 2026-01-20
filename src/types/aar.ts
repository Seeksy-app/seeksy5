export interface Stakeholder {
  name: string;
  role: string;
  organization?: string;
}

export interface PullQuote {
  quote: string;
  attribution: string;
  section: string;
}

export interface SpendItem {
  category: string;
  amount: number;
  notes?: string;
}

export interface TimestampHighlight {
  timestamp: string;
  note: string;
}

// Strict union type for event types
export type AAREventType = 
  | 'meeting' 
  | 'community_event' 
  | 'activation' 
  | 'conference' 
  | 'sponsorship'
  | 'webinar'
  | 'campaign'
  | 'other';

export type AARStatus = 'draft' | 'review' | 'published';
export type AARVisibility = 'internal' | 'client_shareable' | 'public_case_study';

export interface AAR {
  id: string;
  owner_id: string;
  
  // Event Metadata
  event_name: string;
  event_type: AAREventType;
  event_date_start?: string;
  event_date_end?: string;
  time_window?: string;
  location_venue?: string;
  location_city_state?: string;
  hosted_by?: string;
  partner_organizations?: string[];
  program_initiative?: string;
  prepared_by?: string;
  reporting_window?: string;
  is_client_facing: boolean;
  
  // Executive Summary
  executive_summary?: string;
  
  // Purpose & Strategic Alignment
  event_purpose?: string;
  strategic_objectives?: string[];
  brand_esg_gtm_alignment?: string;
  not_designed_for_lead_gen: boolean;
  
  // Event Summary & Stakeholders
  attendance_estimate?: number;
  key_stakeholders: Stakeholder[];
  community_description?: string;
  weather_environmental_notes?: string;
  
  // Wins & Impact
  wins_community_impact?: string;
  wins_relationship_building?: string;
  wins_business_support?: string;
  wins_esg_execution?: string;
  wins_civic_visibility?: string;
  pull_quotes: PullQuote[];
  
  // Metrics & Spend
  financial_spend: SpendItem[];
  total_spend: number;
  attendance_count?: number;
  engagement_scans?: number;
  engagement_interactions?: number;
  leads_generated?: number;
  funnel_views?: number;
  funnel_submissions?: number;
  cvr?: number;
  cpl?: number;
  cltv_benchmark?: number;
  roi_summary?: string;
  
  // Opportunities & Recommendations
  recommendations_repeat?: string[];
  recommendations_expand?: string[];
  recommendations_improve?: string[];
  future_partnership_ideas?: string[];
  
  // Final Assessment
  final_assessment?: string;
  
  // Status & Sharing
  status: AARStatus;
  visibility: AARVisibility;
  share_slug?: string;
  
  // Generated Content
  generated_blog?: string;
  generated_linkedin_article?: string;
  generated_linkedin_post?: string;
  generated_facebook_post?: string;
  generated_instagram_caption?: string;
  generated_at?: string;
  
  created_at: string;
  updated_at: string;
}

export interface AARMedia {
  id: string;
  aar_id: string;
  media_type: 'image' | 'video' | 'audio' | 'document';
  storage_path: string;
  file_name?: string;
  file_size?: number;
  mime_type?: string;
  caption?: string;
  alt_text?: string;
  tooltip?: string;
  seo_keywords?: string[];
  platform_intent?: string[];
  section?: string;
  display_order: number;
  is_featured: boolean;
  is_cover_image: boolean;
  transcript?: string;
  timestamp_highlights: TimestampHighlight[];
  created_at: string;
}

export const AAR_SECTIONS = [
  { id: 'metadata', label: 'Event Details', icon: 'Calendar' },
  { id: 'executive', label: 'Executive Summary', icon: 'FileText' },
  { id: 'purpose', label: 'Purpose & Alignment', icon: 'Target' },
  { id: 'stakeholders', label: 'Stakeholders', icon: 'Users' },
  { id: 'wins', label: 'Wins & Impact', icon: 'Trophy' },
  { id: 'metrics', label: 'Metrics & Spend', icon: 'BarChart3' },
  { id: 'recommendations', label: 'Recommendations', icon: 'Lightbulb' },
  { id: 'assessment', label: 'Final Assessment', icon: 'CheckCircle' },
  { id: 'media', label: 'Media & Assets', icon: 'Image' },
  { id: 'generate', label: 'Generate Content', icon: 'Sparkles' },
] as const;

export type AARSectionId = typeof AAR_SECTIONS[number]['id'];

export const EVENT_TYPES: { value: AAREventType; label: string }[] = [
  { value: 'meeting', label: 'Meeting' },
  { value: 'community_event', label: 'Community Event' },
  { value: 'activation', label: 'Activation' },
  { value: 'conference', label: 'Conference' },
  { value: 'sponsorship', label: 'Sponsorship' },
  { value: 'webinar', label: 'Webinar' },
  { value: 'campaign', label: 'Campaign' },
  { value: 'other', label: 'Other' },
];

export const AAR_STATUS: { value: AARStatus; label: string; color: string }[] = [
  { value: 'draft', label: 'Draft', color: 'bg-muted' },
  { value: 'review', label: 'In Review', color: 'bg-yellow-500' },
  { value: 'published', label: 'Published', color: 'bg-green-500' },
];

export const AAR_VISIBILITY: { value: AARVisibility; label: string }[] = [
  { value: 'internal', label: 'Internal Only' },
  { value: 'client_shareable', label: 'Client Shareable' },
  { value: 'public_case_study', label: 'Public Case Study' },
];
