export interface AgentAction {
  type: 'outreach' | 'research' | 'outline' | 'task' | 'schedule' | 'follow_up' | 'create_meeting_type';
  title: string;
  description: string;
  data: Record<string, any>;
  requiresApproval: boolean;
  status?: 'pending' | 'approved' | 'completed' | 'cancelled';
}

export interface AgentMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  actions?: AgentAction[];
  timestamp: Date;
  actionStatus?: 'pending' | 'approved' | 'completed' | 'cancelled';
}

export interface AgentConversation {
  id: string;
  title: string;
  status: 'active' | 'archived' | 'completed';
  episodeId?: string;
  podcastId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface EpisodeWorkspace {
  id: string;
  title: string;
  topic?: string;
  status: 'planning' | 'outreach' | 'confirmed' | 'prep_complete' | 'recorded' | 'published';
  guestInvited: boolean;
  researchComplete: boolean;
  outlineComplete: boolean;
  recordingScheduled: boolean;
  scheduledDate?: Date;
}

export interface GuestResearch {
  id: string;
  guestName: string;
  guestTitle?: string;
  guestCompany?: string;
  guestBio?: string;
  backgroundSummary?: string;
  suggestedQuestions: string[];
  talkingPoints: string[];
  topicBreakdowns: { topic: string; points: string[] }[];
  potentialSoundbites: string[];
}

export interface EpisodeOutline {
  id: string;
  titleSuggestions: string[];
  introScript?: string;
  outroScript?: string;
  sections: {
    title: string;
    summary: string;
    durationMinutes: number;
    talkingPoints?: string[];
  }[];
  guestBioParagraph?: string;
  ctaRecommendations: string[];
  estimatedDurationMinutes?: number;
}
