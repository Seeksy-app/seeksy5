import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { X, ChevronRight, ChevronLeft, Sparkles, BarChart3, Target, TrendingUp, Briefcase, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TourStep {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  targetSelector?: string;
  route?: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

const tourSteps: TourStep[] = [
  {
    id: 'dashboard-kpis',
    title: 'Your Key Metrics',
    description: "Here's your real-time view of Seeksy's creators, usage, and monthly revenue performance.",
    icon: BarChart3,
    route: '/board',
    position: 'center',
  },
  {
    id: 'gtm-strategy',
    title: 'GTM Strategy Overview',
    description: 'Review the full go-to-market plan, channels, and acquisition roadmap.',
    icon: Target,
    route: '/board/gtm',
    position: 'center',
  },
  {
    id: 'proforma',
    title: 'AI-Powered Pro Forma',
    description: 'See AI-generated 3-year financial projections based on R&D benchmarks and scenario analysis.',
    icon: TrendingUp,
    route: '/board/proforma',
    position: 'center',
  },
  {
    id: 'ceo-vto',
    title: 'CEO Action Plan',
    description: "Track leadership's quarterly priorities, KPIs, and company-wide execution plan.",
    icon: Briefcase,
    route: '/board/vto',
    position: 'center',
  },
  {
    id: 'board-ai',
    title: 'Ask Anything',
    description: 'Use the AI Analyst to ask questions about financials, forecasts, market trends, and strategy.',
    icon: MessageSquare,
    position: 'center',
  },
];

const TOUR_STORAGE_KEY = 'seeksy_board_tour_completed';

export function BoardOnboardingTour() {
  // DISABLED: Onboarding tour is permanently disabled
  return null;
}

// Helper to reset tour (for settings)
export function resetBoardTour() {
  localStorage.removeItem(TOUR_STORAGE_KEY);
}
