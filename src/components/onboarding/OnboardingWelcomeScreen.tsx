/**
 * New Welcome Screen - shown after onboarding completion
 * Modern card-based layout with dynamic app recommendations
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { 
  CalendarDays, 
  PartyPopper, 
  Sparkles, 
  User, 
  BarChart3,
  ArrowRight,
  Mic,
  Video,
  Scissors,
  Mail,
  Users,
  FileText,
  CheckCircle2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ONBOARDING_IMAGES } from './OnboardingImages';

interface RecommendedApp {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  gradient: string;
  enabled: boolean;
}

interface OnboardingWelcomeScreenProps {
  firstName?: string;
  onboardingData?: {
    manageFocus?: string;
    workflowFocus?: string;
    role?: string;
  };
  onContinue: () => void;
}

export function OnboardingWelcomeScreen({ 
  firstName = 'there', 
  onboardingData,
  onContinue 
}: OnboardingWelcomeScreenProps) {
  const navigate = useNavigate();
  const [apps, setApps] = useState<RecommendedApp[]>([]);
  const [showAppRecommendations, setShowAppRecommendations] = useState(true);

  // Generate recommended apps based on onboarding answers
  useEffect(() => {
    const recommendedApps = getRecommendedApps(onboardingData);
    setApps(recommendedApps);
  }, [onboardingData]);

  const toggleApp = (id: string) => {
    setApps(prev => prev.map(app => 
      app.id === id ? { ...app, enabled: !app.enabled } : app
    ));
  };

  const handleContinue = async (targetPath?: string) => {
    // Save enabled apps to user_modules
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const enabledApps = apps.filter(app => app.enabled).map(app => app.id);
        
        // Insert enabled modules
        for (const moduleId of enabledApps) {
          await supabase.from('user_modules').upsert({
            user_id: user.id,
            module_id: moduleId,
            is_active: true,
          }, { onConflict: 'user_id,module_id' });
        }

        // Ensure onboarding is marked complete before navigating
        await supabase.from('profiles').update({
          onboarding_completed: true
        }).eq('id', user.id);
        
        // Clear any lingering onboarding localStorage
        localStorage.removeItem('onboarding_step');
        localStorage.removeItem('onboarding_data');
        
        // Set a flag to prevent OnboardingGuard from redirecting back
        sessionStorage.setItem('onboarding_just_completed', 'true');
      }
    } catch (error) {
      console.error('Error saving modules:', error);
    }
    
    // Use window.location for a full page reload to ensure fresh state
    window.location.href = targetPath || '/my-day';
  };

  const quickActions = [
    {
      icon: PartyPopper,
      title: 'Create Your First Event',
      description: 'Host workshops, meetups, or live experiences. Manage registrations effortlessly.',
      path: '/events',
      gradient: 'from-orange-500 to-pink-500',
    },
    {
      icon: CalendarDays,
      title: 'Set Up Meeting Bookings',
      description: 'Share your personalized booking link and let people schedule time with you automatically.',
      path: '/meetings',
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Sparkles,
      title: 'Customize Your Profile',
      description: 'Build a polished landing page with your events, links, and booking tools in one place.',
      path: '/profile/edit',
      gradient: 'from-purple-500 to-indigo-500',
    },
    {
      icon: BarChart3,
      title: 'Create Polls & Sign-Ups',
      description: 'Engage your community, collect feedback, or organize volunteers instantly.',
      path: '/polls',
      gradient: 'from-green-500 to-emerald-500',
    },
  ];

  if (showAppRecommendations && apps.length > 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-2xl"
        >
          <Card className="border-border/50 shadow-2xl overflow-hidden">
            {/* Header with celebration image */}
            <div className="relative h-32 overflow-hidden">
              <img 
                src={ONBOARDING_IMAGES.welcome} 
                alt="Welcome" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
            </div>

            <div className="p-8">
              <div className="text-center mb-8">
                <motion.h1
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-2xl sm:text-3xl font-bold mb-3"
                >
                  Welcome to Seeksy —<br />Recommended Apps for You
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-muted-foreground"
                >
                  Based on your answers, we suggest these tools to get started
                </motion.p>
              </div>

              {/* App toggles */}
              <div className="space-y-3 mb-8">
                {apps.map((app, index) => (
                  <motion.div
                    key={app.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.05 }}
                    className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                      app.enabled 
                        ? 'border-primary/30 bg-primary/5' 
                        : 'border-border bg-muted/30'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${app.gradient} flex items-center justify-center flex-shrink-0`}>
                      <app.icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{app.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{app.description}</p>
                    </div>
                    <Switch
                      checked={app.enabled}
                      onCheckedChange={() => toggleApp(app.id)}
                    />
                  </motion.div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-3">
                <Button 
                  size="lg" 
                  onClick={() => setShowAppRecommendations(false)}
                  className="w-full gap-2"
                >
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowAppRecommendations(false)}
                  className="text-muted-foreground"
                >
                  Skip this step
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Main welcome screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-2xl"
      >
        <Card className="border-border/50 shadow-2xl overflow-hidden">
          {/* Header section */}
          <div className="p-8 pb-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg">
                <CheckCircle2 className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <motion.h1
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-2xl sm:text-3xl font-bold"
                >
                  Hi {firstName}!
                </motion.h1>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-3 text-muted-foreground"
            >
              <p className="text-base leading-relaxed">
                Welcome to <span className="text-foreground font-semibold">Seeksy</span> — your new hub for meetings, events, podcasting, and creator tools.
              </p>
              <p className="text-base leading-relaxed">
                We're excited to help you build, grow, and connect your audience in smarter, easier ways.
              </p>
            </motion.div>
          </div>

          {/* Divider */}
          <div className="px-8">
            <div className="border-t border-border/50" />
          </div>

          {/* Quick actions */}
          <div className="p-8 pt-6">
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-sm font-medium text-muted-foreground mb-4"
            >
              Here are a few great places to start:
            </motion.p>

            <div className="space-y-3">
              {quickActions.map((action, index) => (
                <motion.button
                  key={action.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  whileHover={{ scale: 1.01, x: 4 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => handleContinue(action.path)}
                  className="w-full p-4 rounded-xl border border-border/50 hover:border-primary/30 hover:bg-accent/50 transition-all text-left group flex items-start gap-4"
                >
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${action.gradient} flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-105 transition-transform`}>
                    <action.icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm mb-0.5 group-hover:text-primary transition-colors">
                      {action.title}
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {action.description}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary mt-1 transition-colors" />
                </motion.button>
              ))}
            </div>

            {/* Main CTA */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="mt-8"
            >
              <p className="text-center text-sm text-muted-foreground mb-4">
                Let's get started!
              </p>
              <Button 
                size="lg" 
                onClick={() => handleContinue()}
                className="w-full gap-2 h-12 text-base font-semibold"
              >
                Go to Dashboard
                <ArrowRight className="h-5 w-5" />
              </Button>
            </motion.div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}

