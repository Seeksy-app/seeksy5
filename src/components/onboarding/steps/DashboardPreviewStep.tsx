import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { type AccountType } from '@/hooks/useAccountType';
import { ArrowLeft, ArrowRight, Mic, Podcast, Calendar, Image, Instagram, PieChart, Layout, Users, Megaphone, Target, Zap, FileText, Play, Star, CheckCircle, Video, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface DashboardPreviewStepProps {
  accountType: AccountType;
  tools: string[];
  onContinue: () => void;
  onBack: () => void;
}

const dashboardConfigs: Record<AccountType, {
  title: string;
  description: string;
  gradient: string;
  icon: any;
  widgets: Array<{ name: string; icon: any; color: string }>;
  quickActions: Array<{ name: string; icon: any }>;
  checklist: string[];
}> = {
  creator: {
    title: 'Creator Dashboard',
    description: 'Your command center for content creation',
    gradient: 'from-purple-500 to-pink-500',
    icon: Sparkles,
    widgets: [
      { name: 'Social Analytics', icon: PieChart, color: 'bg-purple-500' },
      { name: 'Media Library', icon: Image, color: 'bg-blue-500' },
      { name: 'My Page', icon: Layout, color: 'bg-green-500' },
      { name: 'Clips', icon: Play, color: 'bg-orange-500' },
    ],
    quickActions: [
      { name: 'Record Episode', icon: Mic },
      { name: 'Create Clip', icon: Play },
      { name: 'View Analytics', icon: PieChart },
    ],
    checklist: ['Connect socials', 'Upload first media', 'Build your page'],
  },
  podcaster: {
    title: 'Podcaster Dashboard',
    description: 'Everything you need to grow your show',
    gradient: 'from-blue-500 to-cyan-500',
    icon: Mic,
    widgets: [
      { name: 'Studio', icon: Mic, color: 'bg-blue-500' },
      { name: 'Episodes', icon: Podcast, color: 'bg-purple-500' },
      { name: 'Bookings', icon: Calendar, color: 'bg-green-500' },
      { name: 'Media', icon: Image, color: 'bg-orange-500' },
    ],
    quickActions: [
      { name: 'Start Recording', icon: Mic },
      { name: 'New Episode', icon: Podcast },
      { name: 'Schedule Guest', icon: Calendar },
    ],
    checklist: ['Import your podcast', 'Record an episode', 'Invite a guest'],
  },
  influencer: {
    title: 'Influencer Dashboard',
    description: 'Grow your audience and monetize',
    gradient: 'from-amber-500 to-yellow-500',
    icon: Star,
    widgets: [
      { name: 'Social Stats', icon: PieChart, color: 'bg-amber-500' },
      { name: 'Brand Deals', icon: Star, color: 'bg-pink-500' },
      { name: 'Media Library', icon: Image, color: 'bg-blue-500' },
      { name: 'My Page', icon: Layout, color: 'bg-green-500' },
    ],
    quickActions: [
      { name: 'Sync Socials', icon: Instagram },
      { name: 'View Analytics', icon: PieChart },
      { name: 'Create Content', icon: Play },
    ],
    checklist: ['Connect Instagram', 'Build your page', 'Verify identity'],
  },
  advertiser: {
    title: 'Advertiser Dashboard',
    description: 'Launch and track your campaigns',
    gradient: 'from-orange-500 to-red-500',
    icon: Megaphone,
    widgets: [
      { name: 'Campaigns', icon: Megaphone, color: 'bg-orange-500' },
      { name: 'Analytics', icon: PieChart, color: 'bg-blue-500' },
      { name: 'Creators', icon: Users, color: 'bg-green-500' },
      { name: 'Segments', icon: Target, color: 'bg-purple-500' },
    ],
    quickActions: [
      { name: 'New Campaign', icon: Megaphone },
      { name: 'Find Creators', icon: Users },
      { name: 'View Reports', icon: PieChart },
    ],
    checklist: ['Set up company profile', 'Create first campaign', 'Browse creators'],
  },
  agency: {
    title: 'Agency Dashboard',
    description: 'Manage your creators and campaigns',
    gradient: 'from-green-500 to-emerald-500',
    icon: Users,
    widgets: [
      { name: 'Creator Roster', icon: Users, color: 'bg-green-500' },
      { name: 'Brand Campaigns', icon: Megaphone, color: 'bg-orange-500' },
      { name: 'Team Collaboration', icon: Users, color: 'bg-blue-500' },
      { name: 'Usage Rights', icon: FileText, color: 'bg-purple-500' },
      { name: 'Media Performance', icon: PieChart, color: 'bg-amber-500' },
    ],
    quickActions: [
      { name: 'Creators', icon: Users },
      { name: 'Campaigns', icon: Star },
      { name: 'Media Library', icon: Image },
      { name: 'Analytics', icon: PieChart },
    ],
    checklist: ['Add Creators', 'Connect Socials', 'Build Proposal', '+1 more tasks'],
  },
  event_planner: {
    title: 'Event Dashboard',
    description: 'Create and manage your events',
    gradient: 'from-indigo-500 to-purple-500',
    icon: Calendar,
    widgets: [
      { name: 'Events', icon: Calendar, color: 'bg-purple-500' },
      { name: 'Contacts', icon: Users, color: 'bg-blue-500' },
      { name: 'Automations', icon: Zap, color: 'bg-orange-500' },
      { name: 'Analytics', icon: PieChart, color: 'bg-green-500' },
    ],
    quickActions: [
      { name: 'Create Event', icon: Calendar },
      { name: 'View RSVPs', icon: Users },
      { name: 'Send Reminders', icon: Zap },
    ],
    checklist: ['Create your first event', 'Set up registration', 'Invite attendees'],
  },
  brand: {
    title: 'Explorer Dashboard',
    description: 'Discover Seeksy capabilities',
    gradient: 'from-slate-500 to-gray-500',
    icon: Target,
    widgets: [
      { name: 'Social Connect', icon: Instagram, color: 'bg-pink-500' },
      { name: 'Analytics', icon: PieChart, color: 'bg-blue-500' },
      { name: 'Campaigns', icon: Megaphone, color: 'bg-orange-500' },
      { name: 'Creators', icon: Users, color: 'bg-green-500' },
    ],
    quickActions: [
      { name: 'Connect Socials', icon: Instagram },
      { name: 'Browse Creators', icon: Users },
      { name: 'Start Campaign', icon: Megaphone },
    ],
    checklist: ['Explore features', 'Connect a social account', 'Try the studio'],
  },
  studio_team: {
    title: 'Studio Dashboard',
    description: 'Collaborate on productions',
    gradient: 'from-rose-500 to-pink-500',
    icon: Video,
    widgets: [
      { name: 'Studio', icon: Video, color: 'bg-rose-500' },
      { name: 'Media', icon: Image, color: 'bg-purple-500' },
      { name: 'Team', icon: Users, color: 'bg-green-500' },
      { name: 'Clips', icon: Play, color: 'bg-orange-500' },
    ],
    quickActions: [
      { name: 'New Session', icon: Video },
      { name: 'Upload Media', icon: Image },
      { name: 'Team Tasks', icon: Users },
    ],
    checklist: ['Start a recording', 'Upload media', 'Invite team members'],
  },
  admin: {
    title: 'Admin Dashboard',
    description: 'Platform management tools',
    gradient: 'from-gray-500 to-slate-500',
    icon: Zap,
    widgets: [
      { name: 'Team', icon: Users, color: 'bg-blue-500' },
      { name: 'Analytics', icon: PieChart, color: 'bg-purple-500' },
      { name: 'Contacts', icon: Users, color: 'bg-green-500' },
      { name: 'Settings', icon: Zap, color: 'bg-orange-500' },
    ],
    quickActions: [
      { name: 'Manage Users', icon: Users },
      { name: 'View Reports', icon: PieChart },
      { name: 'Settings', icon: Zap },
    ],
    checklist: ['Review users', 'Check analytics', 'Configure settings'],
  },
};

export function DashboardPreviewStep({ accountType, tools, onContinue, onBack }: DashboardPreviewStepProps) {
  const config = dashboardConfigs[accountType];
  const HeaderIcon = config.icon;

  return (
    <div className="space-y-6">
      {/* Large engaging header */}
      <div className="relative text-center">
        <div className="absolute inset-0 -mx-8 -mt-8 h-32 bg-gradient-to-br from-primary/5 via-primary/10 to-transparent rounded-t-3xl" />
        <div className="relative">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", duration: 0.5 }}
            className={cn(
              "inline-flex p-5 rounded-2xl bg-gradient-to-br mb-4 shadow-xl",
              config.gradient
            )}
          >
            <HeaderIcon className="h-10 w-10 text-white" />
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-2xl sm:text-3xl font-bold"
          >
            Your {config.title.replace(' Dashboard', '')} Setup
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground text-base mt-2"
          >
            Here's what we'll set up for you
          </motion.p>
        </div>
      </div>

      {/* Large, engaging content cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-5"
      >
        {/* Dashboard Widgets - pill badges */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-foreground">Dashboard Widgets</h3>
          <div className="flex flex-wrap gap-2">
            {config.widgets.map((widget, index) => (
              <motion.div
                key={widget.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + index * 0.05 }}
              >
                <Badge 
                  variant="secondary" 
                  className="px-4 py-2 text-sm font-medium bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200 transition-colors"
                >
                  {widget.name}
                </Badge>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Quick Navigation - 2x2 grid with icons */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-foreground">Quick Navigation</h3>
          <div className="grid grid-cols-2 gap-3">
            {config.quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <motion.div
                  key={action.name}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.05 }}
                  className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 border border-border/50"
                >
                  <Icon className="h-5 w-5 text-primary" />
                  <span className="font-medium text-sm">{action.name}</span>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Setup Checklist */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-foreground">Setup Checklist</h3>
          <div className="space-y-2">
            {config.checklist.map((item, index) => (
              <motion.div
                key={item}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + index * 0.05 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-background border border-border/50"
              >
                <div className="w-6 h-6 rounded-full border-2 border-primary/50 flex items-center justify-center bg-primary/5">
                  <CheckCircle className="h-4 w-4 text-primary/50" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">{item}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Footer with navigation */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="flex justify-between pt-4 border-t"
      >
        <Button variant="outline" onClick={onBack} size="lg" className="h-11 px-5">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button 
          onClick={onContinue} 
          size="lg" 
          className={cn("h-11 px-6 bg-gradient-to-r shadow-lg hover:shadow-xl transition-shadow", config.gradient, "text-white")}
        >
          Continue
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </motion.div>
    </div>
  );
}
