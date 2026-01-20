// Modular & Configurable Onboarding Questions System
import { Mic, Star, Building2, Users, Calendar, Briefcase, Store, 
  UserPlus, Headphones, Globe, Instagram, Mail, Zap, DollarSign,
  Video, Scissors, BarChart3, FileText, MessageSquare, Rocket } from "lucide-react";
import React from "react";

export interface OnboardingOption {
  id: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
}

export interface OnboardingQuestionConfig {
  id: string;
  step: number;
  question: string;
  description?: string;
  type: "single" | "multi";
  options: OnboardingOption[];
  columns?: 1 | 2 | 3;
}

// Question 1: Creator Type
export const creatorTypeOptions: OnboardingOption[] = [
  { id: "podcaster", label: "Podcaster", description: "Host audio or video shows" },
  { id: "influencer", label: "Social Media Influencer", description: "Content on social platforms" },
  { id: "speaker", label: "Speaker / Coach", description: "Expert or educator" },
  { id: "event_host", label: "Event Host", description: "Run events & conferences" },
  { id: "entrepreneur", label: "Entrepreneur / Business", description: "Business owner or startup" },
  { id: "agency", label: "Agency", description: "Manage multiple creators" },
  { id: "brand", label: "Brand / Venue", description: "Company or venue looking for creators" },
];

// Question 2: Primary Goal
export const primaryGoalOptions: OnboardingOption[] = [
  { id: "book_guests", label: "Book guests", description: "Find and schedule guests" },
  { id: "host_podcast", label: "Host a podcast", description: "Record and publish shows" },
  { id: "build_page", label: "Build a creator page", description: "Create your public profile" },
  { id: "connect_social", label: "Connect social accounts & analyze growth", description: "Track your metrics" },
  { id: "automate_marketing", label: "Automate marketing", description: "Email & SMS campaigns" },
  { id: "create_content", label: "Create content", description: "Produce media & clips" },
  { id: "monetize", label: "Monetize my audience", description: "Earn from your following" },
];

// Question 3: Tools Interest (Multi-select)
export const toolsOptions: OnboardingOption[] = [
  { id: "studio", label: "Studio", description: "Recording & production" },
  { id: "social-connect", label: "Social Connect", description: "Link social accounts" },
  { id: "audience-insights", label: "Audience Insights", description: "Analytics & demographics" },
  { id: "monetization-hub", label: "Monetization Hub", description: "Revenue & deals" },
  { id: "contacts", label: "Contacts & CRM", description: "Manage relationships" },
  { id: "automations", label: "Email/SMS Automations", description: "Marketing workflows" },
  { id: "my-page", label: "My Page Builder", description: "Public landing page" },
  { id: "events", label: "Events + Scheduling", description: "Calendar & bookings" },
];

// Question 4: Experience Level
export const experienceLevelOptions: OnboardingOption[] = [
  { id: "beginner", label: "Beginner", description: "Just getting started" },
  { id: "intermediate", label: "Intermediate", description: "Some experience" },
  { id: "advanced", label: "Advanced", description: "Experienced creator" },
];

// Question 5: Monetization Status
export const monetizationStatusOptions: OnboardingOption[] = [
  { id: "yes", label: "Yes", description: "Currently earning" },
  { id: "planning", label: "No, but planning to", description: "Want to start soon" },
  { id: "not_yet", label: "Not yet", description: "Focused on growth first" },
];

// Complete question configuration
export const ONBOARDING_QUESTIONS: OnboardingQuestionConfig[] = [
  {
    id: "creator_type",
    step: 1,
    question: "What type of creator are you?",
    description: "This helps us customize your experience",
    type: "single",
    options: creatorTypeOptions,
    columns: 1,
  },
  {
    id: "primary_goal",
    step: 2,
    question: "What do you want to do first?",
    description: "Choose your top priority",
    type: "single",
    options: primaryGoalOptions,
    columns: 1,
  },
  {
    id: "tools",
    step: 3,
    question: "What tools are you interested in using?",
    description: "Select all that apply",
    type: "multi",
    options: toolsOptions,
    columns: 2,
  },
  {
    id: "experience",
    step: 4,
    question: "What is your experience level?",
    type: "single",
    options: experienceLevelOptions,
    columns: 1,
  },
  {
    id: "monetization",
    step: 5,
    question: "Are you monetizing today?",
    type: "single",
    options: monetizationStatusOptions,
    columns: 1,
  },
];

// Recommendation Rules - Easily editable mapping
export interface RecommendationRule {
  creatorTypes: string[];
  modules: string[];
  priority: "core" | "recommended" | "optional";
}

export const RECOMMENDATION_RULES: RecommendationRule[] = [
  // Podcaster recommendations
  { creatorTypes: ["podcaster"], modules: ["studio", "podcasts", "media-library", "my-page", "monetization-hub"], priority: "core" },
  { creatorTypes: ["podcaster"], modules: ["contacts", "campaigns", "identity"], priority: "recommended" },
  
  // Influencer recommendations
  { creatorTypes: ["influencer"], modules: ["social-connect", "audience-insights", "monetization-hub", "my-page"], priority: "core" },
  { creatorTypes: ["influencer"], modules: ["contacts", "campaigns", "studio"], priority: "recommended" },
  
  // Speaker/Coach recommendations
  { creatorTypes: ["speaker"], modules: ["events", "my-page", "contacts", "email-templates"], priority: "core" },
  { creatorTypes: ["speaker"], modules: ["proposals", "forms", "campaigns"], priority: "recommended" },
  
  // Event Host recommendations
  { creatorTypes: ["event_host"], modules: ["events", "contacts", "forms", "campaigns"], priority: "core" },
  { creatorTypes: ["event_host"], modules: ["email-templates", "automations", "analytics"], priority: "recommended" },
  
  // Entrepreneur/Business recommendations
  { creatorTypes: ["entrepreneur"], modules: ["contacts", "campaigns", "forms", "my-page", "events"], priority: "core" },
  { creatorTypes: ["entrepreneur"], modules: ["automations", "segments", "analytics"], priority: "recommended" },
  
  // Agency recommendations
  { creatorTypes: ["agency"], modules: ["team", "proposals", "contacts", "analytics"], priority: "core" },
  { creatorTypes: ["agency"], modules: ["campaigns", "automations", "segments"], priority: "recommended" },
  
  // Brand/Venue recommendations
  { creatorTypes: ["brand"], modules: ["contacts", "campaigns", "analytics", "forms"], priority: "core" },
  { creatorTypes: ["brand"], modules: ["events", "team", "proposals"], priority: "recommended" },
];

// Goal-based module additions
export const GOAL_MODULE_MAP: Record<string, string[]> = {
  book_guests: ["events", "contacts", "forms"],
  host_podcast: ["studio", "podcasts", "media-library"],
  build_page: ["my-page", "identity"],
  connect_social: ["social-connect", "audience-insights", "analytics"],
  automate_marketing: ["automations", "campaigns", "email-templates", "sms"],
  create_content: ["studio", "media-library", "my-page"],
  monetize: ["monetization-hub", "proposals", "contacts"],
};

export type OnboardingAnswers = {
  creatorType: string;
  primaryGoal: string;
  tools: string[];
  experience: string;
  monetization: string;
};
