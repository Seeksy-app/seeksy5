// Local Visibility & Growth App Types

export type ConnectionStatus = 'connected' | 'disconnected' | 'pending' | 'error';
export type HealthStatus = 'good' | 'needs_attention' | 'at_risk';
export type ActionRisk = 'low' | 'medium' | 'high';

export interface Connection {
  id: string;
  provider: 'google_business' | 'search_console' | 'ga4' | 'gtm';
  status: ConnectionStatus;
  accountName?: string;
  accountEmail?: string;
  connectedAt?: string;
  lastSyncAt?: string;
  permissions?: string[];
}

export interface GBPLocation {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone?: string;
  website?: string;
  category: string;
  isVerified: boolean;
  status: 'open' | 'temporarily_closed' | 'permanently_closed';
  coverPhotoUrl?: string;
}

export interface GBPInsights {
  locationId: string;
  periodStart: string;
  periodEnd: string;
  views: number;
  viewsChange: number;
  searches: number;
  searchesChange: number;
  calls: number;
  callsChange: number;
  directions: number;
  directionsChange: number;
  websiteClicks: number;
  websiteClicksChange: number;
}

export interface GBPReview {
  id: string;
  locationId: string;
  reviewerName: string;
  reviewerPhotoUrl?: string;
  rating: number;
  comment: string;
  createdAt: string;
  replied: boolean;
  replyText?: string;
  repliedAt?: string;
  aiSuggestedReply?: string;
}

export interface MediaChecklistItem {
  type: 'logo' | 'cover' | 'interior' | 'exterior' | 'product' | 'team';
  label: string;
  required: boolean;
  uploaded: boolean;
  url?: string;
}

export interface BusinessHours {
  day: string;
  isOpen: boolean;
  openTime?: string;
  closeTime?: string;
}

export interface HolidayHours {
  id: string;
  date: string;
  name: string;
  isOpen: boolean;
  openTime?: string;
  closeTime?: string;
}

export interface LocalSearchQuery {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  positionChange: number; // positive = improved, negative = declined
}

export interface LocalSearchPage {
  url: string;
  title: string;
  clicks: number;
  impressions: number;
  linkedLocation?: string;
}

export interface TrackingHealthCheck {
  id: string;
  checkType: 'ga_present' | 'conversions_firing' | 'phone_clickable' | 'email_clickable' | 'booking_tracked';
  label: string;
  status: 'passing' | 'failing' | 'warning' | 'unknown';
  details?: string;
  aiExplanation?: string;
  lastChecked: string;
}

export interface GrowthAction {
  id: string;
  type: 'review_reply' | 'add_hours' | 'generate_post' | 'create_content' | 'flag_issue';
  title: string;
  description: string;
  estimatedImpact: 'low' | 'medium' | 'high';
  creditCost: number;
  riskLevel: ActionRisk;
  status: 'available' | 'pending_preview' | 'pending_confirmation' | 'in_progress' | 'completed' | 'failed';
  preview?: string;
  relatedEntityId?: string;
  relatedEntityType?: string;
}

export interface ActivityLogEntry {
  id: string;
  timestamp: string;
  type: 'data_pull' | 'user_action' | 'ai_suggestion' | 'executed_change' | 'connection_change';
  title: string;
  description: string;
  metadata?: Record<string, unknown>;
  userId?: string;
  isAI: boolean;
}

export interface VisibilitySummary {
  overallHealth: HealthStatus;
  gbpConnected: boolean;
  searchConsoleConnected: boolean;
  reviewsNeedingResponse: number;
  topInsight: string;
  recommendedActions: GrowthAction[];
  generatedAt: string;
}
