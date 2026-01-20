/**
 * Onboarding step images - professional photography for each user type
 */

import podcasterStudio from '@/assets/onboarding/podcaster-studio.jpg';
import meetingScheduler from '@/assets/onboarding/meeting-scheduler.jpg';
import eventHost from '@/assets/onboarding/event-host.jpg';
import contentCreator from '@/assets/onboarding/content-creator.jpg';
import eventVenue from '@/assets/onboarding/event-venue.jpg';
import teamCollaboration from '@/assets/onboarding/team-collaboration.jpg';
import creatorWorkspace from '@/assets/onboarding/creator-workspace.jpg';
import celebration from '@/assets/onboarding/celebration.jpg';

// Step-based image mapping
export const ONBOARDING_IMAGES = {
  // Step 1: Purpose & Role
  step1: podcasterStudio,
  
  // Step 2: Team & Company Size
  step2: teamCollaboration,
  
  // Step 3: What to manage
  step3: meetingScheduler,
  
  // Step 4: Workflow focus
  step4: contentCreator,
  
  // Step 5: How did you hear
  step5: eventHost,
  
  // Step 6: Integration
  step6: creatorWorkspace,
  
  // Completion/Welcome
  welcome: celebration,
  
  // Focus area images
  podcasting: podcasterStudio,
  meetings: meetingScheduler,
  events: eventHost,
  content: contentCreator,
  venue: eventVenue,
  team: teamCollaboration,
  workspace: creatorWorkspace,
} as const;

// Image for focus area based on selection
export function getImageForFocus(focus: string | null): string {
  switch (focus) {
    case 'Podcasting':
      return ONBOARDING_IMAGES.podcasting;
    case 'Content Creation':
      return ONBOARDING_IMAGES.content;
    case 'Events & Meetings':
      return ONBOARDING_IMAGES.events;
    case 'Marketing & CRM':
      return ONBOARDING_IMAGES.workspace;
    case 'Monetization':
      return ONBOARDING_IMAGES.workspace;
    case 'Analytics':
      return ONBOARDING_IMAGES.meetings;
    case 'Social Media':
      return ONBOARDING_IMAGES.content;
    case 'Team Collaboration':
      return ONBOARDING_IMAGES.team;
    default:
      return ONBOARDING_IMAGES.step1;
  }
}
