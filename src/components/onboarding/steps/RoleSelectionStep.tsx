import { Card } from '@/components/ui/card';
import { Mic, Megaphone, Users, Calendar, Building, Sparkles, Star, Video } from 'lucide-react';
import { type AccountType } from '@/hooks/useAccountType';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface RoleOption {
  type: AccountType;
  label: string;
  description: string;
  icon: any;
  gradient: string;
  bgGradient: string;
}

// All descriptions exactly 2 lines for uniform card height
const roleOptions: RoleOption[] = [
  {
    type: 'podcaster',
    label: 'Podcaster',
    description: 'Record, distribute, and monetize your podcast',
    icon: Mic,
    gradient: 'from-blue-500 to-cyan-500',
    bgGradient: 'from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30',
  },
  {
    type: 'creator',
    label: 'Content Creator',
    description: 'Create content and grow your audience',
    icon: Sparkles,
    gradient: 'from-purple-500 to-pink-500',
    bgGradient: 'from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30',
  },
  {
    type: 'event_planner',
    label: 'Speaker / Coach',
    description: 'Book sessions and grow your reach',
    icon: Calendar,
    gradient: 'from-indigo-500 to-purple-500',
    bgGradient: 'from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30',
  },
  {
    type: 'studio_team',
    label: 'Event Host',
    description: 'Plan, promote, and host events',
    icon: Video,
    gradient: 'from-orange-500 to-amber-500',
    bgGradient: 'from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30',
  },
  {
    type: 'brand',
    label: 'Entrepreneur',
    description: 'Manage contacts and grow business',
    icon: Building,
    gradient: 'from-cyan-500 to-blue-500',
    bgGradient: 'from-cyan-50 to-blue-50 dark:from-cyan-950/30 dark:to-blue-950/30',
  },
  {
    type: 'agency',
    label: 'Agency',
    description: 'Manage creators and campaigns',
    icon: Users,
    gradient: 'from-green-500 to-emerald-500',
    bgGradient: 'from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30',
  },
  {
    type: 'advertiser',
    label: 'Brand / Venue',
    description: 'Discover creators and sponsors',
    icon: Megaphone,
    gradient: 'from-slate-500 to-gray-500',
    bgGradient: 'from-slate-50 to-gray-50 dark:from-slate-950/30 dark:to-gray-950/30',
  },
  {
    type: 'influencer',
    label: 'Influencer',
    description: 'Grow and monetize your influence',
    icon: Star,
    gradient: 'from-amber-500 to-yellow-500',
    bgGradient: 'from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30',
  },
];

interface RoleSelectionStepProps {
  onSelect: (type: AccountType) => void;
}

export function RoleSelectionStep({ onSelect }: RoleSelectionStepProps) {
  return (
    <div className="space-y-6">
      {/* Gradient header background */}
      <div className="relative">
        <div className="absolute inset-0 -mx-8 -mt-8 h-28 bg-gradient-to-br from-primary/5 via-primary/10 to-transparent rounded-t-3xl" />
        <div className="relative text-center space-y-2 pt-2">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">What brings you to Seeksy?</h1>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Select your primary focus — you can always change this later.
          </p>
        </div>
      </div>

      {/* 4x2 Grid - all cards uniform 160px height */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {roleOptions.map((option, index) => {
          const Icon = option.icon;
          return (
            <motion.div
              key={option.type}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card
                className={cn(
                  "p-5 cursor-pointer transition-all duration-200",
                  "h-[160px]", // Uniform height for all cards
                  "border-2 border-transparent hover:border-primary/50",
                  "shadow-sm hover:shadow-lg rounded-xl",
                  `bg-gradient-to-br ${option.bgGradient}`
                )}
                onClick={() => onSelect(option.type)}
              >
                <div className="flex flex-col items-center text-center gap-3 h-full justify-center">
                  <div className={cn(
                    "p-3 rounded-xl bg-gradient-to-br text-white shadow-md",
                    option.gradient
                  )}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-semibold text-sm">{option.label}</h3>
                    <p className="text-xs text-muted-foreground leading-snug line-clamp-2">
                      {option.description}
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