// Helper function to get recommended apps based on onboarding data
function getRecommendedApps(data?: { manageFocus?: string; workflowFocus?: string; role?: string }): RecommendedApp[] {
  const allApps: RecommendedApp[] = [
    {
      id: 'podcast-hosting',
      name: 'Podcast Hosting',
      description: 'Host and distribute your podcast',
      icon: Mic,
      gradient: 'from-violet-500 to-purple-500',
      enabled: false,
    },
    {
      id: 'meetings',
      name: 'Meetings & Scheduling',
      description: 'Let people book time with you',
      icon: CalendarDays,
      gradient: 'from-blue-500 to-cyan-500',
      enabled: false,
    },
    {
      id: 'events',
      name: 'Event Creation',
      description: 'Host events and manage registrations',
      icon: PartyPopper,
      gradient: 'from-orange-500 to-pink-500',
      enabled: false,
    },
    {
      id: 'my-page',
      name: 'Creator Profile',
      description: 'Your personal landing page',
      icon: User,
      gradient: 'from-emerald-500 to-green-500',
      enabled: false,
    },
    {
      id: 'ai-clips',
      name: 'AI Clips',
      description: 'Generate social clips automatically',
      icon: Scissors,
      gradient: 'from-pink-500 to-rose-500',
      enabled: false,
    },
    {
      id: 'polls',
      name: 'Polls & Sign-ups',
      description: 'Engage your audience',
      icon: BarChart3,
      gradient: 'from-amber-500 to-orange-500',
      enabled: false,
    },
    {
      id: 'studio',
      name: 'Recording Studio',
      description: 'Record video and audio content',
      icon: Video,
      gradient: 'from-red-500 to-rose-500',
      enabled: false,
    },
    {
      id: 'crm',
      name: 'CRM & Contacts',
      description: 'Manage your contacts and leads',
      icon: Users,
      gradient: 'from-indigo-500 to-blue-500',
      enabled: false,
    },
    {
      id: 'newsletter',
      name: 'Newsletter',
      description: 'Send emails to your audience',
      icon: Mail,
      gradient: 'from-teal-500 to-cyan-500',
      enabled: false,
    },
    {
      id: 'blog',
      name: 'Blog',
      description: 'Publish articles and content',
      icon: FileText,
      gradient: 'from-gray-600 to-gray-500',
      enabled: false,
    },
  ];

  // Enable apps based on focus
  const focus = data?.manageFocus || '';
  const role = data?.role || '';
  
  const recommended: string[] = [];
  
  switch (focus) {
    case 'Podcasting':
      recommended.push('podcast-hosting', 'studio', 'ai-clips', 'my-page');
      break;
    case 'Content Creation':
      recommended.push('studio', 'ai-clips', 'my-page', 'newsletter');
      break;
    case 'Events & Meetings':
      recommended.push('events', 'meetings', 'my-page', 'crm');
      break;
    case 'Marketing & CRM':
      recommended.push('crm', 'newsletter', 'my-page', 'polls');
      break;
    case 'Monetization':
      recommended.push('my-page', 'newsletter', 'crm', 'events');
      break;
    case 'Analytics':
      recommended.push('my-page', 'crm', 'polls', 'newsletter');
      break;
    case 'Social Media':
      recommended.push('ai-clips', 'studio', 'my-page', 'polls');
      break;
    case 'Team Collaboration':
      recommended.push('meetings', 'events', 'crm', 'polls');
      break;
    default:
      recommended.push('my-page', 'meetings', 'events', 'studio');
  }

  // Always add creator profile
  if (!recommended.includes('my-page')) {
    recommended.unshift('my-page');
  }

  return allApps
    .map(app => ({
      ...app,
      enabled: recommended.includes(app.id),
    }))
    .sort((a, b) => {
      // Sort enabled apps first
      if (a.enabled && !b.enabled) return -1;
      if (!a.enabled && b.enabled) return 1;
      return 0;
    })
    .slice(0, 6); // Show max 6 apps
}
